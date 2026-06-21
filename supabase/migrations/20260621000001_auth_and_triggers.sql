-- ==========================================
-- 03_auth_and_triggers.sql
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. Auto-create user profile from auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_lab_id uuid;
BEGIN
  -- If role is LAB_ADMIN, they might provide a lab_name to create a new lab profile
  IF NEW.raw_user_meta_data->>'role' = 'LAB_ADMIN' THEN
    -- In a full implementation, you'd insert the lab profile here if 'lab_name' exists
    -- For simplicity, assuming lab_id might be provided or handled in app logic.
    -- If lab_name is in meta, create a dummy lab profile to attach
    IF NEW.raw_user_meta_data->>'lab_name' IS NOT NULL THEN
      INSERT INTO public.lab_profiles (name)
      VALUES (NEW.raw_user_meta_data->>'lab_name')
      RETURNING id INTO new_lab_id;
    END IF;
  END IF;

  INSERT INTO public.users (id, name, role, lab_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'role',
    COALESCE(new_lab_id, (NEW.raw_user_meta_data->>'lab_id')::uuid)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Auto-create order chat when a case is created
CREATE OR REPLACE FUNCTION public.handle_new_case_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.order_chats (case_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_case_created_create_chat ON public.cases;
CREATE TRIGGER on_case_created_create_chat
  AFTER INSERT ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_case_chat();


-- 3. Auto-deduct inventory when a case is placed
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_case()
RETURNS TRIGGER AS $$
BEGIN
  -- Deduct 1 from remaining_units where dentist, lab, and material match
  -- AND they have remaining units.
  UPDATE public.doctor_inventory
  SET remaining_units = remaining_units - 1
  WHERE dentist_id = NEW.dentist_id 
    AND lab_id = NEW.lab_id 
    AND material_name = NEW.material
    AND remaining_units > 0;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_deduct_inventory ON public.cases;
CREATE TRIGGER trigger_deduct_inventory
  AFTER INSERT ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.deduct_inventory_on_case();
