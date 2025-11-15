import { supabase } from '@/lib/supabase';

export interface MaintenanceRecordInput {
  record_number?: string;
  bus_id: string;
  type: string;
  date: string;
  description: string;
  work_performed?: string;
  parts_replaced?: any[];
  cost?: number;
  odometer_reading?: number;
  next_service_km?: number;
  next_service_date?: string;
  performed_by?: string;
  vendor?: string;
  downtime_hours?: number;
  notes?: string;
}

/**
 * Validates that a bus exists in the database
 */
export async function validateBusExists(busId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('buses')
    .select('id')
    .eq('id', busId)
    .single();
  
  return !error && !!data;
}

/**
 * Validates that a profile/user exists in the database
 */
export async function validateProfileExists(profileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .single();
  
  return !error && !!data;
}

/**
 * Fetches valid maintenance type enum values from the database
 */
export async function getMaintenanceTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_enum_values', { enum_name: 'maintenance_type' });
    
    if (error) {
      // Fallback to hardcoded values if RPC doesn't exist
      return [
        'OIL_CHANGE',
        'TIRE_ROTATION',
        'BRAKE_SERVICE',
        'ENGINE_REPAIR',
        'TRANSMISSION_SERVICE',
        'ELECTRICAL_REPAIR',
        'BODY_WORK',
        'INSPECTION',
        'CLEANING',
        'OTHER'
      ];
    }
    return data || [];
  } catch (error) {
    console.error('Failed to fetch maintenance types:', error);
    return [
      'OIL_CHANGE',
      'TIRE_ROTATION',
      'BRAKE_SERVICE',
      'ENGINE_REPAIR',
      'TRANSMISSION_SERVICE',
      'ELECTRICAL_REPAIR',
      'BODY_WORK',
      'INSPECTION',
      'CLEANING',
      'OTHER'
    ];
  }
}

/**
 * Generates the next sequential record number
 */
export async function generateRecordNumber(): Promise<string> {
  const { data: lastRecord } = await supabase
    .from('maintenance_records')
    .select('record_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const lastNumber = lastRecord?.record_number 
    ? parseInt(lastRecord.record_number.split('-')[1]) 
    : 0;
  
  return `MR-${String(lastNumber + 1).padStart(5, '0')}`;
}

/**
 * Validates required fields for maintenance record
 */
export function validateMaintenanceRecord(record: MaintenanceRecordInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!record.bus_id) {
    errors.push('bus_id is required');
  }
  
  if (!record.type) {
    errors.push('type is required');
  }
  
  if (!record.date) {
    errors.push('date is required');
  }
  
  if (!record.description) {
    errors.push('description is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Safely inserts a maintenance record with all validations
 * This function:
 * 1. Validates required fields
 * 2. Generates record_number if not provided
 * 3. Validates bus_id exists
 * 4. Validates performed_by exists (if provided)
 * 5. Converts parts_replaced to proper JSON
 * 6. Handles NULL for optional fields
 * 7. Inserts the record
 */
export async function safeInsertMaintenanceRecord(
  record: MaintenanceRecordInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Step 1: Validate required fields
    const validation = validateMaintenanceRecord(record);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    // Step 2: Generate record_number if not provided
    if (!record.record_number) {
      record.record_number = await generateRecordNumber();
    }

    // Step 3: Validate bus_id exists
    const busExists = await validateBusExists(record.bus_id);
    if (!busExists) {
      return {
        success: false,
        error: `Bus with id ${record.bus_id} does not exist`
      };
    }

    // Step 4: Validate performed_by exists (if provided)
    if (record.performed_by) {
      const profileExists = await validateProfileExists(record.performed_by);
      if (!profileExists) {
        return {
          success: false,
          error: `Profile with id ${record.performed_by} does not exist`
        };
      }
    }

    // Step 5: Prepare the payload
    const payload: any = {
      record_number: record.record_number,
      bus_id: record.bus_id,
      type: record.type,
      date: record.date,
      description: record.description,
      work_performed: record.work_performed || null,
      parts_replaced: record.parts_replaced ? JSON.stringify(record.parts_replaced) : null,
      cost: record.cost || null,
      odometer_reading: record.odometer_reading || null,
      next_service_km: record.next_service_km || null,
      next_service_date: record.next_service_date || null,
      performed_by: record.performed_by || null,
      vendor: record.vendor || null,
      downtime_hours: record.downtime_hours || null,
      notes: record.notes || null,
    };

    // Step 6: Insert the record
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Insert failed: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Safely fetches maintenance records with explicit column selection
 * Avoids 406 errors by explicitly selecting columns
 */
export async function fetchMaintenanceRecords(options?: {
  busId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    let query = supabase
      .from('maintenance_records')
      .select(`
        id,
        record_number,
        bus_id,
        type,
        date,
        description,
        work_performed,
        parts_replaced,
        cost,
        odometer_reading,
        next_service_km,
        next_service_date,
        performed_by,
        vendor,
        downtime_hours,
        notes,
        created_at,
        updated_at,
        bus:buses(id, registration_number, make, model),
        staff:profiles!performed_by(id, full_name, email)
      `)
      .order('date', { ascending: false });

    if (options?.busId) {
      query = query.eq('bus_id', options.busId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: `Fetch failed: ${error.message}`
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Updates a maintenance record
 */
export async function updateMaintenanceRecord(
  id: string,
  updates: Partial<MaintenanceRecordInput>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate bus_id if provided
    if (updates.bus_id) {
      const busExists = await validateBusExists(updates.bus_id);
      if (!busExists) {
        return {
          success: false,
          error: `Bus with id ${updates.bus_id} does not exist`
        };
      }
    }

    // Validate performed_by if provided
    if (updates.performed_by) {
      const profileExists = await validateProfileExists(updates.performed_by);
      if (!profileExists) {
        return {
          success: false,
          error: `Profile with id ${updates.performed_by} does not exist`
        };
      }
    }

    // Prepare the payload
    const payload: any = {};
    
    if (updates.bus_id !== undefined) payload.bus_id = updates.bus_id;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.date !== undefined) payload.date = updates.date;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.work_performed !== undefined) payload.work_performed = updates.work_performed || null;
    if (updates.parts_replaced !== undefined) payload.parts_replaced = updates.parts_replaced ? JSON.stringify(updates.parts_replaced) : null;
    if (updates.cost !== undefined) payload.cost = updates.cost || null;
    if (updates.odometer_reading !== undefined) payload.odometer_reading = updates.odometer_reading || null;
    if (updates.next_service_km !== undefined) payload.next_service_km = updates.next_service_km || null;
    if (updates.next_service_date !== undefined) payload.next_service_date = updates.next_service_date || null;
    if (updates.performed_by !== undefined) payload.performed_by = updates.performed_by || null;
    if (updates.vendor !== undefined) payload.vendor = updates.vendor || null;
    if (updates.downtime_hours !== undefined) payload.downtime_hours = updates.downtime_hours || null;
    if (updates.notes !== undefined) payload.notes = updates.notes || null;

    const { data, error } = await supabase
      .from('maintenance_records')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Update failed: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Deletes a maintenance record
 */
export async function deleteMaintenanceRecord(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: `Delete failed: ${error.message}`
      };
    }

    return {
      success: true
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}
