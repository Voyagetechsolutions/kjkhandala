import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Edit, Phone, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';

interface DriverCardProps {
  driver: any;
  onEdit: (driver: any) => void;
}

export default function DriverCard({ driver, onEdit }: DriverCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'on_leave':
        return 'bg-orange-500';
      case 'suspended':
        return 'bg-red-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isLicenseExpiringSoon = driver.license_expiry && 
    new Date(driver.license_expiry) <= new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{driver.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{driver.phone}</p>
            </div>
          </div>
          <Badge className={getStatusColor(driver.status)}>
            {getStatusLabel(driver.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Driver Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">License Number</p>
            <p className="font-medium font-mono">{driver.license_number}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Trips</p>
            <p className="font-medium">{driver.total_trips || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rating</p>
            <p className="font-medium flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {driver.rating ? parseFloat(driver.rating).toFixed(1) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Hire Date</p>
            <p className="font-medium">
              {driver.hire_date ? format(new Date(driver.hire_date), 'MMM yyyy') : 'N/A'}
            </p>
          </div>
        </div>

        {/* License Expiry */}
        {driver.license_expiry && (
          <div className={`p-3 rounded-lg ${isLicenseExpiringSoon ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className={`h-4 w-4 ${isLicenseExpiringSoon ? 'text-orange-600' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <p className={`font-medium ${isLicenseExpiringSoon ? 'text-orange-900' : ''}`}>
                  License Expiry
                </p>
                <p className={isLicenseExpiringSoon ? 'text-orange-700' : 'text-muted-foreground'}>
                  {format(new Date(driver.license_expiry), 'MMM dd, yyyy')}
                </p>
              </div>
              {isLicenseExpiringSoon && (
                <Badge className="bg-orange-500">Expiring Soon</Badge>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {driver.emergency_contact_name && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Emergency Contact:</p>
            <p>{driver.emergency_contact_name} - {driver.emergency_contact_phone}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(driver)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Phone className="h-3 w-3 mr-1" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
