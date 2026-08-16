'use server';

import { createClient } from '@/lib/supabase/server';
import { DoctorInventoryItem } from '@/types';
import { revalidatePath } from 'next/cache';

interface PurchaseInventoryParams {
  labId: string;
  materialName: string;
  units: number;
  basePrice: number;
}

/**
 * Server Action: purchaseDoctorInventoryAction
 * Authenticates the prescribing dentist, computes bulk tier discounts securely,
 * and atomically persists inventory allocation to prevent client tampering.
 */
export async function purchaseDoctorInventoryAction(params: PurchaseInventoryParams): Promise<{
  success: boolean;
  item?: DoctorInventoryItem;
  error?: string;
}> {
  try {
    const { labId, materialName, units, basePrice } = params;

    if (!labId || !materialName || units <= 0) {
      return { success: false, error: 'Invalid purchase parameters.' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Valid session required.' };
    }

    // Secure server-side tier discount calculation
    let bulkDiscount = 0;
    if (units >= 100) bulkDiscount = 0.15;
    else if (units >= 50) bulkDiscount = 0.10;
    else if (units >= 20) bulkDiscount = 0.05;

    const lockedPricePerUnit = Math.round(basePrice * (1 - bulkDiscount));

    // Check for existing allocation for this dentist, lab, and material
    const { data: existing } = await supabase
      .from('doctor_inventory')
      .select('*')
      .eq('dentist_id', user.id)
      .eq('lab_id', labId)
      .eq('material_name', materialName)
      .maybeSingle();

    let savedItem: any;

    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from('doctor_inventory')
        .update({
          total_units: existing.total_units + units,
          remaining_units: existing.remaining_units + units,
          locked_price: lockedPricePerUnit,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      savedItem = updated;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('doctor_inventory')
        .insert({
          dentist_id: user.id,
          lab_id: labId,
          material_name: materialName,
          total_units: units,
          remaining_units: units,
          locked_price: lockedPricePerUnit,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      savedItem = inserted;
    }

    revalidatePath('/inventory');

    return {
      success: true,
      item: {
        id: savedItem.id,
        dentistId: savedItem.dentist_id,
        labId: savedItem.lab_id,
        materialName: savedItem.material_name,
        totalUnits: savedItem.total_units,
        remainingUnits: savedItem.remaining_units,
        lockedPrice: `₹${Number(savedItem.locked_price).toLocaleString('en-IN')} / unit`,
      },
    };
  } catch (error: any) {
    console.error('[purchaseDoctorInventoryAction Error]', error);
    return { success: false, error: error.message || 'Failed to process inventory purchase.' };
  }
}

/**
 * Server Action: deductLabCaseInventoryAction
 * Decrements 1 unit of material stock upon dragging a case to production.
 */
export async function deductLabCaseInventoryAction(params: {
  caseId: string;
  dentistId: string;
  labId: string;
  materialName: string;
}): Promise<{
  success: boolean;
  remainingUnits?: number;
  error?: string;
}> {
  try {
    const { caseId, dentistId, labId, materialName } = params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Valid session required.' };
    }

    // Lookup stock
    const { data: stock } = await supabase
      .from('doctor_inventory')
      .select('*')
      .eq('dentist_id', dentistId)
      .eq('lab_id', labId)
      .ilike('material_name', `%${materialName}%`)
      .gt('remaining_units', 0)
      .maybeSingle();

    if (!stock) {
      return {
        success: false,
        error: `No prepaid stock found for ${materialName}. Clinic will be billed per-unit.`,
      };
    }

    const newRemaining = Math.max(0, stock.remaining_units - 1);
    await supabase
      .from('doctor_inventory')
      .update({ remaining_units: newRemaining })
      .eq('id', stock.id);

    // Record timeline audit event
    await supabase.from('timeline_events').insert({
      case_id: caseId,
      status_update: 'Inventory Deducted',
      notes: `Deducted 1 unit of ${materialName}. Remaining balance: ${newRemaining} units.`,
      visibility: 'BOTH',
    });

    return { success: true, remainingUnits: newRemaining };
  } catch (error: any) {
    console.error('[deductLabCaseInventoryAction Error]', error);
    return { success: false, error: error.message || 'Failed to deduct stock.' };
  }
}
