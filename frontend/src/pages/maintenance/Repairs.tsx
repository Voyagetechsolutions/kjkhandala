import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, DollarSign, Package, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function Repairs() {
  const { data: repairs = [] } = useQuery({
    queryKey: ['repairs'],
    queryFn: async () => {
      const response = await api.get('/maintenance/repairs');
      return Array.isArray(response.data) ? response.data : (response.data?.repairs || []);
    },
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return Array.isArray(response.data) ? response.data : (response.data?.buses || []);
    },
  });

  const summary = {
    totalRepairs: repairs.length,
    partsCost: repairs.reduce((sum: number, r: any) => sum + (parseFloat(r.partsCost) || 0), 0),
    laborCost: repairs.reduce((sum: number, r: any) => sum + (parseFloat(r.laborCost) || 0), 0),
    totalCost: repairs.reduce((sum: number, r: any) => sum + (parseFloat(r.partsCost) || 0) + (parseFloat(r.laborCost) || 0), 0),
  };

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Repairs & Parts Replacement</h1>
          <p className="text-muted-foreground">Track repairs and parts usage</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalRepairs}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parts Cost</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.partsCost.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.laborCost.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {summary.totalCost.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Repair History</CardTitle>
            <CardDescription>All completed and ongoing repairs</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Repair Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parts Replaced</TableHead>
                  <TableHead>Mechanic</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Parts Cost</TableHead>
                  <TableHead className="text-right">Labor Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No repairs found
                    </TableCell>
                  </TableRow>
                ) : (
                  repairs.map((repair: any) => {
                    const bus = buses.find((b: any) => b.id === repair.busId);
                    const totalCost = (parseFloat(repair.partsCost) || 0) + (parseFloat(repair.laborCost) || 0);
                    
                    return (
                      <TableRow key={repair.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{bus?.registrationNumber || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{bus?.model || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">Repair</TableCell>
                        <TableCell className="max-w-xs">{repair.description}</TableCell>
                        <TableCell>
                          <div className="text-sm">Parts replaced</div>
                        </TableCell>
                        <TableCell>{repair.mechanicId || 'N/A'}</TableCell>
                        <TableCell>{new Date(repair.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            N/A
                          </div>
                        </TableCell>
                        <TableCell className="text-right">P {parseFloat(repair.partsCost || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">P {parseFloat(repair.laborCost || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold">P {totalCost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">{repair.status || 'completed'}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MaintenanceLayout>
  );
}
