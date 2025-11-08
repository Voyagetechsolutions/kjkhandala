# 🚀 Phase 2 - Remaining Implementation Guide

## Overview
This guide provides detailed instructions for implementing the remaining Phase 2 features:
1. Passenger Manifest Check-in Workflow
2. Manifest Reports Generation
3. Export Functionality (PDF/Excel)

---

## 1. 📋 Passenger Manifest Check-in Workflow

### File to Modify
`src/pages/admin/PassengerManifest.tsx`

### Current State
- Basic check-in UI exists
- Manual check-in buttons present
- Status updates working

### Enhancements Needed

#### A. Bulk Check-in Feature
Add a "Check-in All" button in the Check-in tab:

```typescript
const handleBulkCheckIn = async () => {
  if (!selectedTrip || !passengers) return;
  
  const pendingPassengers = passengers.filter(
    (p: any) => p.status !== 'checked-in' && p.status !== 'no-show'
  );
  
  for (const passenger of pendingPassengers) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'checked-in',
        checked_in_at: new Date().toISOString()
      })
      .eq('id', passenger.id);
  }
  
  queryClient.invalidateQueries({ queryKey: ['manifest-passengers'] });
  toast.success(`${pendingPassengers.length} passengers checked in!`);
};
```

Add button in the Check-in tab UI:
```tsx
<Button onClick={handleBulkCheckIn} className="w-full">
  <CheckCircle className="h-4 w-4 mr-2" />
  Check-in All Pending
</Button>
```

#### B. Check-in Time Logging
Update the check-in mutation to include timestamp:

```typescript
const checkInMutation = useMutation({
  mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: status,
        checked_in_at: new Date().toISOString(), // Add timestamp
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    if (error) throw error;
  },
  // ... rest of mutation
});
```

#### C. QR Code Scanner (Placeholder)
Add QR scanner UI:

```tsx
<div className="p-4 border-2 border-dashed rounded-lg text-center">
  <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
  <p className="font-medium">QR Code Scanner</p>
  <p className="text-sm text-muted-foreground">
    Scan passenger tickets for quick check-in
  </p>
  <Button variant="outline" className="mt-3">
    <Camera className="h-4 w-4 mr-2" />
    Open Scanner
  </Button>
</div>
```

For actual QR scanning, install:
```bash
npm install react-qr-reader
```

#### D. Real-time Notifications
Add notification when passenger count changes:

```typescript
useEffect(() => {
  if (checkedInCount === totalPassengers && totalPassengers > 0) {
    toast.success('All passengers checked in! Ready for departure.');
  }
}, [checkedInCount, totalPassengers]);
```

---

## 2. 📊 Manifest Reports Generation

### File to Modify
`src/pages/admin/PassengerManifest.tsx` (Reports tab)

### Reports to Implement

#### A. Daily Passenger Summary

```typescript
const generateDailyPassengerSummary = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch all trips for today
  const { data: todayTrips } = await supabase
    .from('schedules')
    .select(`
      *,
      routes(origin, destination),
      bookings(count)
    `)
    .eq('departure_date', today);
  
  // Generate report data
  const reportData = todayTrips?.map((trip: any) => ({
    route: `${trip.routes.origin} → ${trip.routes.destination}`,
    departure: trip.departure_time,
    totalPassengers: trip.bookings?.length || 0,
    occupancyRate: ((trip.bookings?.length / trip.available_seats) * 100).toFixed(1) + '%',
  }));
  
  // Display or export reportData
  console.log('Daily Summary:', reportData);
  toast.success('Report generated!');
};
```

#### B. No-Show Statistics

