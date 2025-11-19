import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { ArrowLeft, UserPlus, Search, Copy, CheckCircle2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PassengerForm {
  full_name: string;
  phone: string;
  email: string;
  id_number: string;
  passport_number: string;
  gender: string;
  nationality: string;
  date_of_birth: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  special_notes: string;
  seat_number: number;
}

export default function PassengerDetails() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [trip, setTrip] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengers, setPassengers] = useState<PassengerForm[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  useEffect(() => {
    // Get data from sessionStorage
    const tripData = sessionStorage.getItem('selectedTrip');
    const passengersCount = sessionStorage.getItem('passengers');

    if (!tripData || !passengersCount) {
      toast({
        variant: 'destructive',
        title: 'Missing data',
        description: 'Please search for a trip first',
      });
      const basePath = isAdminRoute ? '/admin/ticketing' : '/ticketing';
      navigate(`${basePath}/search-trips`);
      return;
    }

    const trip = JSON.parse(tripData);
    const count = parseInt(passengersCount);

    setTrip(trip);

    // Initialize passenger forms (without seat numbers yet)
    const forms: PassengerForm[] = Array.from({ length: count }, () => ({
      full_name: '',
      phone: '',
      email: '',
      id_number: '',
      passport_number: '',
      gender: '',
      nationality: 'Botswana',
      date_of_birth: '',
      next_of_kin_name: '',
      next_of_kin_phone: '',
      special_notes: '',
      seat_number: 0, // Will be assigned during seat selection
    }));

    setPassengers(forms);
  }, []);

  const searchCustomer = async () => {
    if (!searchPhone) {
      toast({
        variant: 'destructive',
        title: 'Enter phone number',
        description: 'Please enter a phone number to search',
      });
      return;
    }

    try {
      setSearchingCustomer(true);

      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('phone', searchPhone)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'Customer not found',
            description: 'No existing customer with this phone number',
          });
        } else {
          throw error;
        }
        return;
      }

      // Fill first passenger form with customer data
      if (data) {
        const updatedPassengers = [...passengers];
        updatedPassengers[0] = {
          ...updatedPassengers[0],
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.email || '',
          id_number: data.id_number || '',
          passport_number: data.passport_number || '',
          gender: data.gender || '',
          nationality: data.nationality || 'Botswana',
          date_of_birth: data.date_of_birth || '',
          next_of_kin_name: data.next_of_kin_name || '',
          next_of_kin_phone: data.next_of_kin_phone || '',
          special_notes: data.special_notes || '',
        };
        setPassengers(updatedPassengers);

        toast({
          title: 'Customer found',
          description: 'Customer details loaded successfully',
        });
      }
    } catch (error: any) {
      console.error('Error searching customer:', error);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.message,
      });
    } finally {
      setSearchingCustomer(false);
    }
  };

  const updatePassenger = (index: number, field: keyof PassengerForm, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const duplicateFirstPassenger = () => {
    if (passengers.length < 2) return;

    const first = passengers[0];
    const updated = passengers.map((p, index) => {
      if (index === 0) return p;
      return {
        ...p,
        phone: first.phone,
        email: first.email,
        next_of_kin_name: first.next_of_kin_name,
        next_of_kin_phone: first.next_of_kin_phone,
        nationality: first.nationality,
      };
    });

    setPassengers(updated);
    toast({
      title: 'Details copied',
      description: 'Contact details copied to all passengers',
    });
  };

  const validateAndProceed = () => {
    // Validate all passengers
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.full_name || !p.phone) {
        toast({
          variant: 'destructive',
          title: 'Missing required fields',
          description: `Passenger ${i + 1}: Full name and phone are required`,
        });
        return;
      }

      if (!p.id_number && !p.passport_number) {
        toast({
          variant: 'destructive',
          title: 'Missing ID',
          description: `Passenger ${i + 1}: ID number or passport is required`,
        });
        return;
      }
    }

    // Store passenger data
    sessionStorage.setItem('passengerDetails', JSON.stringify(passengers));

    // Navigate to seat selection
    const basePath = isAdminRoute ? '/admin/ticketing' : '/ticketing';
    navigate(`${basePath}/seat-selection`);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">👥 Passenger Details</h1>
            <p className="text-muted-foreground">
              Enter details for {passengers.length} passenger(s)
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            const basePath = isAdminRoute ? '/admin/ticketing' : '/ticketing';
            navigate(`${basePath}/search-trips`);
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>

        {/* Customer Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Lookup</CardTitle>
            <CardDescription>Search for existing customer by phone number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter phone number"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
              />
              <Button onClick={searchCustomer} disabled={searchingCustomer}>
                <Search className="h-4 w-4 mr-2" />
                {searchingCustomer ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Passenger Forms */}
        {passengers.map((passenger, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Passenger {index + 1}
                  </CardTitle>
                  <CardDescription>Enter passenger information</CardDescription>
                </div>
                {index === 0 && passengers.length > 1 && (
                  <Button onClick={duplicateFirstPassenger} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Contact Info to All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`name-${index}`}
                    placeholder="e.g., John Doe"
                    value={passenger.full_name}
                    onChange={(e) => updatePassenger(index, 'full_name', e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor={`phone-${index}`}>
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`phone-${index}`}
                    placeholder="e.g., +267 71234567"
                    value={passenger.phone}
                    onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>Email (Optional)</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="e.g., john@example.com"
                    value={passenger.email}
                    onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                  />
                </div>

                {/* ID Number */}
                <div className="space-y-2">
                  <Label htmlFor={`id-${index}`}>
                    ID Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`id-${index}`}
                    placeholder="e.g., 123456789"
                    value={passenger.id_number}
                    onChange={(e) => updatePassenger(index, 'id_number', e.target.value)}
                  />
                </div>

                {/* Passport */}
                <div className="space-y-2">
                  <Label htmlFor={`passport-${index}`}>Passport Number</Label>
                  <Input
                    id={`passport-${index}`}
                    placeholder="e.g., A12345678"
                    value={passenger.passport_number}
                    onChange={(e) => updatePassenger(index, 'passport_number', e.target.value)}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor={`gender-${index}`}>Gender</Label>
                  <Select
                    value={passenger.gender}
                    onValueChange={(value) => updatePassenger(index, 'gender', value)}
                  >
                    <SelectTrigger id={`gender-${index}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nationality */}
                <div className="space-y-2">
                  <Label htmlFor={`nationality-${index}`}>Nationality</Label>
                  <Input
                    id={`nationality-${index}`}
                    placeholder="e.g., Botswana"
                    value={passenger.nationality}
                    onChange={(e) => updatePassenger(index, 'nationality', e.target.value)}
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor={`dob-${index}`}>Date of Birth</Label>
                  <Input
                    id={`dob-${index}`}
                    type="date"
                    value={passenger.date_of_birth}
                    onChange={(e) => updatePassenger(index, 'date_of_birth', e.target.value)}
                  />
                </div>

                {/* Next of Kin Name */}
                <div className="space-y-2">
                  <Label htmlFor={`kin-name-${index}`}>Next of Kin Name</Label>
                  <Input
                    id={`kin-name-${index}`}
                    placeholder="e.g., Jane Doe"
                    value={passenger.next_of_kin_name}
                    onChange={(e) => updatePassenger(index, 'next_of_kin_name', e.target.value)}
                  />
                </div>

                {/* Next of Kin Phone */}
                <div className="space-y-2">
                  <Label htmlFor={`kin-phone-${index}`}>Next of Kin Phone</Label>
                  <Input
                    id={`kin-phone-${index}`}
                    placeholder="e.g., +267 71234567"
                    value={passenger.next_of_kin_phone}
                    onChange={(e) => updatePassenger(index, 'next_of_kin_phone', e.target.value)}
                  />
                </div>

                {/* Special Notes */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`notes-${index}`}>Special Notes</Label>
                  <Textarea
                    id={`notes-${index}`}
                    placeholder="e.g., Wheelchair user, infant, elderly, etc."
                    value={passenger.special_notes}
                    onChange={(e) => updatePassenger(index, 'special_notes', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Continue Button */}
        <Card>
          <CardContent className="pt-6">
            <Button onClick={validateAndProceed} className="w-full" size="lg">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Continue to Seat Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
