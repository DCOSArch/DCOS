import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually without dotenv
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function queryTable(tableName: string, queryParams: string = 'select=*&limit=5') {
  const url = `${supabaseUrl}/rest/v1/${tableName}?${queryParams}`;
  const res = await fetch(url, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    }
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return { status: res.status, ok: res.ok, data: json };
  } catch (e) {
    return { status: res.status, ok: res.ok, raw: text };
  }
}

async function main() {
  console.log('📡 [DIRECT LIVE SUPABASE API VERIFICATION]');
  console.log('Target Project URL:', supabaseUrl);
  console.log('----------------------------------------------------');

  // 1. Check users
  const users = await queryTable('users', 'select=id,name,role,lab_id&limit=3');
  console.log('1. Users Table:', { ok: users.ok, status: users.status, sample: users.data });

  // 2. Check lab_profiles
  const labs = await queryTable('lab_profiles', 'select=id,name,rating,reviews_count&limit=3');
  console.log('2. Lab Profiles Table:', { ok: labs.ok, status: labs.status, sample: labs.data });

  // 3. Check lab_services
  const services = await queryTable('lab_services', 'select=id,category,service_name,price&limit=3');
  console.log('3. Lab Services Table:', { ok: services.ok, status: services.status, sample: services.data });

  // 4. Check cases
  const cases = await queryTable('cases', 'select=id,status,patient_name,dentist_id,lab_id&limit=3');
  console.log('4. Cases Table:', { ok: cases.ok, status: cases.status, sample: cases.data });

  // 5. Check tooth_charts
  const charts = await queryTable('tooth_charts', 'select=id,patient_id&limit=3');
  console.log('5. Tooth Charts Table:', { ok: charts.ok, status: charts.status, result: charts.data });

  // 6. Check profiles
  const profiles = await queryTable('profiles', 'select=id,name,role&limit=3');
  console.log('6. Profiles Entity:', { ok: profiles.ok, status: profiles.status, sample: profiles.data });
  
  console.log('----------------------------------------------------');
  console.log('🏁 LIVE SUPABASE VERIFICATION COMPLETE.');
}

main().catch(console.error);
