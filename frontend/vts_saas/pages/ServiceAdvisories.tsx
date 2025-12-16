import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';

export default function ServiceAdvisories() {
  const { data: advisories = [], isLoading } = useQuery({
    queryKey: ['service-advisories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_advisories')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-amber-600" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
      default:
        return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Service Advisories</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay informed about service updates and changes
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Information Card */}
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="py-6">
              <h3 className="font-semibold text-blue-900 mb-2">What are Service Advisories?</h3>
              <p className="text-blue-800">
                Service advisories inform customers about changes such as route delays, road closures, 
                weather disruptions, public holiday schedules, temporary terminal changes, and major 
                service interruptions. These will be posted on the website and communicated by SMS/email 
                when possible.
              </p>
            </CardContent>
          </Card>

          {/* Advisories List */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading service advisories...</p>
            </div>
          ) : advisories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Advisories</h3>
                <p className="text-muted-foreground">
                  All services are operating normally. Check back here for any updates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {advisories.map((advisory: any) => (
                <Card key={advisory.id} className={`border-l-4 ${getSeverityColor(advisory.severity)}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getIcon(advisory.severity)}
                        <div>
                          <CardTitle className="text-xl mb-2">{advisory.title}</CardTitle>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">
                              {advisory.severity}
                            </Badge>
                            <Badge variant="outline">
                              {advisory.affected_routes || 'All Routes'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{advisory.message}</p>
                    {advisory.expected_resolution && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Expected Resolution:</strong> {new Date(advisory.expected_resolution).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Posted: {new Date(advisory.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Contact Section */}
          <Card className="mt-8">
            <CardContent className="py-6 text-center">
              <h3 className="font-semibold mb-2">Need More Information?</h3>
              <p className="text-muted-foreground mb-4">
                Contact our customer service team for real-time updates
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="tel:+26771799129" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  +267 71 799 129
                </a>
                <span className="text-muted-foreground">|</span>
                <a 
                  href="https://wa.me/26773442135" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
