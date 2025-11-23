import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * Manually trigger trip generation
 * This should be called daily via cron job
 */
router.post('/generate-trips', async (req, res) => {
  try {
    const { error } = await supabase.rpc('generate_scheduled_trips');
    
    if (error) {
      console.error('Error generating trips:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      message: 'Trips generated successfully' 
    });
  } catch (error: any) {
    console.error('Error in generate-trips:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manually trigger status updates
 * This should be called every 5 minutes via cron job
 */
router.post('/update-statuses', async (req, res) => {
  try {
    const { error } = await supabase.rpc('update_trip_statuses');
    
    if (error) {
      console.error('Error updating statuses:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      message: 'Trip statuses updated successfully' 
    });
  } catch (error: any) {
    console.error('Error in update-statuses:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get automation status and stats
 */
router.get('/status', async (req, res) => {
  try {
    // Get active route frequencies
    const { data: frequencies, error: freqError } = await supabase
      .from('route_frequencies')
      .select('*', { count: 'exact' })
      .eq('active', true);

    if (freqError) throw freqError;

    // Get trips created today
    const today = new Date().toISOString().split('T')[0];
    const { data: tripsToday, error: tripsError } = await supabase
      .from('trips')
      .select('*', { count: 'exact' })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (tripsError) throw tripsError;

    res.json({
      success: true,
      data: {
        activeSchedules: frequencies?.length || 0,
        tripsGeneratedToday: tripsToday?.length || 0,
        lastCheck: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Error getting automation status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
