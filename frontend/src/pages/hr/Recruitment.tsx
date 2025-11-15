import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Users, UserPlus, Briefcase, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
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
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  const queryClient = useQueryClient();
  
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employmentType: '',
    salaryRange: '',
    description: '',
    requirements: '',
    responsibilities: ''
  });

  const { data: jobPostings = [] } = useQuery({
    queryKey: ['hr-job-postings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createJob = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await api.post('/hr/job-postings', {
        title: jobData.title,
        department: jobData.department,
        location: jobData.location,
        employment_type: jobData.employmentType,
        salary_range: jobData.salaryRange,
        description: jobData.description,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-job-postings'] });
      toast.success('Job posting created successfully');
      setShowJobDialog(false);
      setFormData({ title: '', department: '', location: '', employmentType: '', salaryRange: '', description: '', requirements: '', responsibilities: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create job posting');
    }
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, ...jobData }: any) => {
      const response = await api.put(`/hr/job-postings/${id}`, {
        title: jobData.title,
        department: jobData.department,
        location: jobData.location,
        employment_type: jobData.employmentType,
        salary_range: jobData.salaryRange,
        description: jobData.description,
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-job-postings'] });
      toast.success('Job posting updated successfully');
      setShowJobDialog(false);
      setEditingJob(null);
      setFormData({ title: '', department: '', location: '', employmentType: '', salaryRange: '', description: '', requirements: '', responsibilities: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update job posting');
    }
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      await api.delete(`/hr/job-postings/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-job-postings'] });
      toast.success('Job posting deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete job posting');
    }
  });

  const toggleJobStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('job_postings')
        .update({ status: status === 'active' ? 'closed' : 'active' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-job-postings'] });
      toast.success('Job status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employment_type,
      salaryRange: job.salary_range || '',
      description: job.description,
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || ''
    });
    setShowJobDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.department || !formData.location || !formData.employmentType || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }
    if (editingJob) {
      updateJob.mutate({ id: editingJob.id, ...formData });
    } else {
      createJob.mutate(formData);
    }
  };

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('applied_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const summary = {
    activeJobs: jobPostings.filter((j: any) => j.status === 'active').length,
    totalApplications: applications.length,
    scheduled: applications.filter((a: any) => a.status === 'interview').length,
    hired: applications.filter((a: any) => a.status === 'hired').length,
  };

  return (
    <Layout>
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
                {jobPostings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No job postings yet. Click "Post New Job" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobPostings.map((job: any) => {
                    const jobApps = applications.filter((a: any) => a.job_posting_id === job.id);
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.department}</TableCell>
                        <TableCell>{job.location}</TableCell>
                        <TableCell className="capitalize">{job.employment_type}</TableCell>
                        <TableCell>{job.posted_date ? new Date(job.posted_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{jobApps.length} total</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={job.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(job)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleJobStatus.mutate({ id: job.id, status: job.status })}>
                              {job.status === 'active' ? 'Close' : 'Activate'}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteJob.mutate(job.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? 'Edit Job Posting' : 'Post New Job'}</DialogTitle>
              <DialogDescription>
                {editingJob ? 'Update job posting details' : 'Create a new job posting that will appear on the careers page'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Job Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Bus Driver" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department *</Label>
                  <Input value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} placeholder="e.g., Operations" />
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g., Gaborone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employment Type *</Label>
                  <Select value={formData.employmentType} onValueChange={(value) => setFormData({...formData, employmentType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Salary Range (Optional)</Label>
                  <Input value={formData.salaryRange} onChange={(e) => setFormData({...formData, salaryRange: e.target.value})} placeholder="e.g., P5,000 - P8,000" />
                </div>
              </div>
              <div>
                <Label>Job Description *</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} placeholder="Enter job description..." />
              </div>
              <div>
                <Label>Requirements</Label>
                <Textarea value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} rows={3} placeholder="Enter requirements (one per line)..." />
              </div>
              <div>
                <Label>Responsibilities</Label>
                <Textarea value={formData.responsibilities} onChange={(e) => setFormData({...formData, responsibilities: e.target.value})} rows={3} placeholder="Enter key responsibilities..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowJobDialog(false);
                  setEditingJob(null);
                  setFormData({ title: '', department: '', location: '', employmentType: '', salaryRange: '', description: '', requirements: '', responsibilities: '' });
                }}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createJob.isPending || updateJob.isPending}>
                  {createJob.isPending || updateJob.isPending ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
