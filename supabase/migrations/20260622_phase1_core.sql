-- Phase 1 Core Infrastructure & Relational Security Migration

-- Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create robust Users/Profiles table tied to Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('DENTIST', 'LAB_ADMIN', 'LAB_STAFF')) NOT NULL,
    lab_id UUID, -- Null if role is DENTIST
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Cases table with Anonymization (no PHI)
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dentist_id UUID REFERENCES public.profiles(id) NOT NULL,
    lab_id UUID REFERENCES public.profiles(id) NOT NULL,
    patient_hash TEXT NOT NULL, -- The anonymized hash for the lab
    status VARCHAR(50) DEFAULT 'PENDING',
    urgency VARCHAR(20) DEFAULT 'NORMAL',
    requested_treatment TEXT NOT NULL,
    material TEXT,
    scan_url TEXT NOT NULL, -- Path in Cloudflare R2
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Patient PHI Table (Strictly isolated)
CREATE TABLE IF NOT EXISTS public.patient_phi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES public.profiles(id) NOT NULL,
    real_name TEXT NOT NULL,
    encrypted_dob TEXT, -- For future-proofing compliance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_phi ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Cases Policies (The magic of B2B separation)
CREATE POLICY "Dentists can view and update their own cases"
ON public.cases FOR ALL 
USING (auth.uid() = dentist_id);

CREATE POLICY "Labs can view and update cases assigned to them"
ON public.cases FOR ALL 
USING (
    lab_id IN (
        SELECT id FROM public.profiles WHERE id = auth.uid() AND role IN ('LAB_ADMIN', 'LAB_STAFF')
    )
    OR
    lab_id IN (
        SELECT lab_id FROM public.profiles WHERE id = auth.uid() AND role IN ('LAB_ADMIN', 'LAB_STAFF')
    )
);

-- Patient PHI Policies (HIPAA/GDPR Core)
CREATE POLICY "Strict isolation: Only the prescribing dentist can read/write PHI"
ON public.patient_phi FOR ALL
USING (auth.uid() = dentist_id);
