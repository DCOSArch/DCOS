-- Migration to update inventory deduction trigger to support DRAFT status
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_case()
RETURNS TRIGGER AS $$
BEGIN
  -- Deduct 1 from remaining_units only if:
  -- 1. It is a new case and status is not DRAFT
  -- 2. It is an updated case and status changed from DRAFT to a non-draft status (e.g. PENDING)
  IF (TG_OP = 'INSERT' AND NEW.status != 'DRAFT') OR 
     (TG_OP = 'UPDATE' AND OLD.status = 'DRAFT' AND NEW.status != 'DRAFT') THEN
     
    UPDATE public.doctor_inventory
    SET remaining_units = remaining_units - 1
    WHERE dentist_id = NEW.dentist_id 
      AND lab_id = NEW.lab_id 
      AND material_name = NEW.material
      AND remaining_units > 0;
      
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_deduct_inventory ON public.cases;
CREATE TRIGGER trigger_deduct_inventory
  AFTER INSERT OR UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.deduct_inventory_on_case();
