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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, TrendingUp, Award, Target, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Performance() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [ratings, setRatings] = useState({
    attendance: 0,
    qualityOfWork: 0,
    teamwork: 0,
    communication: 0,
    punctuality: 0,
    initiative: 0
  });
  const [formData, setFormData] = useState({
    employeeId: '',
    periodStart: '',
    periodEnd: '',
    strengths: '',
    areasForImprovement: '',
    goals: '',
    comments: ''
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, employee_id, department, email')
        .order('full_name');
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      console.log('Fetched employees:', data);
      return data || [];
    },
  });

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_evaluations')
        .select(`
          *,
          employee:profiles!performance_evaluations_employee_id_fkey(full_name, employee_id, department),
          evaluator:profiles!performance_evaluations_evaluator_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 6;

  const createEvaluation = useMutation({
    mutationFn: async (evalData: any) => {
      const response = await api.post('/hr/evaluations', {
        employee_id: evalData.employeeId,
        period_start: evalData.periodStart,
        period_end: evalData.periodEnd,
        attendance_score: ratings.attendance,
        quality_of_work_score: ratings.qualityOfWork,
        teamwork_score: ratings.teamwork,
        communication_score: ratings.communication,
        leadership_score: ratings.punctuality,
        problem_solving_score: ratings.initiative,
        strengths: evalData.strengths,
        areas_for_improvement: evalData.areasForImprovement,
        goals: evalData.goals,
        comments: evalData.comments
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance'] });
      toast.success('Performance evaluation submitted');
      setShowAddDialog(false);
      setRatings({ attendance: 0, qualityOfWork: 0, teamwork: 0, communication: 0, punctuality: 0, initiative: 0 });
      setFormData({ employeeId: '', periodStart: '', periodEnd: '', strengths: '', areasForImprovement: '', goals: '', comments: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit evaluation');
    }
  });

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.periodStart || !formData.periodEnd) {
      toast.error('Please fill all required fields');
      return;
    }
    if (overallRating === 0) {
      toast.error('Please provide ratings for all metrics');
      return;
    }
    createEvaluation.mutate(formData);
  };

  const avgScore = evaluations.length > 0
    ? evaluations.reduce((sum: number, e: any) => sum + (e.overall || 0), 0) / evaluations.length
    : 0;

  const summary = {
    totalEvaluations: evaluations.length,
    avgScore: parseFloat(avgScore.toFixed(1)),
    topPerformers: evaluations.filter((e: any) => (e.overall || 0) >= 4.5).length,
    needsImprovement: evaluations.filter((e: any) => (e.overall || 0) < 3.5).length,
  };

  const RatingSlider = ({ label, value, onChange }: any) => (
    <div>
      <div className="flex justify-between mb-2">
        <Label>{label}</Label>
        <span className="text-sm font-medium">{value}/5</span>
      </div>
      <input
        type="range"
        min="0"
        max="5"
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Performance Evaluation</h1>
            <p className="text-muted-foreground">Track and manage employee performance</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Evaluation
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avgScore}/5.0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.topPerformers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.needsImprovement}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEvaluations}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Productivity</TableHead>
                  <TableHead>Punctuality</TableHead>
                  <TableHead>Teamwork</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No performance evaluations found
                    </TableCell>
                  </TableRow>
                ) : (
                  evaluations.map((evaluation: any) => (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{evaluation.employee?.full_name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{evaluation.employee?.employee_id || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{evaluation.employee?.department || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {evaluation.period_start} to {evaluation.period_end}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span>{evaluation.quality_of_work_score || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span>{evaluation.punctuality_score || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span>{evaluation.teamwork_score || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-bold">{parseFloat(evaluation.overall_rating || 0).toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">{evaluation.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button>View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Performance Evaluation</DialogTitle>
              <DialogDescription>Evaluate employee performance for the period</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Select value={formData.employeeId} onValueChange={(value) => setFormData({...formData, employeeId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No employees found</div>
                    ) : (
                      employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} {emp.employee_id ? `(${emp.employee_id})` : emp.email ? `(${emp.email})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Period Start</Label>
                  <Input type="date" value={formData.periodStart} onChange={(e) => setFormData({...formData, periodStart: e.target.value})} />
                </div>
                <div>
                  <Label>Period End</Label>
                  <Input type="date" value={formData.periodEnd} onChange={(e) => setFormData({...formData, periodEnd: e.target.value})} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium">Performance Ratings</h3>
                <RatingSlider label="Attendance" value={ratings.attendance} onChange={(v: number) => setRatings({...ratings, attendance: v})} />
                <RatingSlider label="Quality of Work" value={ratings.qualityOfWork} onChange={(v: number) => setRatings({...ratings, qualityOfWork: v})} />
                <RatingSlider label="Teamwork" value={ratings.teamwork} onChange={(v: number) => setRatings({...ratings, teamwork: v})} />
                <RatingSlider label="Communication" value={ratings.communication} onChange={(v: number) => setRatings({...ratings, communication: v})} />
                <RatingSlider label="Punctuality" value={ratings.punctuality} onChange={(v: number) => setRatings({...ratings, punctuality: v})} />
                <RatingSlider label="Initiative" value={ratings.initiative} onChange={(v: number) => setRatings({...ratings, initiative: v})} />
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Overall Rating:</span>
                    <span className="text-2xl font-bold">{overallRating.toFixed(1)}/5.0</span>
                  </div>
                </div>
              </div>
              <div>
                <Label>Strengths</Label>
                <Textarea value={formData.strengths} onChange={(e) => setFormData({...formData, strengths: e.target.value})} placeholder="Key strengths demonstrated" />
              </div>
              <div>
                <Label>Areas for Improvement</Label>
                <Textarea value={formData.areasForImprovement} onChange={(e) => setFormData({...formData, areasForImprovement: e.target.value})} placeholder="Areas needing development" />
              </div>
              <div>
                <Label>Goals</Label>
                <Textarea value={formData.goals} onChange={(e) => setFormData({...formData, goals: e.target.value})} placeholder="Goals for next period" />
              </div>
              <div>
                <Label>Comments</Label>
                <Textarea value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})} placeholder="Additional comments" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createEvaluation.isPending}>
                  {createEvaluation.isPending ? 'Submitting...' : 'Submit Evaluation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
