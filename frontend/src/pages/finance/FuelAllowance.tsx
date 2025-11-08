import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, CheckCircle, XCircle, Fuel, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function FuelAllowance() {
  const [filters, setFilters] = useState({
    status: 'all',
    driver: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const queryClient = useQueryClient();

  const { data: fuelLogs = [] } = useQuery({
    queryKey: ['finance-fuel'],
    queryFn: async () => {
      const response = await api.get('/finance/fuel');
      return Array.isArray(response.data) ? response.data : (response.data?.fuelLogs || []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/finance/fuel/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-fuel'] });
      toast.success('Fuel log approved');
    },
    onError: () => {
      toast.error('Failed to approve fuel log');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/finance/fuel/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-fuel'] });
      toast.success('Fuel log rejected');
    },
    onError: () => {
      toast.error('Failed to reject fuel log');
    },
  });

  const filteredLogs = fuelLogs.filter((log: any) => {
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    if (filters.driver !== 'all' && log.driver !== filters.driver) return false;
    if (filters.dateFrom && log.date < filters.dateFrom) return false;
    if (filters.dateTo && log.date > filters.dateTo) return false;
    return true;
  });

  const _mockFuelLogs = [
    {
      id: 1,
      date: '2024-11-06',
      driver: 'John Driver',
      driverId: 'DRV-001',
      bus: 'BUS-001',
      route: 'Gaborone - Francistown',
      quantity: 85,
      pricePerLiter: 15.50,
      totalCost: 1317.50,
      station: 'Shell Gaborone',
      estimated: 80,
      variance: 5,
      status: 'pending',
      receipt: true,
    },
    {
      id: 2,
      date: '2024-11-06',
      driver: 'Jane Smith',
      driverId: 'DRV-002',
      bus: 'BUS-005',
      route: 'Gaborone - Maun',
      quantity: 120,
      pricePerLiter: 15.50,
      totalCost: 1860,
      station: 'Engen Palapye',
      estimated: 115,
      variance: 5,
      status: 'approved',
      receipt: true,
    },
    {
      id: 3,
      date: '2024-11-05',
      driver: 'Mike Johnson',
      driverId: 'DRV-003',
      bus: 'BUS-008',
      route: 'Francistown - Kasane',
      quantity: 95,
      pricePerLiter: 15.50,
      totalCost: 1472.50,
      station: 'BP Francistown',
      estimated: 90,
      variance: 5,
      status: 'disputed',
      receipt: false,
    },
  ];

  const summary = {
    totalFuelCost: 125000,
    totalQuantity: 8065,
    averagePrice: 15.50,
    pendingApprovals: 8,
    approvedThisMonth: 145,
    totalVariance: 2.5,
  };

  const handleApprove = (id: number) => {
    console.log('Approving fuel log:', id);
  };

  const handleDispute = (id: number) => {
    console.log('Disputing fuel log:', id);
  };

  const handleExport = () => {
    console.log('Exporting fuel data');
  };

  return (
    <FinanceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fuel & Allowance Management</h1>
            <p className="text-muted-foreground">Manage fuel expenses and driver allowances</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
              <Fuel className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.totalFuelCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Fuel className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalQuantity.toLocaleString()} L</div>
              <p className="text-xs text-muted-foreground">Avg: P {summary.averagePrice}/L</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel Variance</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalVariance}%</div>
              <p className="text-xs text-muted-foreground">Actual vs Estimated</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Driver</Label>
                <Select value={filters.driver} onValueChange={(v) => setFilters({...filters, driver: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drivers</SelectItem>
                    <SelectItem value="drv1">John Driver</SelectItem>
                    <SelectItem value="drv2">Jane Smith</SelectItem>
                    <SelectItem value="drv3">Mike Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Log Submissions</CardTitle>
            <CardDescription>Driver fuel purchases and allowances</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Quantity (L)</TableHead>
                  <TableHead className="text-right">Price/L</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.driver}</div>
                        <div className="text-sm text-muted-foreground">{log.driverId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{log.bus}</TableCell>
                    <TableCell className="text-sm">{log.route}</TableCell>
                    <TableCell>{log.station}</TableCell>
                    <TableCell className="text-right font-medium">{log.quantity} L</TableCell>
                    <TableCell className="text-right">P {log.pricePerLiter}</TableCell>
                    <TableCell className="text-right font-bold">P {log.totalCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Est: {log.estimated} L</div>
                        <div className={log.variance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {log.variance > 0 ? '+' : ''}{log.variance} L
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.receipt ? (
                        <Badge className="bg-green-500">Attached</Badge>
                      ) : (
                        <Badge className="bg-red-500">Missing</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        log.status === 'approved' ? 'bg-green-500' :
                        log.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button onClick={() => handleApprove(log.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleDispute(log.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Fuel Efficiency Analysis */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Fuel Stations</CardTitle>
              <CardDescription>Most used refueling locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shell Gaborone</span>
                  <span className="font-medium">45 refills</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Engen Palapye</span>
                  <span className="font-medium">38 refills</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">BP Francistown</span>
                  <span className="font-medium">32 refills</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fuel Efficiency by Route</CardTitle>
              <CardDescription>Average consumption per route</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gaborone - Francistown</span>
                  <span className="font-medium">19.2 km/L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gaborone - Maun</span>
                  <span className="font-medium">18.5 km/L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Francistown - Kasane</span>
                  <span className="font-medium">17.8 km/L</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FinanceLayout>
  );
}