```typescript
const generateNoShowReport = async () => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      schedules(departure_date, routes(origin, destination))
    `)
    .eq('status', 'no-show')
    .gte('created_at', lastWeek.toISOString());
  
  // Group by route
  const noShowByRoute = bookings?.reduce((acc: any, booking: any) => {
    const route = `${booking.schedules.routes.origin} → ${booking.schedules.routes.destination}`;
    acc[route] = (acc[route] || 0) + 1;
    return acc;
  }, {});
  
  console.log('No-Show Statistics:', noShowByRoute);
  toast.success('No-show report generated!');
};
```

#### C. Boarding Time Analysis

```typescript
const generateBoardingTimeReport = async () => {
  const { data: trips } = await supabase
    .from('schedules')
    .select(`
      *,
      routes(origin, destination),
      bookings(checked_in_at)
    `)
    .not('bookings.checked_in_at', 'is', null);
  
  const analysis = trips?.map((trip: any) => {
    const scheduledTime = new Date(`${trip.departure_date}T${trip.departure_time}`);
    const checkIns = trip.bookings.map((b: any) => new Date(b.checked_in_at));
    const avgCheckInTime = checkIns.reduce((sum: number, time: Date) => 
      sum + time.getTime(), 0) / checkIns.length;
    
    const minutesBeforeDeparture = (scheduledTime.getTime() - avgCheckInTime) / 60000;
    
    return {
      route: `${trip.routes.origin} → ${trip.routes.destination}`,
      avgBoardingTime: minutesBeforeDeparture.toFixed(0) + ' min before departure',
      onTime: minutesBeforeDeparture > 0 ? 'Yes' : 'No',
    };
  });
  
  console.log('Boarding Analysis:', analysis);
  toast.success('Boarding time report generated!');
};
```

#### D. Revenue by Manifest

```typescript
const generateRevenueReport = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: trips } = await supabase
    .from('schedules')
    .select(`
      *,
      routes(origin, destination, price),
      bookings(total_amount, payment_status)
    `)
    .eq('departure_date', today);
  
  const revenueData = trips?.map((trip: any) => {
    const totalRevenue = trip.bookings.reduce((sum: number, b: any) => 
      sum + parseFloat(b.total_amount || 0), 0);
    const paidRevenue = trip.bookings
      .filter((b: any) => b.payment_status === 'paid')
      .reduce((sum: number, b: any) => sum + parseFloat(b.total_amount || 0), 0);
    
    return {
      route: `${trip.routes.origin} → ${trip.routes.destination}`,
      totalRevenue: `P${totalRevenue.toFixed(2)}`,
      paidRevenue: `P${paidRevenue.toFixed(2)}`,
      outstanding: `P${(totalRevenue - paidRevenue).toFixed(2)}`,
      passengers: trip.bookings.length,
    };
  });
  
  console.log('Revenue Report:', revenueData);
  toast.success('Revenue report generated!');
};
```

### Update UI to Call These Functions

Replace the placeholder buttons in the Reports tab:

```tsx
<Button onClick={generateDailyPassengerSummary} className="w-full">
  <Download className="h-4 w-4 mr-2" />
  Generate Report
