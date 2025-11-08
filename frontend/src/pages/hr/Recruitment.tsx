import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Users, UserPlus, Briefcase, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function Recruitment() {
  const [showJobDialog, setShowJobDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: jobPostings = [] } = useQuery({
    queryKey: ['hr-job-postings'],
    queryFn: async () => {
      const response = await api.get('/hr/recruitment/jobs');
      return Array.isArray(response.data) ? response.data : (response.data?.jobs || []);
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['hr-applications'],
    queryFn: async () => {
      const response = await api.get('/hr/recruitment/applications');
      return Array.isArray(response.data) ? response.data : (response.data?.applications || []);
    },
  });

  const summary = {
    activeJobs: jobPostings.filter((j: any) => j.status === 'active').length,
    totalApplications: applications.length,
    scheduled: applications.filter((a: any) => a.status === 'interview').length,
    hired: applications.filter((a: any) => a.status === 'hired').length,
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Recruitment & Onboarding</h1>
            <p className="text-muted-foreground">Manage job postings and applications</p>
          </div>
          <Button onClick={() => setShowJobDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalApplications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.scheduled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
              <UserPlus className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.hired}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobPostings.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>{job.type}</TableCell>
                    <TableCell>{job.posted}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{job.applications} total</div>
                        <div className="text-muted-foreground">{job.shortlisted} shortlisted</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={job.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.applicantName}</TableCell>
                    <TableCell>{app.jobTitle}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{app.email}</div>
                        <div className="text-muted-foreground">{app.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{app.experience}</TableCell>
                    <TableCell>{app.appliedDate}</TableCell>
                    <TableCell>
                      <Badge className={
                        app.status === 'interview' ? 'bg-blue-500' :
                        app.status === 'screening' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button>Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Post New Job</DialogTitle>
              <DialogDescription>Create a new job posting</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Job Title</Label>
                <Input placeholder="e.g., Bus Driver" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Input placeholder="e.g., Operations" />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input placeholder="e.g., Gaborone" />
                </div>
              </div>
              <div>
                <Label>Job Description</Label>
                <Textarea rows={4} placeholder="Enter job description..." />
              </div>
              <div>
                <Label>Requirements</Label>
                <Textarea rows={3} placeholder="Enter requirements..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowJobDialog(false)}>Cancel</Button>
                <Button>Post Job</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  );
}
