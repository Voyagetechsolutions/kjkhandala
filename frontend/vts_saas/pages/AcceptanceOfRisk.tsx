import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AcceptanceOfRisk() {
  const risks = [
    "Travel involves inherent risks including but not limited to accidents, delays, and unforeseen circumstances.",
    "The company is not responsible for injuries, losses, or delays that may occur during travel.",
    "Passengers are responsible for their luggage and personal belongings at all times.",
    "All travel rules, immigration laws, and border requirements must be followed by passengers.",
    "Weather conditions, road conditions, and mechanical issues may affect travel schedules.",
    "Passengers must comply with all safety instructions provided by drivers and staff."
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Acceptance of Risk</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Important information about travel risks
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 bg-amber-50 border-amber-200">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Important Notice</h3>
                  <p className="text-amber-800">
                    By travelling with KJ Khandala Travel & Tours, you acknowledge and accept the 
                    risks associated with bus travel. Please read this document carefully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Acknowledgment of Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                By travelling with our company, passengers acknowledge and accept:
              </p>
              <ul className="space-y-3">
                {risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-muted-foreground pt-0.5">{risk}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-xl text-red-900">Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">
                KJ Khandala Travel & Tours shall not be held liable for any loss, damage, injury, 
                or death arising from the use of our services, including but not limited to negligence 
                by our employees or agents. Passengers travel entirely at their own risk.
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              For complete terms, please refer to our{' '}
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
