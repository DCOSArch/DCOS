-- Create patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  medical_history TEXT,
  contact_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add patient_id to cases table
ALTER TABLE cases ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- Enable RLS on patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policies for patients
CREATE POLICY "Dentists can view their own patients"
ON patients FOR SELECT
USING (auth.uid() = dentist_id);

CREATE POLICY "Dentists can insert their own patients"
ON patients FOR INSERT
WITH CHECK (auth.uid() = dentist_id);

CREATE POLICY "Dentists can update their own patients"
ON patients FOR UPDATE
USING (auth.uid() = dentist_id)
WITH CHECK (auth.uid() = dentist_id);

CREATE POLICY "Dentists can delete their own patients"
ON patients FOR DELETE
USING (auth.uid() = dentist_id);

-- Lab users can view patients linked to cases assigned to them
CREATE POLICY "Lab staff can view patients for their cases"
ON patients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.patient_id = patients.id
    AND cases.lab_id = auth.uid()
  )
);
