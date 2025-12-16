import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function Terms() {
  const sections = [
    {
      title: "1. Acceptance of Risk",
      content: [
        "By using our services, passengers travel entirely at their own risk.",
        "The company is not liable for:",
        "• Loss or damage to property",
        "• Bodily injury",
        "• Delays or cancellations",
        "• Direct or indirect damages",
        "This includes negligence by employees or agents."
      ]
    },
    {
      title: "2. Online Booking",
      content: [
        "All bookings must be made through the website or official agents.",
        "Payment is required during booking.",
        "Credit/debit card bookings may require the cardholder to show their card and ID at check-in."
      ]
    },
    {
      title: "3. Ticket Cancellation and Refunds",
      content: [
        "Full refund if cancelled 72+ hours before departure.",
        "No refund if cancelled within 24 hours of departure.",
        "Refunds go back to the original payer."
      ]
    },
    {
      title: "4. Seat Allocation",
      content: [
        "Seats are assigned on a first-come, first-served basis.",
        "Seat requests may be made, but are not guaranteed."
      ]
    },
    {
      title: "5. Luggage Policy",
      content: [
        "1 free bag (20kg).",
        "Extra luggage may incur fees.",
        "Luggage is transported at the passenger's risk.",
        "Dangerous or illegal items are strictly prohibited."
      ]
    },
    {
      title: "6. Boarding Process",
      content: [
        "Check-in closes 15 minutes before departure.",
        "Passengers arriving late may lose their seat and must purchase a new ticket."
      ]
    },
    {
      title: "7. Code of Conduct",
      content: [
        "Disrespectful, disruptive, or unsafe behavior will result in removal without refund.",
        "Smoking, alcohol, and drugs are prohibited on all buses."
      ]
    },
    {
      title: "8. Schedule Changes",
      content: [
        "The company may change schedules due to:",
        "• Weather",
        "• Mechanical issues",
        "• Road closures",
        "• Safety concerns",
        "Passengers will be notified where possible."
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Please read these terms carefully before using our services
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="py-6">
              <p className="text-muted-foreground">
                By booking a ticket with KJ Khandala Travel & Tours, you agree to be bound by these 
                Terms and Conditions. Please read them carefully. If you do not agree with any part 
                of these terms, please do not use our services.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {section.content.map((line, lineIndex) => (
                      <p key={lineIndex} className="text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                These terms are subject to change without notice. Please check this page regularly for updates.
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
