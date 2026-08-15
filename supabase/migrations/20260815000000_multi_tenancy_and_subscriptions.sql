-- ==============================================================================
-- DENTALCONNECT OS (DCOS) 2.0: MULTI-TENANCY & TIER SUBSCRIPTION MIGRATION
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM ('CLINIC', 'LAB', 'DSO_NETWORK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE org_member_role AS ENUM ('OWNER', 'ADMIN', 'DENTIST', 'TECHNICIAN', 'RECEPTIONIST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('STARTER', 'PRO_LAB', 'ENTERPRISE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Organizations Table (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type organization_type NOT NULL DEFAULT 'CLINIC',
  slug TEXT UNIQUE NOT NULL,
  billing_email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Organization Memberships Table (Multi-Doctor / Staff mapping)
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role org_member_role NOT NULL DEFAULT 'DENTIST',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 4. Subscriptions & Entitlements Table (Tier Enforcement)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  tier subscription_tier NOT NULL DEFAULT 'STARTER',
  status subscription_status NOT NULL DEFAULT 'ACTIVE',
  cases_used_this_period INTEGER NOT NULL DEFAULT 0,
  case_limit INTEGER NOT NULL DEFAULT 20, -- 20 for Starter, -1 for Pro/Enterprise
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  features JSONB NOT NULL DEFAULT '{
    "dicom_mpr": false,
    "cad_bridge": false,
    "whatsapp_automation": false,
    "unlimited_cases": false,
    "hardware_bridge": false,
    "ai_margin_detection": false,
    "merkle_audit": false,
    "custom_sso": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Add organization_id column to existing domain tables
DO $$ BEGIN
  ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
EXCEPTION
  WHEN others THEN null;
END $$;

-- 6. Helper Security Functions
CREATE OR REPLACE FUNCTION public.get_auth_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id
  FROM public.organization_memberships
  WHERE user_id = auth.uid();
$$;

-- 7. Enable RLS on Tenant Tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
-- Organizations
CREATE POLICY "Users can view organizations they belong to"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT public.get_auth_organization_ids()));

CREATE POLICY "Org Admins & Owners can update organization profile"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

-- Memberships
CREATE POLICY "Members can view other members in their organization"
  ON public.organization_memberships FOR SELECT
  USING (organization_id IN (SELECT public.get_auth_organization_ids()));

-- Subscriptions
CREATE POLICY "Members can view their organization subscription"
  ON public.subscriptions FOR SELECT
  USING (organization_id IN (SELECT public.get_auth_organization_ids()));

-- Patients: Tenant-scoped access
CREATE POLICY "Members can view patients belonging to their organization"
  ON public.patients FOR SELECT
  USING (
    organization_id IN (SELECT public.get_auth_organization_ids())
    OR dentist_id = auth.uid()
  );

CREATE POLICY "Members can insert patients into their organization"
  ON public.patients FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT public.get_auth_organization_ids())
    OR dentist_id = auth.uid()
  );

-- Cases: Tenant-scoped access
CREATE POLICY "Tenant members and assigned labs can access cases"
  ON public.cases FOR SELECT
  USING (
    organization_id IN (SELECT public.get_auth_organization_ids())
    OR dentist_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.users WHERE lab_id = cases.lab_id)
  );
