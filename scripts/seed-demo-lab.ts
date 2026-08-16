import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local natively
if (fs.existsSync(path.resolve('.env.local'))) {
  const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase environment variables missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDemoLab() {
  console.log('🚀 [DCOS Sales Ops] Seeding Reproducible Demo Environment...');

  // 1. Seed Demo Lab Profile
  const demoLabId = 'b80e9a7a-9bd5-4e1d-bd6a-b22ea5900565';
  const demoDentistId = 'd80e9a7a-9bd5-4e1d-bd6a-b22ea5900111';

  console.log('📦 Upserting Demo User Profiles...');
  await supabase.from('users').upsert([
    {
      id: demoLabId,
      email: 'lab@precisiondental.com',
      name: 'Precision Dental Lab (Demo)',
      role: 'LAB',
      created_at: new Date().toISOString(),
    },
    {
      id: demoDentistId,
      email: 'alex@morganclinic.com',
      name: 'Dr. Alex Morgan (Morgan Dental)',
      role: 'DENTIST',
      created_at: new Date().toISOString(),
    },
  ]);

  // 2. Seed Demo Patients
  console.log('👤 Seeding Demo Patients...');
  const demoPatients = [
    {
      id: 'pat_demo_01',
      dentist_id: demoDentistId,
      name: 'Eleanor Vance',
      age: 28,
      gender: 'FEMALE',
      phone: '+1 415 555 0192',
      medical_history: 'No known drug allergies. Good periodontal health.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pat_demo_02',
      dentist_id: demoDentistId,
      name: 'Marcus Sterling',
      age: 44,
      gender: 'MALE',
      phone: '+1 415 555 0184',
      medical_history: 'Bruxism history. Prescribed high-strength monolithic zirconia.',
      created_at: new Date().toISOString(),
    },
  ];

  for (const pat of demoPatients) {
    await supabase.from('patients').upsert(pat);
  }

  // 3. Seed Demo Inventory Credits
  console.log('💎 Seeding Doctor Prepaid Stock Allocations...');
  await supabase.from('doctor_inventory').upsert([
    {
      id: 'di_demo_zirconia',
      dentist_id: demoDentistId,
      lab_id: demoLabId,
      material_name: 'Zirconia HT Monolithic Block Credit',
      total_units: 25,
      remaining_units: 18,
      locked_price: 2450,
    },
    {
      id: 'di_demo_emax',
      dentist_id: demoDentistId,
      lab_id: demoLabId,
      material_name: 'IPS e.max Lithium Disilicate Credit',
      total_units: 15,
      remaining_units: 12,
      locked_price: 3200,
    },
  ]);

  // 4. Seed Demo Cases (One in Incoming, One in Production, One Delivered)
  console.log('📋 Seeding Demo Production Cases...');
  const demoCases = [
    {
      id: 'case_demo_incoming_01',
      dentist_id: demoDentistId,
      lab_id: demoLabId,
      patient_id: 'pat_demo_01',
      patient_name: 'Eleanor Vance',
      patient_age: 28,
      patient_gender: 'FEMALE',
      requested_treatment: 'Anterior Aesthetic Crown #11',
      material: 'Zirconia HT',
      shade: 'A2',
      selected_teeth: [11],
      urgency: 'STANDARD',
      status: 'SUBMITTED',
      due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      instructions: 'Please match natural translucency of tooth #21. Incisal edge 0.5mm clear.',
      scan_url: `${demoLabId}/1786817514085_restoration_31_upper.stl`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'case_demo_prod_02',
      dentist_id: demoDentistId,
      lab_id: demoLabId,
      patient_id: 'pat_demo_02',
      patient_name: 'Marcus Sterling',
      patient_age: 44,
      patient_gender: 'MALE',
      requested_treatment: 'Full Contour Molar Crown #16',
      material: 'Zirconia HT',
      shade: 'A3.5',
      selected_teeth: [16],
      urgency: 'RUSH',
      status: 'IN_PROGRESS',
      due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      instructions: 'Heavy occlusal load. Maintain minimum 1.5mm occlusal clearance.',
      scan_url: `${demoLabId}/1786817514085_restoration_31_upper.stl`,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  for (const c of demoCases) {
    await supabase.from('cases').upsert(c);
  }

  console.log('✅ Demo Environment Successfully Seeded!');
  console.log('🎥 Ready for 90-Sec Loom & Live Discovery Pitches.');
}

seedDemoLab().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
