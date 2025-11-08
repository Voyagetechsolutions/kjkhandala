import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function HRSettings() {
  const [settings, setSettings] = useState({
    // Leave Settings
    annualLeaveDays: '21',
    sickLeaveDays: '10',
    emergencyLeaveDays: '5',
    unpaidLeaveAllowed: true,
    
    // Working Hours
    workingHoursPerDay: '8',
    workingDaysPerWeek: '5',
    overtimeRate: '1.5',
    
    // Probation
    probationPeriodMonths: '3',
    
    // Performance
    evaluationFrequency: 'quarterly',
    performanceScaleMax: '5',
  });

  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['hr-employees'],
    queryFn: async () => {
      const response = await api.get('/hr/employees');
      return Array.isArray(response.data) ? response.data : (response.data?.employees || []);
    },
  });

  const departmentData = employees.reduce((acc: any[], emp: any) => {
    const existing = acc.find(d => d.name === emp.department);
    if (existing) {
      existing.headCount++;
    } else if (emp.department) {
      acc.push({ id: acc.length + 1, name: emp.department, headCount: 1 });
    }
    return acc;
  }, []);

  const [departments, setDepartments] = useState(departmentData);

  const jobTitles = [...new Set(employees.map((e: any) => ({ title: e.position, department: e.department })))]
    .filter((j: any) => j.title)
    .map((j: any, index: number) => ({ id: index + 1, ...j }));

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/hr/settings', data);
    },
    onSuccess: () => {
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleSaveSettings = () => {
    saveMutation.mutate(settings);
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">HR Settings</h1>
            <p className="text-muted-foreground">Configure HR policies and parameters</p>
          </div>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
          </Button>
        </div>

        {/* Leave Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Policies</CardTitle>
            <CardDescription>Configure leave types and allowances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Annual Leave Days</Label>
                <Input
                  type="number"
                  value={settings.annualLeaveDays}
                  onChange={(e) => setSettings({...settings, annualLeaveDays: e.target.value})}
                />
              </div>
              <div>
                <Label>Sick Leave Days</Label>
                <Input
                  type="number"
                  value={settings.sickLeaveDays}
                  onChange={(e) => setSettings({...settings, sickLeaveDays: e.target.value})}
                />
              </div>
              <div>
                <Label>Emergency Leave Days</Label>
                <Input
                  type="number"
                  value={settings.emergencyLeaveDays}
                  onChange={(e) => setSettings({...settings, emergencyLeaveDays: e.target.value})}
                />
              </div>
              <div>
                <Label>Unpaid Leave</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={settings.unpaidLeaveAllowed ? 'yes' : 'no'}
                  onChange={(e) => setSettings({...settings, unpaidLeaveAllowed: e.target.value === 'yes'})}
                >
                  <option value="yes">Allowed</option>
                  <option value="no">Not Allowed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Working Hours & Overtime</CardTitle>
            <CardDescription>Define standard working hours and overtime rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Working Hours Per Day</Label>
                <Input
                  type="number"
                  value={settings.workingHoursPerDay}
                  onChange={(e) => setSettings({...settings, workingHoursPerDay: e.target.value})}
                />
              </div>
              <div>
                <Label>Working Days Per Week</Label>
                <Input
                  type="number"
                  value={settings.workingDaysPerWeek}
                  onChange={(e) => setSettings({...settings, workingDaysPerWeek: e.target.value})}
                />
              </div>
              <div>
                <Label>Overtime Rate Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.overtimeRate}
                  onChange={(e) => setSettings({...settings, overtimeRate: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance & Probation */}
        <Card>
          <CardHeader>
            <CardTitle>Performance & Probation</CardTitle>
            <CardDescription>Configure evaluation and probation settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Probation Period (Months)</Label>
                <Input
                  type="number"
                  value={settings.probationPeriodMonths}
                  onChange={(e) => setSettings({...settings, probationPeriodMonths: e.target.value})}
                />
              </div>
              <div>
                <Label>Evaluation Frequency</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={settings.evaluationFrequency}
                  onChange={(e) => setSettings({...settings, evaluationFrequency: e.target.value})}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="biannual">Bi-Annual</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <Label>Performance Scale (Max)</Label>
                <Input
                  type="number"
                  value={settings.performanceScaleMax}
                  onChange={(e) => setSettings({...settings, performanceScaleMax: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Manage company departments</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{dept.name}</div>
                    <div className="text-sm text-muted-foreground">{dept.headCount} employees</div>
                  </div>
                  <div className="flex gap-2">
                    <Button>Edit</Button>
                    <Button>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Titles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Job Titles & Positions</CardTitle>
                <CardDescription>Define available job titles</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Job Title
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobTitles.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-sm text-muted-foreground">{job.department}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button>Edit</Button>
                    <Button>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Document Templates</CardTitle>
            <CardDescription>Manage HR document templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Employment Contract Template</Label>
                <Textarea 
                  rows={3} 
                  placeholder="Enter contract template..."
                  defaultValue="This Employment Contract is entered into between KJ Khandala Bus Services and [EMPLOYEE_NAME]..."
                />
              </div>
              <div>
                <Label>Offer Letter Template</Label>
                <Textarea 
                  rows={3} 
                  placeholder="Enter offer letter template..."
                  defaultValue="Dear [CANDIDATE_NAME], We are pleased to offer you the position of [JOB_TITLE]..."
                />
              </div>
              <div>
                <Label>Termination Letter Template</Label>
                <Textarea 
                  rows={3} 
                  placeholder="Enter termination letter template..."
                  defaultValue="Dear [EMPLOYEE_NAME], This letter serves as formal notification of termination..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="h-12 px-6">
            <Save className="mr-2 h-5 w-5" />
            Save All Settings
          </Button>
        </div>
      </div>
    </HRLayout>
  );
}
