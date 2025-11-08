const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const reportingEngine = require('../services/reportingEngine');

// Daily sales report
router.get('/daily-sales/:date', authenticate, authorize(['FINANCE_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const report = await reportingEngine.dailySalesReport(req.params.date);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Trip performance report
router.get('/trip-performance', authenticate, authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportingEngine.tripPerformanceReport(startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Driver performance report
router.get('/driver-performance/:driverId', authenticate, authorize(['HR_MANAGER', 'OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportingEngine.driverPerformanceReport(
      req.params.driverId,
      startDate,
      endDate
    );
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Operations report
router.get('/operations/:date', authenticate, authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const report = await reportingEngine.operationsReport(req.params.date);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Revenue report
router.get('/revenue', authenticate, authorize(['FINANCE_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportingEngine.revenueReport(startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export to CSV
router.post('/export/csv', authenticate, async (req, res) => {
  try {
    const { data, headers } = req.body;
    const csv = reportingEngine.exportToCSV(data, headers);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
