import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Award, Target } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function Performance() {
  const { data: evaluations = [] } = useQuery({
    queryKey: ['hr-performance'],
    queryFn: async () => {
      const response = await api.get('/hr/performance/evaluations');
      return Array.isArray(response.data) ? response.data : (response.data?.evaluations || []);
    },
  });

  const avgScore = evaluations.length > 0
    ? evaluations.reduce((sum: number, e: any) => sum + (e.overall || 0), 0) / evaluations.length
    : 0;

  const summary = {
    totalEvaluations: evaluations.length,
    avgScore: parseFloat(avgScore.toFixed(1)),
    topPerformers: evaluations.filter((e: any) => (e.overall || 0) >= 4.5).length,
    needsImprovement: evaluations.filter((e: any) => (e.overall || 0) < 3.5).length,
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Performance Evaluation</h1>
          <p className="text-muted-foreground">Track and manage employee performance</p>
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
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{evaluation.name}</div>
                        <div className="text-sm text-muted-foreground">{evaluation.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{evaluation.department}</TableCell>
                    <TableCell>{evaluation.period}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>{evaluation.productivity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>{evaluation.punctuality}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>{evaluation.teamwork}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-bold">{evaluation.overall}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">{evaluation.status}</Badge>
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
      </div>
    </HRLayout>
  );
}
