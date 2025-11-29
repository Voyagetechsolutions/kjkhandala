import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, Users, Calendar, MapPin, Building2, Plus, Edit, Trash2, 
  Eye, FileText, Send, CheckCircle, XCircle, Clock, TrendingUp,
  Search, Filter, Download, Mail, Phone, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface JobPosting {
  id: string;
  job_title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_range?: string;
  description: string;
  requirements: string;
  responsibilities: string;
  status: 'active' | 'closed' | 'draft' | 'inactive' | 'archived';
  posted_at: string;
  closing_date?: string;
  posted_by: string;
  job_applications?: {
    count: number;
  };
}

interface JobApplication {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string;
  experience?: string;
  cover_letter?: string;
  resume_url?: string;
  status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected';
  applied_at: string;
  job_postings?: {
    job_title: string;
    department: string;
  };
}

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  
  const [jobForm, setJobForm] = useState({
    job_title: '',
    department: '',
    location: '',
    employment_type: '',
    salary_range: '',
    description: '',
    requirements: '',
    responsibilities: '',
    closing_date: '',
    status: 'draft' as 'active' | 'closed' | 'draft' | 'inactive' | 'archived'
  });

  const queryClient = useQueryClient();

  // Fetch job postings
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['job-postings', selectedDepartment, selectedStatus],
    queryFn: async () => {
      try {
        let query = supabase
          .from('job_postings')
          .select(`
            *
          `)
          .order('posted_at', { ascending: false });

        if (selectedDepartment !== 'all') {
          query = query.eq('department', selectedDepartment);
        }
        
        if (selectedStatus !== 'all') {
          query = query.eq('status', selectedStatus);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching job postings:', error);
        toast.error('Failed to load job postings. Please check your permissions.');
        return [];
      }
    },
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['job-applications'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            *,
            job_postings(job_title, department)
          `)
          .order('applied_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications. Please check your permissions.');
        return [];
      }
    },
  });

  // Create/Update job posting
  const jobMutation = useMutation({
    mutationFn: async (jobData: Partial<JobPosting>) => {
      if (editingJob) {
        const { data, error } = await supabase
          .from('job_postings')
          .update(jobData)
          .eq('id', editingJob.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('job_postings')
          .insert({
            ...jobData,
            posted_at: new Date().toISOString(),
            posted_by: (await supabase.auth.getUser()).data.user?.id || null
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success(editingJob ? 'Job updated successfully' : 'Job posted successfully');
      setShowJobDialog(false);
      setEditingJob(null);
      setJobForm({
        job_title: '',
        department: '',
        location: '',
        employment_type: '',
        salary_range: '',
        description: '',
        requirements: '',
        responsibilities: '',
        closing_date: '',
        status: 'draft'
      });
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
    },
    onError: (error) => {
      toast.error('Failed to save job posting: ' + error.message);
    },
  });

  // Delete job posting
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Job posting deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
    },
    onError: (error) => {
      toast.error('Failed to delete job posting: ' + error.message);
    },
  });

  // Update application status
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Application status updated');
      setShowApplicationDialog(false);
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
    },
    onError: (error) => {
      toast.error('Failed to update application: ' + error.message);
    },
  });

  const handleSubmitJob = () => {
    if (!jobForm.job_title || !jobForm.department || !jobForm.location || !jobForm.employment_type || !jobForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    jobMutation.mutate(jobForm);
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setJobForm({
      job_title: job.job_title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      salary_range: job.salary_range || '',
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      closing_date: job.closing_date || '',
      status: job.status
    });
    setShowJobDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
      active: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      closed: { variant: 'secondary', icon: <XCircle className="h-3 w-3" /> },
      draft: { variant: 'outline', icon: <FileText className="h-3 w-3" /> },
      inactive: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      archived: { variant: 'outline', icon: <FileText className="h-3 w-3" /> },
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      reviewing: { variant: 'default', icon: <Eye className="h-3 w-3" /> },
      interview: { variant: 'default', icon: <Users className="h-3 w-3" /> },
      accepted: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    };
    
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredJobs = jobs?.filter(job => 
    job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const stats = {
    totalJobs: jobs?.length || 0,
    activeJobs: jobs?.filter(j => j.status === 'active').length || 0,
    totalApplications: applications?.length || 0,
    pendingApplications: applications?.filter(a => a.status === 'pending').length || 0,
    interviewing: applications?.filter(a => a.status === 'interview').length || 0,
    hired: applications?.filter(a => a.status === 'accepted').length || 0,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Error Display */}
        {(jobsError) && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <h3 className="font-medium">Database Permission Error</h3>
                  <p className="text-sm text-red-600">
                    There are permission issues with the recruitment tables. Please execute the SQL script 
                    <code className="ml-1 px-1 bg-red-100 rounded">database/fix_recruitment_permissions.sql</code> 
                    in your Supabase SQL Editor to fix the RLS policies.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Recruitment & Onboarding
            </h1>
            <p className="text-muted-foreground">Manage job postings and applications</p>
          </div>
          <Button onClick={() => setShowJobDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">Active Jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">Applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.interviewing}</div>
              <p className="text-xs text-muted-foreground">Interviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.hired}</div>
              <p className="text-xs text-muted-foreground">Hired</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="jobs">Job Postings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Customer Service">Customer Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Job Postings Table */}
            <Card>
              <CardHeader>
                <CardTitle>Job Postings</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="text-center py-8">Loading job postings...</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No job postings yet. Click "Post New Job" to create one.
                  </div>
                ) : (
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
                      {filteredJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{job.job_title}</div>
                              {job.salary_range && (
                                <div className="text-sm text-muted-foreground">{job.salary_range}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{job.department}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {job.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.employment_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(job.posted_at), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">0</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(job.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditJob(job)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteJobMutation.mutate(job.id)}
                                disabled={deleteJobMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="text-center py-8">Loading applications...</div>
                ) : applications?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications yet.
                  </div>
                ) : (
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
                      {applications?.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{application.applicant_name || application.full_name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{application.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{application.job_postings?.job_title}</div>
                              <div className="text-sm text-muted-foreground">{application.job_postings?.department}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {application.email}
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {application.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{application.experience || 'Not specified'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(application.applied_at), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(application.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowApplicationDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recruitment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Job Postings</span>
                      <span className="font-bold">{stats.totalJobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Positions</span>
                      <span className="font-bold text-green-600">{stats.activeJobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Applications</span>
                      <span className="font-bold">{stats.totalApplications}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Applications per Job</span>
                      <span className="font-bold">
                        {stats.activeJobs > 0 ? (stats.totalApplications / stats.activeJobs).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Pending Review</span>
                      <span className="font-bold text-orange-600">{stats.pendingApplications}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Interviewing</span>
                      <span className="font-bold text-purple-600">{stats.interviewing}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hired</span>
                      <span className="font-bold text-green-600">{stats.hired}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hiring Rate</span>
                      <span className="font-bold">
                        {stats.totalApplications > 0 
                          ? `${((stats.hired / stats.totalApplications) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Job Posting Dialog */}
        <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? 'Edit Job Posting' : 'Post New Job'}</DialogTitle>
              <DialogDescription>
                Create a new job posting that will appear on the careers page
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title *</Label>
                  <Input
                    id="job_title"
                    value={jobForm.job_title}
                    onChange={(e) => setJobForm({ ...jobForm, job_title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={jobForm.department} onValueChange={(value) => setJobForm({ ...jobForm, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Customer Service">Customer Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    placeholder="e.g. Harare, Zimbabwe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type *</Label>
                  <Select value={jobForm.employment_type} onValueChange={(value) => setJobForm({ ...jobForm, employment_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_range">Salary Range (Optional)</Label>
                  <Input
                    id="salary_range"
                    value={jobForm.salary_range}
                    onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                    placeholder="e.g. $50,000 - $70,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing_date">Closing Date (Optional)</Label>
                  <Input
                    id="closing_date"
                    type="date"
                    value={jobForm.closing_date}
                    onChange={(e) => setJobForm({ ...jobForm, closing_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Provide a detailed description of the role..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  placeholder="List the required qualifications and skills..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  value={jobForm.responsibilities}
                  onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
                  placeholder="Describe the key responsibilities and duties..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={jobForm.status} onValueChange={(value: 'active' | 'closed' | 'draft' | 'inactive' | 'archived') => setJobForm({ ...jobForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowJobDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitJob} disabled={jobMutation.isPending}>
                  {jobMutation.isPending ? 'Saving...' : (editingJob ? 'Update Job' : 'Post Job')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Application Details Dialog */}
        <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Applicant Name</Label>
                    <p className="font-medium">{selectedApplication.applicant_name || selectedApplication.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label>Applied Position</Label>
                    <p className="font-medium">{selectedApplication.job_postings?.job_title}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="font-medium">{selectedApplication.phone}</p>
                  </div>
                </div>

                {selectedApplication.experience && (
                  <div>
                    <Label>Experience</Label>
                    <p className="text-sm">{selectedApplication.experience}</p>
                  </div>
                )}

                {selectedApplication.cover_letter && (
                  <div>
                    <Label>Cover Letter</Label>
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Update Status</Label>
                  <Select
                    value={selectedApplication.status}
                    onValueChange={(value) => updateApplicationMutation.mutate({ 
                      applicationId: selectedApplication.id, 
                      status: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
                    Close
                  </Button>
                  {selectedApplication.resume_url && (
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