</Button>
```

---

## 3. 📄 Export Functionality (PDF/Excel)

### Install Required Libraries

```bash
npm install jspdf jspdf-autotable xlsx
```

### A. Print Manifest Function

```typescript
const handlePrintManifest = () => {
  if (!selectedTripData || !passengers) {
    toast.error('Please select a trip first');
    return;
  }
  
  // Create a print-friendly version
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Passenger Manifest - ${selectedTripData.routes?.origin} to ${selectedTripData.routes?.destination}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #DC2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #DC2626; color: white; }
        .header { margin-bottom: 20px; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KJ Khandala Bus Company</h1>
        <h2>Passenger Manifest</h2>
        <p><strong>Route:</strong> ${selectedTripData.routes?.origin} → ${selectedTripData.routes?.destination}</p>
        <p><strong>Date:</strong> ${selectedTripData.departure_date}</p>
        <p><strong>Time:</strong> ${selectedTripData.departure_time}</p>
        <p><strong>Bus:</strong> ${selectedTripData.buses?.bus_number}</p>
        <p><strong>Total Passengers:</strong> ${passengers.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Passenger Name</th>
            <th>Ticket Number</th>
            <th>Seat</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Signature</th>
          </tr>
        </thead>
        <tbody>
          ${passengers.map((p: any, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.passenger_name}</td>
              <td>${p.booking_reference}</td>
              <td>${p.seat_number}</td>
              <td>${p.passenger_phone}</td>
              <td>${p.status || 'Pending'}</td>
              <td style="width: 150px;"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 40px;">
        <p><strong>Driver Signature:</strong> _______________________</p>
        <p><strong>Date:</strong> _______________________</p>
      </div>
      
      <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #DC2626; color: white; border: none; cursor: pointer;">
        Print Manifest
      </button>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};
```

### B. Export to PDF

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const handleExportPDF = () => {
  if (!selectedTripData || !passengers) {
    toast.error('Please select a trip first');
    return;
  }
  
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.setTextColor(220, 38, 38); // Red color
  doc.text('KJ Khandala Bus Company', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Passenger Manifest', 14, 30);
  
  // Add trip details
  doc.setFontSize(10);
  doc.text(`Route: ${selectedTripData.routes?.origin} → ${selectedTripData.routes?.destination}`, 14, 40);
  doc.text(`Date: ${selectedTripData.departure_date}`, 14, 46);
  doc.text(`Time: ${selectedTripData.departure_time}`, 14, 52);
  doc.text(`Bus: ${selectedTripData.buses?.bus_number}`, 14, 58);
  doc.text(`Total Passengers: ${passengers.length}`, 14, 64);
  
  // Add passenger table
  const tableData = passengers.map((p: any, i: number) => [
    i + 1,
    p.passenger_name,
    p.booking_reference,
    p.seat_number,
    p.passenger_phone,
    p.status || 'Pending'
  ]);
  
  autoTable(doc, {
    head: [['#', 'Name', 'Ticket', 'Seat', 'Phone', 'Status']],
    body: tableData,
    startY: 70,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] },
  });
  
  // Save PDF
  doc.save(`manifest-${selectedTripData.routes?.origin}-${selectedTripData.departure_date}.pdf`);
  toast.success('PDF exported successfully!');
};
```

### C. Export to Excel

```typescript
import * as XLSX from 'xlsx';

const handleExportExcel = () => {
  if (!selectedTripData || !passengers) {
    toast.error('Please select a trip first');
    return;
  }
  
  // Prepare data
  const excelData = passengers.map((p: any, i: number) => ({
    '#': i + 1,
    'Passenger Name': p.passenger_name,
    'Ticket Number': p.booking_reference,
    'Seat': p.seat_number,
    'Phone': p.passenger_phone,
    'Payment Status': p.payment_status || 'N/A',
    'Check-in Status': p.status || 'Pending',
  }));
  
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Passenger Manifest');
  
  // Add trip info sheet
  const tripInfo = [{
    'Route': `${selectedTripData.routes?.origin} → ${selectedTripData.routes?.destination}`,
    'Date': selectedTripData.departure_date,
    'Time': selectedTripData.departure_time,
    'Bus': selectedTripData.buses?.bus_number,
    'Total Passengers': passengers.length,
  }];
  const wsInfo = XLSX.utils.json_to_sheet(tripInfo);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Trip Info');
  
  // Save file
  XLSX.writeFile(wb, `manifest-${selectedTripData.routes?.origin}-${selectedTripData.departure_date}.xlsx`);
  toast.success('Excel file exported successfully!');
};
```

### D. Update UI Buttons

Replace the placeholder buttons with actual function calls:

```tsx
{/* In the Manifest Overview tab */}
<Button variant="outline" onClick={handlePrintManifest}>
  <Printer className="h-4 w-4 mr-2" />
  Print
</Button>
<Button onClick={handleExportPDF}>
  <Download className="h-4 w-4 mr-2" />
  Export PDF
</Button>

{/* Add Excel export button */}
<Button variant="outline" onClick={handleExportExcel}>
  <FileSpreadsheet className="h-4 w-4 mr-2" />
  Export Excel
</Button>
```

---

## 4. 🎨 UI Enhancements

### Add Missing Icons
```typescript
import { Camera, FileSpreadsheet } from 'lucide-react';
```

### Add Loading States
```typescript
const [isExporting, setIsExporting] = useState(false);

const handleExportPDF = async () => {
  setIsExporting(true);
  try {
    // ... export logic
  } finally {
    setIsExporting(false);
  }
};

// In button:
<Button onClick={handleExportPDF} disabled={isExporting}>
  {isExporting ? 'Exporting...' : 'Export PDF'}
</Button>
```

---

## 5. ✅ Testing Checklist

### Check-in Workflow
- [ ] Individual check-in works
- [ ] Bulk check-in works
- [ ] No-show marking works
- [ ] Real-time count updates
- [ ] Timestamps are logged
- [ ] Notifications appear

### Reports
- [ ] Daily summary generates
- [ ] No-show report generates
- [ ] Boarding time analysis works
- [ ] Revenue report generates
- [ ] Data is accurate

### Export
- [ ] Print opens in new window
- [ ] Print layout is correct
- [ ] PDF exports successfully
- [ ] PDF contains all data
- [ ] Excel exports successfully
- [ ] Excel has correct sheets
- [ ] Filenames are descriptive

---

## 6. 🚀 Quick Implementation Steps

1. **Install libraries:**
   ```bash
   npm install jspdf jspdf-autotable xlsx
   ```

2. **Add imports to PassengerManifest.tsx:**
   ```typescript
   import jsPDF from 'jspdf';
   import autoTable from 'jspdf-autotable';
   import * as XLSX from 'xlsx';
   import { Camera, FileSpreadsheet } from 'lucide-react';
   ```

3. **Copy-paste the functions** from this guide into your component

4. **Update the UI buttons** to call the new functions

5. **Test each feature** thoroughly

---

## 7. 📝 Database Schema Notes

### Add check-in timestamp column (if not exists):
```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;
```

---

## 8. 🎯 Success Criteria

✅ Bulk check-in works for all pending passengers  
✅ Check-in times are logged  
✅ All 4 reports generate correctly  
✅ Print manifest opens in new window  
✅ PDF export downloads with correct data  
✅ Excel export downloads with 2 sheets  
✅ All buttons have loading states  
✅ Toast notifications appear  
✅ No console errors  

---

## 9. 💡 Optional Enhancements

### A. Email Manifest
```typescript
const emailManifest = async () => {
  // Send manifest PDF to driver's email
  // Requires backend email service
};
```

### B. SMS Notifications
```typescript
const sendSMSReminders = async () => {
  // Send SMS to passengers before departure
  // Requires SMS gateway integration
};
```

### C. Real-time Sync
```typescript
// Use Supabase realtime subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('manifest-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'bookings'
    }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['manifest-passengers'] });
    })
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## 🎊 Completion

Once all features are implemented and tested, Phase 2 will be 100% complete!

**Estimated Total Time:** 2-3 hours for full implementation and testing

**Priority Order:**
1. Export functionality (most requested)
2. Reports generation (business value)
3. Check-in enhancements (UX improvement)
