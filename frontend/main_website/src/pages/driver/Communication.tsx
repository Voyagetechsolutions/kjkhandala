import { useState } from 'react';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bell, Inbox } from 'lucide-react';

export default function Communication() {
  const [message, setMessage] = useState('');

  const messages = [
    { id: 1, from: 'Operations', message: 'Route change for tomorrow', time: '10:30', type: 'operations', read: false },
    { id: 2, from: 'HR Department', message: 'License renewal reminder', time: 'Yesterday', type: 'hr', read: true },
    { id: 3, from: 'Admin', message: 'Company meeting next week', time: '2 days ago', type: 'announcement', read: true },
  ];

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Communication</h1>
          <p className="text-muted-foreground">Messages and announcements</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Message to Operations</CardTitle>
            <CardDescription>Contact the operations team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Inbox
            </CardTitle>
            <CardDescription>Messages and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="p-4 border rounded-lg flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{msg.from}</span>
                      <Badge className="text-xs">{msg.type}</Badge>
                      {!msg.read && <Badge className="bg-blue-500 text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No new announcements</p>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
