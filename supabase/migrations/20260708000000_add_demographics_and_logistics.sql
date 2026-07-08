-- Phase 1: Add Demographics and Implant details to cases table
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS patient_age INTEGER,
ADD COLUMN IF NOT EXISTS patient_gender TEXT CHECK (patient_gender IN ('MALE', 'FEMALE')),
ADD COLUMN IF NOT EXISTS implant_brand TEXT,
ADD COLUMN IF NOT EXISTS scan_body_model TEXT,
ADD COLUMN IF NOT EXISTS analog_logistics TEXT;

-- Phase 4: Add Logistics details for Proposed Due Date acknowledgment flow
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS proposed_due_date DATE,
ADD COLUMN IF NOT EXISTS due_date_proposals_count INTEGER DEFAULT 0;
