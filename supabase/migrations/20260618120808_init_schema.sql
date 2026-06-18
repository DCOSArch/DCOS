-- Dental Lab Management Platform Initial Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('DENTIST', 'LAB_ADMIN', 'LAB_STAFF')),
  lab_id uuid,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Lab Profiles Table
CREATE TABLE public.lab_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  services text[] DEFAULT '{}',
  pricing text,
  turnaround_time text,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now()
);

-- Cases Table
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_name text NOT NULL,
  dentist_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES public.lab_profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'DISPATCHED', 'DELIVERED')),
  urgency text NOT NULL CHECK (urgency IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  requested_treatment text NOT NULL,
  material text,
  created_at timestamptz DEFAULT now(),
  due_date timestamptz NOT NULL
);

-- Timeline Events Table
CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  status_update text NOT NULL,
  notes text,
  "timestamp" timestamptz DEFAULT now(),
  visibility text NOT NULL CHECK (visibility IN ('INTERNAL', 'EXTERNAL', 'BOTH'))
);

-- Inventory Items Table
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id uuid NOT NULL REFERENCES public.lab_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  quantity numeric DEFAULT 0,
  threshold numeric DEFAULT 0,
  unit text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Draft for Phase 1)
-- Users can see their own data
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- Dentists can see cases they created, Labs can see cases assigned to them
-- (Assuming auth.uid() maps to users.id)
CREATE POLICY "Dentists and Labs can view their relevant cases" ON public.cases 
  FOR SELECT USING (
    auth.uid() = dentist_id OR 
    auth.uid() IN (SELECT id FROM public.users WHERE lab_id = cases.lab_id)
  );

-- Everyone can view lab profiles
CREATE POLICY "Lab profiles are public" ON public.lab_profiles FOR SELECT USING (true);

-- Labs can view their own inventory
CREATE POLICY "Labs can view their inventory" ON public.inventory_items 
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE lab_id = inventory_items.lab_id)
  );
