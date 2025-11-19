import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Clock, DollarSign, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Careers() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    linkedIn: '',
    portfolio: ''
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['public-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (applicationData: any) => {
      let resumeUrl = null;

      // Upload resume if provided
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);
        
        resumeUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('job_applications')
        .insert([{
          job_posting_id: applicationData.jobId,
          applicant_name: applicationData.fullName,
          email: applicationData.email,
          phone: applicationData.phone,
          resume_url: resumeUrl,
          cover_letter: applicationData.coverLetter,
          linkedin_url: applicationData.linkedIn,
          portfolio_url: applicationData.portfolio,
          status: 'submitted',
          application_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success('Application submitted successfully! We will review your application and get back to you soon.');
      setShowApplicationDialog(false);
      setSelectedJob(null);
      setResumeFile(null);
      setFormData({ fullName: '', email: '', phone: '', coverLetter: '', linkedIn: '', portfolio: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit application');
    }
  });

  const handleApply = (job: any) => {
    setSelectedJob(job);
    setShowApplicationDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast.error('Only PDF and Word documents are allowed');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!resumeFile) {
      toast.error('Please upload your resume');
      return;
    }
    submitApplication.mutate({ ...formData, jobId: selectedJob.id });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Build your career with us. Explore exciting opportunities.
            </p>
          </div>
        </div>

        {/* Job Listings */}
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Open Positions</h2>
            <p className="text-muted-foreground">We're looking for talented individuals to join our growing team</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading positions...</p>
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Open Positions</h3>
                <p className="text-muted-foreground">We don't have any open positions at the moment. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <Badge className="bg-blue-500">{job.employment_type}</Badge>
                  </div>
                  <CardDescription className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4" />
                      <span>{job.department}</span>
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4" />
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {job.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-sm">Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {job.requirements?.split('\n').slice(0, 3).map((req: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span className="line-clamp-1">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button onClick={() => handleApply(job)} className="w-full">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </div>
      </main>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+267 1234 5678"
                />
              </div>
            </div>
            <div>
              <Label>Resume/CV * (PDF or Word, max 5MB)</Label>
              <div className="mt-2">
                {resumeFile ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Upload className="h-5 w-5 text-green-500" />
                    <span className="flex-1 text-sm">{resumeFile.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setResumeFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-5 w-5" />
                    <span>Click to upload resume</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label>Cover Letter *</Label>
              <Textarea
                value={formData.coverLetter}
                onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                placeholder="Tell us why you're interested in this position..."
                rows={5}
              />
            </div>
            <div>
              <Label>LinkedIn Profile (Optional)</Label>
              <Input
                value={formData.linkedIn}
                onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <Label>Portfolio/Website (Optional)</Label>
              <Input
                value={formData.portfolio}
                onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitApplication.isPending}>
                {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
