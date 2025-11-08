import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Mail, Phone, MapPin, Globe, DollarSign, Clock, Save, Upload } from 'lucide-react';

const companySchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  currency: z.enum(['BWP', 'USD', 'ZAR', 'EUR', 'GBP']),
  timezone: z.string(),
  businessHoursStart: z.string(),
  businessHoursEnd: z.string(),
  taxNumber: z.string().optional(),
  registrationNumber: z.string().optional()
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanySettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  logo?: string;
  currency: string;
  timezone: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  taxNumber?: string;
  registrationNumber?: string;
}

const Company = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      currency: 'BWP',
      timezone: 'Africa/Gaborone',
      businessHoursStart: '08:00',
      businessHoursEnd: '18:00'
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/settings/company', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
        reset(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    setUpdating(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Company settings updated successfully!' });
        await fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/settings/company/logo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Company logo updated!' });
        await fetchSettings();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload logo' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-gray-600">Manage your company information and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Company Logo */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Company Logo</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
              {settings?.logo ? (
                <img src={settings.logo} alt="Company Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-16 h-16 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 mb-2">Upload Company Logo</p>
            <p className="text-sm text-gray-500 mb-4">Recommended size: 512x512px (PNG, JPG, max 2MB)</p>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer w-fit">
              <Upload className="w-5 h-5" />
              Upload Logo
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Company Information</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              Company Name
            </label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Voyage Tech Solutions"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="info@company.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </label>
              <input
                {...register('phone')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+267 12345678"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Physical Address
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main Street, Gaborone, Botswana"
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Website (Optional)
            </label>
            <input
              {...register('website')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.company.com"
            />
            {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number (Optional)</label>
              <input
                {...register('taxNumber')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="TAX123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number (Optional)</label>
              <input
                {...register('registrationNumber')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="REG123456"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Business Settings */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Business Settings</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Default Currency
              </label>
              <select
                {...register('currency')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="BWP">BWP - Botswana Pula</option>
                <option value="USD">USD - US Dollar</option>
                <option value="ZAR">ZAR - South African Rand</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Timezone
              </label>
              <select
                {...register('timezone')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Africa/Gaborone">Africa/Gaborone (CAT)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Business Hours Start
              </label>
              <input
                {...register('businessHoursStart')}
                type="time"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Business Hours End
              </label>
              <input
                {...register('businessHoursEnd')}
                type="time"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            {updating ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Company;
