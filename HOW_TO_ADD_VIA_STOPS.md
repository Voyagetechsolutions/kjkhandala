# 🛣️ How to Add Via Stops (Via Routes)

## 📍 Location: Admin → Route Management

---

## ✅ **Step-by-Step Guide**

### **Step 1: Go to Route Management**
1. Login to Admin panel
2. Navigate to: **Admin → Route Management**
3. You'll see a list of all routes

---

### **Step 2: Click "Stops" Button**
For any route in the list, you'll see **3 buttons**:
- 🛣️ **Stops** - Manage via stops (NEW!)
- ✏️ **Edit** - Edit route details
- 🗑️ **Delete** - Delete route

**Click the "Stops" button** on the route you want to add via stops to.

---

### **Step 3: Add Via Stops**

Once you click "Stops", you'll see:
```
Managing Via Stops
Route: Gaborone → Francistown
[Close button]

┌─────────────────────────────────────┐
│ Via Route Stops                     │
│                                     │
│ [+ Add Stop]                        │
│                                     │
│ Current Stops:                      │
│ (empty or existing stops)           │
└─────────────────────────────────────┘
```

**Click "+ Add Stop"** to add a new intermediate stop.

---

### **Step 4: Fill in Stop Details**

A dialog will appear with these fields:

**1. City Name**
- Example: `Palapye`

**2. Stop Order**
- Example: `2` (if it's the second stop)
- Order: 1 = Origin, 2 = First via stop, 3 = Second via stop, etc.

**3. Arrival Offset (minutes)**
- Minutes from route start when bus arrives at this stop
- Example: `180` (3 hours from Gaborone)

**4. Departure Offset (minutes)**
- Minutes from route start when bus leaves this stop
- Example: `195` (3 hours 15 minutes from Gaborone)
- This gives a 15-minute stop time

**Click "Save"**

---

## 📊 **Example: Gaborone → Francistown via Palapye**

### Route Details:
- Origin: Gaborone
- Destination: Francistown
- Duration: 6 hours
- Departure: 08:00

### Add These Stops:

**Stop 1: Gaborone (Origin)**
- City: `Gaborone`
- Order: `1`
- Arrival: `0` minutes
- Departure: `0` minutes

**Stop 2: Palapye (Via)**
- City: `Palapye`
- Order: `2`
- Arrival: `180` minutes (3 hours)
- Departure: `195` minutes (3h 15min)

**Stop 3: Francistown (Destination)**
- City: `Francistown`
- Order: `3`
- Arrival: `360` minutes (6 hours)
- Departure: `360` minutes

---

## 🎯 **Result**

When a trip is generated for this route at 08:00:

```
Trip Stops:
┌────────────────┬──────────┬───────────┐
│ City           │ Arrival  │ Departure │
├────────────────┼──────────┼───────────┤
│ Gaborone       │ 08:00    │ 08:00     │
│ Palapye        │ 11:00    │ 11:15     │
│ Francistown    │ 14:00    │ 14:00     │
└────────────────┴──────────┴───────────┘
```

**Customers can now book:**
- ✅ Gaborone → Palapye
- ✅ Gaborone → Francistown
- ✅ Palapye → Francistown

---

## 🔄 **Automatic Behavior**

Once you add via stops to a route:

1. ✅ **All future generated trips** will include these stops
2. ✅ **Stop times are calculated automatically** based on offsets
3. ✅ **Seat availability is tracked per segment**
4. ✅ **Booking website shows all segments**
5. ✅ **Ticketing dashboard shows all stops**
6. ✅ **Manifest includes all stops**

---

## 📝 **Tips**

### **Calculating Offsets**

If your route is:
- Gaborone → Palapye: 3 hours
- Palapye → Francistown: 3 hours
- Stop time in Palapye: 15 minutes

Then:
- Palapye arrival: `3 hours × 60 = 180 minutes`
- Palapye departure: `180 + 15 = 195 minutes`
- Francistown arrival: `6 hours × 60 = 360 minutes`

### **Editing Stops**

- Click the **Edit** button on any stop to modify it
- Click the **Delete** button to remove a stop
- Changes apply to **future trips only** (not existing trips)

### **Closing the Manager**

- Click the **Close** button at the top right
- Or click **Stops** on another route to switch

---

## ✅ **You're Done!**

Your via routes are now set up and will automatically appear in:
- Customer booking website
- Ticketing dashboard
- Trip manifests
- All reports

**No manual work needed!** 🎉
