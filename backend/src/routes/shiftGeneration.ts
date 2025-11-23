import express from 'express';
import { shiftGenerationService } from '../services/shiftGenerationService';

const router = express.Router();

/**
 * POST /api/shift-generation/preview
 * Generate shift preview without saving
 */
router.post('/preview', async (req, res) => {
  try {
    const { selectedDate, selectedRoutes, maxHoursPerDriver, prioritizeExperienced } = req.body;

    if (!selectedDate) {
      return res.status(400).json({ error: 'selectedDate is required' });
    }

    if (!selectedRoutes || !Array.isArray(selectedRoutes)) {
      return res.status(400).json({ error: 'selectedRoutes must be an array' });
    }

    const result = await shiftGenerationService.generateShifts({
      selectedDate,
      selectedRoutes,
      maxHoursPerDriver,
      prioritizeExperienced,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error generating shift preview:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shift-generation/confirm
 * Confirm and save shifts to database
 */
router.post('/confirm', async (req, res) => {
  try {
    const { assignments, selectedDate } = req.body;

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'assignments must be an array' });
    }

    if (!selectedDate) {
      return res.status(400).json({ error: 'selectedDate is required' });
    }

    await shiftGenerationService.confirmShifts(assignments, selectedDate);

    res.json({ success: true, message: 'Shifts saved successfully' });
  } catch (error: any) {
    console.error('Error confirming shifts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shift-generation/stats/:date
 * Get shift statistics for a specific date
 */
router.get('/stats/:date', async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const stats = await shiftGenerationService.getShiftStats(date);

    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching shift stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
