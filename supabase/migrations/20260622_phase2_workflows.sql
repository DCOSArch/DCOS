-- Phase 2: Dual Workflows & Inventory Automation Migration

-- 1. Create Timeline Events Table with Dual-Layer Visibility
CREATE TYPE timeline_visibility AS ENUM ('INTERNAL', 'EXTERNAL', 'BOTH');

CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id), -- Person who triggered the event
    status_update VARCHAR(50) NOT NULL,
    notes TEXT,
    visibility timeline_visibility DEFAULT 'BOTH',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Timeline Events
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Dentists can only see EXTERNAL or BOTH events for their own cases
CREATE POLICY "Dentists see external timeline"
ON public.timeline_events FOR SELECT
USING (
    visibility IN ('EXTERNAL', 'BOTH') 
    AND 
    case_id IN (SELECT id FROM public.cases WHERE dentist_id = auth.uid())
);

-- Labs can see all timeline events (INTERNAL, EXTERNAL, BOTH) for their assigned cases
CREATE POLICY "Labs see full internal timeline"
ON public.timeline_events FOR SELECT
USING (
    case_id IN (
        SELECT id FROM public.cases WHERE lab_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT lab_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

-- 2. Digital Inventory Setup & Sync
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID REFERENCES public.profiles(id) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    threshold INTEGER DEFAULT 10,
    unit VARCHAR(20) DEFAULT 'units',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lab_id, sku)
);

-- Transaction Log for Audit Trail
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    quantity_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Inventory
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labs can manage their own inventory"
ON public.inventory_items FOR ALL
USING (
    lab_id IN (
        SELECT id FROM public.profiles WHERE id = auth.uid()
        UNION
        SELECT lab_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Labs can view their inventory transactions"
ON public.inventory_transactions FOR SELECT
USING (
    inventory_id IN (
        SELECT id FROM public.inventory_items WHERE lab_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT lab_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

-- 3. Kanban to Inventory Sync via RPC/Trigger
-- This function safely decrements inventory and logs the transaction.
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_case(
    p_case_id UUID,
    p_sku VARCHAR(100),
    p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to safely bypass some RLS during system action
AS $$
DECLARE
    v_lab_id UUID;
    v_inventory_id UUID;
    v_current_qty INTEGER;
BEGIN
    -- Get lab_id from the case
    SELECT lab_id INTO v_lab_id FROM public.cases WHERE id = p_case_id;
    
    IF v_lab_id IS NULL THEN
        RAISE EXCEPTION 'Case not found';
    END IF;

    -- Find matching inventory item for this lab and lock the row
    SELECT id, quantity INTO v_inventory_id, v_current_qty
    FROM public.inventory_items
    WHERE lab_id = v_lab_id AND sku = p_sku
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
        -- Material not tracked or doesn't exist, we can just return true or fail.
        -- For robust systems, log a warning, but here we just return false.
        RETURN FALSE;
    END IF;

    IF v_current_qty < p_quantity THEN
        RAISE EXCEPTION 'Insufficient inventory for SKU: %', p_sku;
    END IF;

    -- Deduct
    UPDATE public.inventory_items
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE id = v_inventory_id;

    -- Log transaction
    INSERT INTO public.inventory_transactions (inventory_id, case_id, quantity_change, reason)
    VALUES (v_inventory_id, p_case_id, -p_quantity, 'Case moved to IN_PROGRESS');

    -- Auto-generate an internal timeline event
    INSERT INTO public.timeline_events (case_id, status_update, notes, visibility)
    VALUES (p_case_id, 'Material Allocated', 'Deducted ' || p_quantity || ' unit(s) of ' || p_sku, 'INTERNAL');

    RETURN TRUE;
END;
$$;
