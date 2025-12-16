import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, AlertCircle } from 'lucide-react';

export default function TicketRules() {
  const rules = [
    "Tickets are valid only for the passenger whose details appear on the ticket.",
    "Tickets cannot be transferred to another person but may be changed to another date/time (fees may apply).",
    "Passengers must show ID and ticket reference number when boarding.",
    "Only tickets purchased through the company or its authorized agents are valid."
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Ticket Rules</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Important information about your ticket
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">General Ticket Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-muted-foreground pt-1">{rule}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Important Notice</h3>
                  <p className="text-amber-800">
                    Please ensure you arrive at least 45 minutes before departure for check-in. 
                    Late arrivals may forfeit their seat with no refund. Always carry a valid ID 
                    and your ticket reference number when traveling.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              For more information, please refer to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline font-medium">
                Terms & Conditions
              </a>
            </p>
          </div>
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
