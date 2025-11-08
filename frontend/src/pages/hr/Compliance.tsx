import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function Compliance() {
  const { data: certifications = [] } = useQuery({
    queryKey: ['hr-certifications'],
    queryFn: async () => {
      const response = await api.get('/hr/certifications');
      return Array.isArray(response.data) ? response.data : (response.data?.certifications || []);
    },
  });

  const today = new Date();
  const certWithStatus = certifications.map((cert: any) => {
    const expiry = new Date(cert.expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let status = 'valid';
    if (daysUntilExpiry < 0) status = 'expired';
    else if (daysUntilExpiry <= 30) status = 'expiring-soon';
    return { ...cert, daysUntilExpiry, status };
  });

  const summary = {
    totalCertifications: certifications.length,
    valid: certWithStatus.filter((c: any) => c.status === 'valid').length,
    expiringSoon: certWithStatus.filter((c: any) => c.status === 'expiring-soon').length,
    expired: certWithStatus.filter((c: any) => c.status === 'expired').length,
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Compliance & Certifications</h1>
          <p className="text-muted-foreground">Track licenses, certificates, and compliance</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valid</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.expiringSoon}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.expired}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCertifications}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Certifications & Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Until Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cert.name}</div>
                        <div className="text-sm text-muted-foreground">{cert.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{cert.type}</TableCell>
                    <TableCell className="font-mono">{cert.number}</TableCell>
                    <TableCell>{cert.issueDate}</TableCell>
                    <TableCell>{cert.expiryDate}</TableCell>
                    <TableCell>
                      <span className={
                        cert.daysUntilExpiry < 30 ? 'text-red-600 font-medium' :
                        cert.daysUntilExpiry < 60 ? 'text-yellow-600 font-medium' :
                        ''
                      }>
                        {cert.daysUntilExpiry} days
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        cert.status === 'valid' ? 'bg-green-500' :
                        cert.status === 'expiring-soon' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }>
                        {cert.status}
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
      </div>
    </HRLayout>
  );
}
