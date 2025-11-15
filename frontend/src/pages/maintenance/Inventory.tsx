import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Package, AlertCircle, DollarSign } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Inventory() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    reorderLevel: 0,
    unitPrice: 0,
    supplier: '',
    location: '',
  });

  const queryClient = useQueryClient();

  // Fetch inventory items
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('part_name');
      if (error) throw error;
      return { items: data || [] };
    },
  });

  // Insert new inventory item
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: inserted, error } = await supabase
        .from('inventory')
        .insert([data])
        .select();
      if (error) throw error;
      console.log('Inserted:', inserted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item added to inventory');
      setShowAddDialog(false);
      setFormData({
        name: '',
        category: '',
        quantity: 0,
        reorderLevel: 0,
        unitPrice: 0,
        supplier: '',
        location: '',
      });
    },
    onError: (err: any) => {
      console.error('Insert error:', err);
      toast.error('Failed to add item. Check console for details.');
    },
  });

  const items = inventoryData?.items || [];

  // Inventory summary
  const summary = {
    totalItems: items.length,
    lowStock: items.filter((i: any) => i.quantity <= i.reorder_level && i.quantity > 0).length,
    outOfStock: items.filter((i: any) => i.quantity === 0).length,
    inventoryValue: items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_cost), 0),
  };

  // Handle adding item
  const handleAddItem = () => {
    const insertData = {
      part_name: formData.name.trim() || 'Unnamed Item',
      category: formData.category || 'Uncategorized',
      quantity: Number(formData.quantity) || 0,
      reorder_level: Number(formData.reorderLevel) || 0,
      unit_cost: parseFloat(formData.unitPrice as any) || 0,
      supplier: formData.supplier.trim() || null,
      location: formData.location.trim() || null,
      status: 'Available', // default
    };
    console.log('Inserting:', insertData);
    createMutation.mutate(insertData);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Inventory & Spare Parts</h1>
            <p className="text-muted-foreground">Manage spare parts and inventory</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.lowStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.outOfStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {summary.inventoryValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>All spare parts and supplies</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => {
                    const totalValue = item.quantity * item.unit_cost;
                    const status =
                      item.quantity === 0
                        ? 'out-of-stock'
                        : item.quantity <= item.reorder_level
                        ? 'low-stock'
                        : item.status || 'Available';

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.part_name}</TableCell>
                        <TableCell className="font-mono">{item.part_number || item.id.slice(0, 8)}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.reorder_level}</TableCell>
                        <TableCell className="text-right">P {parseFloat(item.unit_cost).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold">P {totalValue.toLocaleString()}</TableCell>
                        <TableCell>{item.supplier || 'N/A'}</TableCell>
                        <TableCell>{item.location || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              status === 'out-of-stock'
                                ? 'bg-red-500'
                                : status === 'low-stock'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm">Update</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Item Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>Add a new spare part to inventory</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Part Name</Label>
                <Input
                  placeholder="e.g., Oil Filter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option value="Filters">Filters</option>
                    <option value="Brakes">Brakes</option>
                    <option value="Engine">Engine</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Tires">Tires</option>
                  </select>
                </div>

                <div>
                  <Label>Supplier</Label>
                  <Input
                    placeholder="Supplier name"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.reorderLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <Label>Unit Cost (P)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Storage Location</Label>
                <Input
                  placeholder="e.g., Warehouse A"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Item'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
