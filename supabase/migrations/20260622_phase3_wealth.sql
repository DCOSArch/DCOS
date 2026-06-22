-- Phase 3: The Wealth Multipliers Migration

-- 1. Spatial Annotations Table
CREATE TABLE IF NOT EXISTS public.spatial_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) NOT NULL,
    text_note TEXT NOT NULL,
    pos_x FLOAT NOT NULL,
    pos_y FLOAT NOT NULL,
    pos_z FLOAT NOT NULL,
    norm_x FLOAT,
    norm_y FLOAT,
    norm_z FLOAT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Annotations
ALTER TABLE public.spatial_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view annotations for their cases"
ON public.spatial_annotations FOR SELECT
USING (
    case_id IN (
        SELECT id FROM public.cases WHERE dentist_id = auth.uid()
        UNION
        SELECT id FROM public.cases WHERE lab_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT lab_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Users can create annotations on their cases"
ON public.spatial_annotations FOR INSERT
WITH CHECK (
    case_id IN (
        SELECT id FROM public.cases WHERE dentist_id = auth.uid()
        UNION
        SELECT id FROM public.cases WHERE lab_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT lab_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

-- 2. Dynamic Digital Rx Catalogs (Lab Services)
CREATE TABLE IF NOT EXISTS public.lab_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- e.g., 'Crowns', 'Bridges', 'Implants'
    service_name VARCHAR(100) NOT NULL,
    turnaround_days INTEGER NOT NULL DEFAULT 5,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Lab Services
ALTER TABLE public.lab_services ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view lab services (Dentists need this to populate dropdowns)
CREATE POLICY "Public can view active lab services"
ON public.lab_services FOR SELECT
USING (is_active = TRUE);

-- Only the lab admin can edit their own services
CREATE POLICY "Labs can manage their own services"
ON public.lab_services FOR ALL
USING (
    lab_id IN (
        SELECT id FROM public.profiles WHERE id = auth.uid()
        UNION
        SELECT lab_id FROM public.profiles WHERE id = auth.uid()
    )
);
