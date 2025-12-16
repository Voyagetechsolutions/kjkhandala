import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Save, Volume2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NotificationPreferences {
  email: {
    bookingConfirmation: boolean;
    tripReminder: boolean;
    paymentReceipt: boolean;
    maintenanceAlerts: boolean;
    systemUpdates: boolean;
  };
  sms: {
    bookingConfirmation: boolean;
    tripReminder: boolean;
    paymentReceipt: boolean;
    emergencyAlerts: boolean;
  };
  inApp: {
    bookingUpdates: boolean;
    tripUpdates: boolean;
    paymentNotifications: boolean;
    maintenanceAlerts: boolean;
    driverMessages: boolean;
    systemNotifications: boolean;
  };
  push: {
    enabled: boolean;
    bookingUpdates: boolean;
    tripReminders: boolean;
    promotions: boolean;
  };
}

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      bookingConfirmation: true,
      tripReminder: true,
      paymentReceipt: true,
      maintenanceAlerts: false,
      systemUpdates: false
    },
    sms: {
      bookingConfirmation: true,
      tripReminder: true,
      paymentReceipt: false,
      emergencyAlerts: true
    },
    inApp: {
      bookingUpdates: true,
      tripUpdates: true,
      paymentNotifications: true,
      maintenanceAlerts: true,
      driverMessages: true,
      systemNotifications: true
    },
    push: {
      enabled: true,
      bookingUpdates: true,
      tripReminders: true,
      promotions: false
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          email: preferences.email,
          sms: preferences.sms,
          inApp: preferences.inApp,
          push: preferences.push
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (category: keyof NotificationPreferences, key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600">Manage how you receive notifications and alerts</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Email Notifications */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Email Notifications</h2>
            <p className="text-sm text-gray-600">Receive notifications via email</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(preferences.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-sm text-gray-500">
                  {key === 'bookingConfirmation' && 'Get email when booking is confirmed'}
                  {key === 'tripReminder' && 'Reminder before your scheduled trip'}
                  {key === 'paymentReceipt' && 'Receipt after successful payment'}
                  {key === 'maintenanceAlerts' && 'Alerts about bus maintenance'}
                  {key === 'systemUpdates' && 'Updates about system changes'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updatePreference('email', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">SMS Notifications</h2>
            <p className="text-sm text-gray-600">Receive notifications via text message</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(preferences.sms).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-sm text-gray-500">
                  {key === 'bookingConfirmation' && 'SMS when booking is confirmed'}
                  {key === 'tripReminder' && 'SMS reminder before trip'}
                  {key === 'paymentReceipt' && 'SMS receipt after payment'}
                  {key === 'emergencyAlerts' && 'Critical emergency alerts'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updatePreference('sms', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">In-App Notifications</h2>
            <p className="text-sm text-gray-600">Notifications within the application</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(preferences.inApp).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-sm text-gray-500">
                  {key === 'bookingUpdates' && 'Updates about your bookings'}
                  {key === 'tripUpdates' && 'Real-time trip status updates'}
                  {key === 'paymentNotifications' && 'Payment confirmations and receipts'}
                  {key === 'maintenanceAlerts' && 'Bus maintenance notifications'}
                  {key === 'driverMessages' && 'Messages from drivers'}
                  {key === 'systemNotifications' && 'System announcements'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updatePreference('inApp', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Push Notifications</h2>
            <p className="text-sm text-gray-600">Browser and mobile push notifications</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(preferences.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-sm text-gray-500">
                  {key === 'enabled' && 'Enable all push notifications'}
                  {key === 'bookingUpdates' && 'Push alerts for booking changes'}
                  {key === 'tripReminders' && 'Push reminders before trips'}
                  {key === 'promotions' && 'Special offers and promotions'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updatePreference('push', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
