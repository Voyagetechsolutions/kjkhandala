# Service Advisories Management Guide

## Overview
Service advisories inform customers about important changes, delays, and updates to your bus services.

---

## How to Add Service Advisories

### Using Supabase Dashboard:

1. **Login to Supabase**
   - Go to your Supabase project dashboard
   - Navigate to Table Editor

2. **Open service_advisories Table**
   - Find and click on `service_advisories` table

3. **Insert New Row**
   - Click "Insert row" button
   - Fill in the following fields:

### Field Descriptions:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `title` | Text | Yes | Short, descriptive title | "Road Closure on Gaborone Route" |
| `message` | Text | Yes | Detailed message for customers | "Due to road maintenance, expect 30-minute delays" |
| `severity` | Select | Yes | Choose: `info`, `warning`, or `critical` | `warning` |
| `affected_routes` | Text | No | Which routes are affected | "Gaborone - Francistown" |
| `is_active` | Boolean | Yes | Show on website? | `true` |
| `expected_resolution` | Timestamp | No | When will issue be resolved? | `2025-11-30 14:00:00` |

---

## Severity Levels

### 🔵 Info (Blue)
**Use for:**
- New terminal locations
- Schedule updates
- Service improvements
- General announcements

**Example:**
```
Title: New Mobile App Available
Message: Download our new mobile app for easier booking and real-time updates.
Severity: info
```

### 🟡 Warning (Amber)
**Use for:**
- Minor delays
- Road maintenance
- Weather advisories
- Temporary changes

**Example:**
```
Title: Expected Delays on Kasane Route
Message: Due to road maintenance, trips may be delayed by 20-30 minutes.
Severity: warning
```

### 🔴 Critical (Red)
**Use for:**
- Service cancellations
- Major disruptions
- Safety concerns
- Emergency situations

**Example:**
```
Title: Service Suspended - Maun Route
Message: All trips to Maun suspended due to flooding. Refunds available.
Severity: critical
```

---

## Quick SQL Examples

### Add a Warning Advisory:
```sql
INSERT INTO service_advisories (title, message, severity, affected_routes, is_active, expected_resolution)
VALUES (
  'Road Maintenance - Francistown',
  'Expect delays of 30 minutes due to road works between Palapye and Mahalapye. Please arrive 15 minutes early.',
  'warning',
  'Gaborone - Francistown',
  true,
  NOW() + INTERVAL '7 days'
);
```

### Add an Info Advisory:
```sql
INSERT INTO service_advisories (title, message, severity, affected_routes, is_active)
VALUES (
  'Holiday Schedule Changes',
  'Special schedules will be in effect during the holiday period. Check our website for updated departure times.',
  'info',
  'All Routes',
  true
);
```

### Add a Critical Advisory:
```sql
INSERT INTO service_advisories (title, message, severity, affected_routes, is_active, expected_resolution)
VALUES (
  'Service Cancelled - Kasane Route',
  'All trips to Kasane cancelled today due to severe weather. Full refunds available. Contact customer service.',
  'critical',
  'All routes to/from Kasane',
  true,
  NOW() + INTERVAL '1 day'
);
```

---

## Managing Advisories

### Deactivate an Advisory:
```sql
UPDATE service_advisories
SET is_active = false
WHERE id = 'your-advisory-id';
```

### Update an Advisory:
```sql
UPDATE service_advisories
SET 
  message = 'Updated message here',
  expected_resolution = '2025-12-01 10:00:00'
WHERE id = 'your-advisory-id';
```

### Delete an Advisory:
```sql
DELETE FROM service_advisories
WHERE id = 'your-advisory-id';
```

### View All Active Advisories:
```sql
SELECT * FROM service_advisories
WHERE is_active = true
ORDER BY created_at DESC;
```

---

## Best Practices

### ✅ DO:
- Keep titles short and clear (under 60 characters)
- Write messages in plain, simple language
- Update expected resolution times
- Deactivate advisories when resolved
- Use appropriate severity levels
- Include affected routes when relevant
- Provide contact information for questions

### ❌ DON'T:
- Use all caps (except for emphasis)
- Leave old advisories active
- Overuse critical severity
- Forget to specify affected routes
- Use technical jargon
- Make promises you can't keep

---

## Communication Tips

### Good Examples:

**Clear and Specific:**
```
Title: 30-Minute Delay - Maun Route
Message: Due to road maintenance near Nata, expect delays of 30 minutes. 
We apologize for the inconvenience.
```

**Helpful and Actionable:**
```
Title: New Terminal Location - Kasane
Message: Our Kasane terminal has moved to Plot 234, Main Road, next to 
Chobe Safari Lodge. GPS: -17.8145, 25.1634
```

**Urgent and Direct:**
```
Title: Service Suspended - Weather Alert
Message: All trips cancelled today due to severe storms. Full refunds 
issued automatically. Call +267 71 799 129 for rebooking.
```

### Bad Examples:

**Too Vague:**
```
❌ Title: Delays Expected
❌ Message: Some routes may be delayed.
```

**Too Technical:**
```
❌ Message: Due to mechanical failure in the transmission system of 
unit BUS-042, service on route GBE-FRW will be temporarily suspended 
pending diagnostic evaluation.
```

**No Action Items:**
```
❌ Message: There's a problem with the road.
```

---

## Notification Workflow

### When to Post an Advisory:

1. **Immediately:**
   - Service cancellations
   - Safety issues
   - Major delays (>1 hour)

2. **As Soon As Possible:**
   - Minor delays (30-60 min)
   - Route changes
   - Terminal changes

3. **In Advance:**
   - Holiday schedules
   - Planned maintenance
   - New services

### Multi-Channel Approach:
1. Post on website (service advisories page)
2. Send SMS to affected passengers
3. Send email notifications
4. Post on social media
5. Update at terminals

---

## Sample Advisories Library

### Road Maintenance:
```sql
INSERT INTO service_advisories (title, message, severity, affected_routes, is_active, expected_resolution)
VALUES (
  'Road Maintenance - [Route Name]',
  'Due to road maintenance between [Location A] and [Location B], expect delays of [X] minutes. Please arrive [Y] minutes earlier than usual.',
  'warning',
  '[Route Name]',
  true,
  NOW() + INTERVAL '[X] days'
);
```

### Weather Disruption:
```sql
INSERT INTO service_advisories (title, message, severity, affected_routes, is_active)
VALUES (
  'Weather Advisory - [Region]',
  'Heavy rains in [Region] may cause delays. Monitor our website for updates. For urgent inquiries, call +267 71 799 129.',
  'warning',
  'All routes to/from [Region]',
  true
);
```

### Holiday Schedule:
```sql
INSERT INTO service_advisories (title, message, severity, is_active)
VALUES (
  'Holiday Schedule - [Holiday Name]',
  'Special schedules in effect for [Holiday Name] on [Date]. Additional trips available. Book early to secure your seat.',
  'info',
  true
);
```

---

## Admin Panel (Future Enhancement)

Consider building an admin interface with:
- Form to create advisories
- List view with filters
- Quick activate/deactivate toggle
- Preview before publishing
- Bulk operations
- Analytics (views, engagement)

---

## Support

For questions about service advisories:
- **Email**: info@kjkhandala.com
- **Phone**: +267 71 799 129
- **WhatsApp**: +267 73 442 135

---

**Last Updated**: November 2025
