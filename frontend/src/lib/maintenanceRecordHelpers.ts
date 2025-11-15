import { supabase } from '@/lib/supabase';

export interface MaintenanceRecordInput {
  bus_id: string;
  service_type: string;
  maintenance_date: string;
  odometer_reading?: number;
  cost?: number;
  performed_by?: string;
  description?: string;
  status?: string;
}

/**
 * Generate unique maintenance record number
 * Format: MR-00001, MR-00002, etc.
 */
export async function generateMaintenanceRecordNumber(): Promise<string> {
  const { data: lastRecord } = await supabase
    .from('maintenance_records')
    .select('record_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const lastNumber = lastRecord?.record_number
    ? parseInt(lastRecord.record_number.split('-')[1])
    : 0;
  
  return `MR-${String(lastNumber + 1).padStart(5, '0')}`;
}

/**
 * Validate that bus exists
 */
export async function validateBusForMaintenance(busId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('buses')
    .select('id')
    .eq('id', busId)
    .maybeSingle();
  
  return !error && !!data;
}

/**
 * Get valid service types
 */
export function getServiceTypes(): string[] {
  return [
    'oil_change',
    'tire_replacement',
    'brake_service',
    'engine_repair',
    'transmission',
    'inspection',
    'cleaning',
    'electrical_repair',
    'body_work',
    'other'
  ];
}

/**
 * Validate maintenance record data
 */
export function validateMaintenanceRecordData(
  record: MaintenanceRecordInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!record.bus_id) {
    errors.push('Bus is required');
  }
  
  if (!record.service_type) {
    errors.push('Service type is required');
  }
  
  if (!record.maintenance_date) {
    errors.push('Maintenance date is required');
  }
  
  if (record.cost && record.cost < 0) {
    errors.push('Cost cannot be negative');
  }
  
  if (record.odometer_reading && record.odometer_reading < 0) {
    errors.push('Odometer reading cannot be negative');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create maintenance record with auto-generated record number
 */
export async function createMaintenanceRecord(
  record: MaintenanceRecordInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate data
    const validation = validateMaintenanceRecordData(record);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }
    
    // Validate bus exists
    const busExists = await validateBusForMaintenance(record.bus_id);
    if (!busExists) {
      return {
        success: false,
        error: `Bus with ID ${record.bus_id} does not exist`
      };
    }
    
    // Generate record number
    const recordNumber = await generateMaintenanceRecordNumber();
    
    // Create record
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([{
        record_number: recordNumber,
        bus_id: record.bus_id,
        type: record.service_type,
        date: record.maintenance_date,
        odometer_reading: record.odometer_reading || null,
        cost: record.cost || null,
        performed_by: record.performed_by || null,
        description: record.description || '',
        status: record.status || 'PENDING',
      }])
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: error.message
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
 * Update maintenance record status
 */
export async function updateMaintenanceRecordStatus(
  id: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('maintenance_records')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      return {
        success: false,
        error: error.message
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

/**
 * Get maintenance statistics
 */
export async function getMaintenanceStats(): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  totalCost: number;
}> {
  const { data: records } = await supabase
    .from('maintenance_records')
    .select('status, cost');
  
  if (!records) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      totalCost: 0
    };
  }
  
  return {
    total: records.length,
    pending: records.filter(r => r.status === 'PENDING').length,
    inProgress: records.filter(r => r.status === 'IN_PROGRESS').length,
    completed: records.filter(r => r.status === 'COMPLETED').length,
    totalCost: records
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0)
  };
}
