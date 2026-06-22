import { createClient } from '@/src/lib/supabase/client';

export interface LabService {
  id: string;
  category: string;
  service_name: string;
  turnaround_days: number;
  price: number;
}

/**
 * Fetches the active Rx catalog (services) for a specific laboratory.
 * This populates the "Create Case" dropdown dynamically.
 */
export async function fetchLabServices(labId: string): Promise<LabService[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('lab_services')
    .select('id, category, service_name, turnaround_days, price')
    .eq('lab_id', labId)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('service_name', { ascending: true });

  if (error) {
    console.error('Error fetching lab services:', error);
    return [];
  }

  return data as LabService[];
}
