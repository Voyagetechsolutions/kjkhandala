# Careers Page - Quick Guide for HR Team

## How to Post a Job

### Step 1: Access HR Dashboard
- Login to the system
- Navigate to `/hr/recruitment` or `/admin/hr` then click "Recruitment & Onboarding"

### Step 2: Create New Job Posting
1. Click the "**+ Post New Job**" button
2. Fill in the job details:
   - **Title**: e.g., "Bus Driver", "Accountant", "Operations Manager"
   - **Department**: e.g., "Operations", "Finance", "HR"
   - **Location**: e.g., "Gaborone", "Francistown", "Maun"
   - **Employment Type**: Full-time, Part-time, Contract, Temporary
   - **Salary Range**: e.g., "P5,000 - P8,000", "Competitive", "Negotiable"
   - **Description**: Detailed job description
   - **Requirements**: List qualifications and skills (one per line)
   - **Responsibilities**: List key duties (one per line)

3. Click "**Create Job Posting**"

### Step 3: Activate the Job
- The job is created with status "**draft**" by default
- To make it visible on the Careers page, change status to "**active**"
- Click the toggle or edit button to activate

### Step 4: Job Appears on Website
- Job will immediately appear on `/careers` page
- Public visitors can view and apply
- No delay - it's real-time!

---

## Managing Applications

### View Applications
1. Go to HR Dashboard > Recruitment
2. Click on a job posting
3. View list of applications
4. See applicant details:
   - Name
   - Email
   - Phone
   - Application date
   - Status

### Download Resumes
- Click on an application
- Click "Download Resume" button
- Resume opens in new tab or downloads

### Update Application Status
Change status to:
- **Submitted** - Initial status
- **Reviewing** - Currently being reviewed
- **Shortlisted** - Candidate selected for interview
- **Rejected** - Not moving forward
- **Hired** - Candidate accepted offer

---

## Job Status Options

### Active
- ✅ Visible on Careers page
- ✅ Accepting applications
- Use for: Currently hiring positions

### Closed
- ❌ Not visible on Careers page
- ❌ Not accepting applications
- Use for: Position filled or no longer hiring

### Draft
- ❌ Not visible on Careers page
- ❌ Not accepting applications
- Use for: Jobs being prepared, not ready to post

---

## Best Practices

### Writing Job Titles
✅ **Good**: "Experienced Bus Driver - Gaborone"
✅ **Good**: "Finance Manager"
✅ **Good**: "Customer Service Representative"

❌ **Bad**: "URGENT HIRING!!!"
❌ **Bad**: "Best Job Ever"
❌ **Bad**: "Job Opening"

### Writing Descriptions
- Be specific about the role
- Include day-to-day responsibilities
- Mention team size and reporting structure
- Highlight company culture
- Keep it between 200-500 words

### Writing Requirements
Format as a list:
```
- Valid Botswana driver's license (Code C1)
- Minimum 3 years driving experience
- Clean driving record
- Good communication skills
- Ability to work flexible hours
```

### Salary Ranges
Be transparent:
- ✅ "P5,000 - P8,000 per month"
- ✅ "Competitive salary based on experience"
- ✅ "P50,000 - P70,000 per annum"
- ❌ "Good pay"
- ❌ "TBD"

---

## Application Process (From Candidate's View)

1. **Candidate visits** `/careers`
2. **Browses** available positions
3. **Clicks** "Apply Now" on desired job
4. **Fills out** application form:
   - Personal details
   - Uploads resume (PDF or Word, max 5MB)
   - Writes cover letter
   - Adds LinkedIn/Portfolio (optional)
5. **Submits** application
6. **Receives** confirmation message
7. **Application saved** to database
8. **HR team** receives notification (if configured)

---

## Common Questions

### Q: How long does it take for a job to appear on the website?
**A:** Immediately! As soon as you set the status to "active", it's live.

### Q: Can I edit a job posting after it's published?
**A:** Yes! Click the edit button, make changes, and save. Changes are instant.

### Q: What file types can candidates upload?
**A:** PDF (.pdf), Word (.doc, .docx) - Maximum 5MB

### Q: Where are resumes stored?
**A:** Securely in Supabase Storage in the 'resumes' bucket.

### Q: Can I delete a job posting?
**A:** Yes, but it's better to set status to "closed" to keep the history.

### Q: How do I notify candidates?
**A:** Currently manual - copy their email from the application. (Auto-email coming soon!)

### Q: Can I see how many people viewed a job?
**A:** Not yet - analytics feature coming soon!

---

## Troubleshooting

### Job not appearing on Careers page?
- ✅ Check status is set to "**active**"
- ✅ Refresh the Careers page
- ✅ Check all required fields are filled

### Can't upload resume?
- ✅ File must be PDF or Word
- ✅ File must be under 5MB
- ✅ Check internet connection

### Application not saving?
- ✅ All required fields must be filled (marked with *)
- ✅ Resume must be uploaded
- ✅ Check browser console for errors

---

## Quick Reference

### URLs
- **HR Dashboard**: `/hr` or `/admin/hr`
- **Recruitment Page**: `/hr/recruitment`
- **Public Careers Page**: `/careers`

### Database Tables
- **Jobs**: `job_postings`
- **Applications**: `job_applications`
- **Resumes**: Supabase Storage `resumes` bucket

### Application Statuses
1. Submitted
2. Reviewing
3. Shortlisted
4. Rejected
5. Hired

### Job Statuses
1. Active (visible, accepting applications)
2. Closed (hidden, not accepting)
3. Draft (hidden, not accepting)

---

## Support

For technical issues or questions:
- **Email**: info@kjkhandala.com
- **Phone**: +267 71 799 129
- **WhatsApp**: +267 73 442 135

---

**Last Updated**: November 2025
