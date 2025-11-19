import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, MapPin, AlertCircle, CreditCard } from 'lucide-react';

interface Passenger {
  seatNumber: string;
  title: string;
  fullName: string;
  gender: string;
  email: string;
  mobile: string;
  alternateNumber: string;
  idType: string;
  idNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  country: string;
  address: string;
}

interface PassengerDetailsProps {
  seats: string[];
  returnSeats?: string[];
  onDetailsSubmit: (passengers: Passenger[]) => void;
  passengers?: Passenger[];
}

export default function PassengerDetails({ seats = [], returnSeats = [], onDetailsSubmit, passengers = [] }: PassengerDetailsProps) {
  const [passengerData, setPassengerData] = useState<Passenger[]>(
    passengers.length > 0
      ? passengers
      : seats.map(seat => ({
          seatNumber: seat,
          title: '',
          fullName: '',
          gender: '',
          email: '',
          mobile: '',
          alternateNumber: '',
          idType: 'Omang',
          idNumber: '',
          emergencyName: '',
          emergencyPhone: '',
          country: 'Botswana',
          address: '',
        }))
  );

  useEffect(() => {
    // Update parent whenever data changes
    onDetailsSubmit(passengerData);
  }, [passengerData]);

  const handleChange = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengerData];
    updated[index] = { ...updated[index], [field]: value };
    setPassengerData(updated);
  };

  const copyToAll = (index: number) => {
    const source = passengerData[index];
    const updated = passengerData.map((p, i) => 
      i === 0 ? p : { 
        ...p, 
        email: source.email, 
        mobile: source.mobile, 
        alternateNumber: source.alternateNumber,
        emergencyName: source.emergencyName,
        emergencyPhone: source.emergencyPhone,
        country: source.country,
        address: source.address
      }
    );
    setPassengerData(updated);
  };

  if (seats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please select seats first</p>
      </div>
    );
  }

  const hasReturnTrip = returnSeats && returnSeats.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold">Enter Passenger Details</h3>
        <p className="text-muted-foreground">
          Please provide information for {seats.length} passenger{seats.length > 1 ? 's' : ''}
        </p>
        {hasReturnTrip && (
          <p className="text-sm text-blue-600 mt-2">
            ✓ These details will be used for both outbound and return trips
          </p>
        )}
      </div>

      {passengerData.map((passenger, index) => (
        <Card key={passenger.seatNumber}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                  {passenger.seatNumber}
                </div>
                <div>
                  <p className="font-semibold">Passenger {index + 1}</p>
                  <p className="text-sm text-muted-foreground">Seat {passenger.seatNumber}</p>
                </div>
              </div>

              {index === 0 && seats.length > 1 && (
                <button
                  type="button"
                  onClick={() => copyToAll(index)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Copy contact info to all
                </button>
              )}
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground">Personal Information</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`title-${index}`}>Title *</Label>
                  <Select
                    value={passenger.title}
                    onValueChange={(value) => handleChange(index, 'title', value)}
                  >
                    <SelectTrigger id={`title-${index}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Miss">Miss</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`fullName-${index}`}>
                    <User className="h-4 w-4 inline mr-1" />
                    Full Name *
                  </Label>
                  <Input
                    id={`fullName-${index}`}
                    value={passenger.fullName}
                    onChange={(e) => handleChange(index, 'fullName', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`gender-${index}`}>Gender *</Label>
                  <Select
                    value={passenger.gender}
                    onValueChange={(value) => handleChange(index, 'gender', value)}
                  >
                    <SelectTrigger id={`gender-${index}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground">Contact Details</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={passenger.email}
                    onChange={(e) => handleChange(index, 'email', e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`mobile-${index}`}>
                    <Phone className="h-4 w-4 inline mr-1" />
                    Mobile *
                  </Label>
                  <Input
                    id={`mobile-${index}`}
                    type="tel"
                    value={passenger.mobile}
                    onChange={(e) => handleChange(index, 'mobile', e.target.value)}
                    placeholder="+267 1234 5678"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`alternateNumber-${index}`}>
                    <Phone className="h-4 w-4 inline mr-1" />
                    Alternate Number
                  </Label>
                  <Input
                    id={`alternateNumber-${index}`}
                    type="tel"
                    value={passenger.alternateNumber}
                    onChange={(e) => handleChange(index, 'alternateNumber', e.target.value)}
                    placeholder="+267 9876 5432"
                  />
                </div>
              </div>
            </div>

            {/* Identification */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground">Identification</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`idType-${index}`}>
                    <CreditCard className="h-4 w-4 inline mr-1" />
                    ID Type *
                  </Label>
                  <Select
                    value={passenger.idType}
                    onValueChange={(value) => handleChange(index, 'idType', value)}
                  >
                    <SelectTrigger id={`idType-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Omang">Omang (National ID)</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Drivers License">Driver's License</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`idNumber-${index}`}>ID Number *</Label>
                  <Input
                    id={`idNumber-${index}`}
                    value={passenger.idNumber}
                    onChange={(e) => handleChange(index, 'idNumber', e.target.value)}
                    placeholder="123456789"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Emergency Contact
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`emergencyName-${index}`}>Emergency Contact Name *</Label>
                  <Input
                    id={`emergencyName-${index}`}
                    value={passenger.emergencyName}
                    onChange={(e) => handleChange(index, 'emergencyName', e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`emergencyPhone-${index}`}>Emergency Contact Phone *</Label>
                  <Input
                    id={`emergencyPhone-${index}`}
                    type="tel"
                    value={passenger.emergencyPhone}
                    onChange={(e) => handleChange(index, 'emergencyPhone', e.target.value)}
                    placeholder="+267 1234 5678"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address Information
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`country-${index}`}>Country *</Label>
                  <Select
                    value={passenger.country}
                    onValueChange={(value) => handleChange(index, 'country', value)}
                  >
                    <SelectTrigger id={`country-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Botswana">Botswana</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                      <SelectItem value="Namibia">Namibia</SelectItem>
                      <SelectItem value="Zambia">Zambia</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`address-${index}`}>Physical Address *</Label>
                  <Textarea
                    id={`address-${index}`}
                    value={passenger.address}
                    onChange={(e) => handleChange(index, 'address', e.target.value)}
                    placeholder="Street address, city, postal code"
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Please ensure all information is accurate. You'll need to present ID at check-in.
        </p>
      </div>
    </div>
  );
}
