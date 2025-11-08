import { useState } from 'react';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fuel, Upload, DollarSign, Receipt } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FuelExpenses() {
  const [fuelData, setFuelData] = useState({
    quantity: '',
    pricePerLiter: '',
    station: '',
  });

  const expenses = [
    { id: 1, type: 'Fuel', amount: 450, date: '2024-11-06', status: 'pending' },
    { id: 2, type: 'Toll', amount: 25, date: '2024-11-06', status: 'approved' },
    { id: 3, type: 'Parking', amount: 15, date: '2024-11-05', status: 'approved' },
  ];

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fuel & Expenses</h1>
          <p className="text-muted-foreground">Log refueling and trip expenses</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Log Fuel Purchase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Fuel Quantity (Liters)</Label>
                <Input type="number" placeholder="50" />
              </div>
              <div>
                <Label>Price per Liter (P)</Label>
                <Input type="number" placeholder="15.50" />
              </div>
            </div>
            <div>
              <Label>Fuel Station</Label>
              <Input placeholder="Station name and location" />
            </div>
            <div>
              <Label>Upload Receipt</Label>
              <Button className="mt-2">
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total Cost:</span>
                <span>P 0.00</span>
              </div>
            </div>
            <Button className="w-full">
              <Receipt className="mr-2 h-4 w-4" />
              Submit Fuel Log
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Other Expenses</CardTitle>
            <CardDescription>Tolls, parking, and other trip-related costs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Expense Type</Label>
                <Input placeholder="Toll, Parking, etc." />
              </div>
              <div>
                <Label>Amount (P)</Label>
                <Input type="number" placeholder="25.00" />
              </div>
            </div>
            <Button>
              <DollarSign className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
            <CardDescription>Recent expenses and reimbursements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.type}</TableCell>
                    <TableCell>P {expense.amount}</TableCell>
                    <TableCell>
                      <span className={expense.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}>
                        {expense.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
