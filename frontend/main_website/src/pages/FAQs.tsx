import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function FAQs() {
  const faqs = [
    {
      question: "How do I book a ticket?",
      answer: "All bookings must be made online through our website or mobile app. Payment is required at the time of booking."
    },
    {
      question: "Can I cancel my ticket?",
      answer: "Yes. Cancellations can be made up to 72 hours before departure for a full refund. Cancellations within 24 hours are non-refundable."
    },
    {
      question: "Can I change my travel date?",
      answer: "Yes, changes can be made depending on seat availability. Change fees may apply."
    },
    {
      question: "How early should I arrive before departure?",
      answer: "Arrive at least 45 minutes before departure for check-in. Late arrivals may forfeit their seat with no refund."
    },
    {
      question: "How much luggage can I bring?",
      answer: "Each passenger is allowed 1 piece of luggage (20kg max). Extra luggage may require additional fees."
    },
    {
      question: "Do you allow unaccompanied minors?",
      answer: "Children under 12 must travel with an adult. Children between 12 and 17 may travel alone with a signed indemnity form."
    },
    {
      question: "Are pets allowed?",
      answer: "No pets are allowed except certified guide dogs."
    },
    {
      question: "Do buses have on-board entertainment?",
      answer: "Where available, we offer family-friendly entertainment. Availability is not guaranteed."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find answers to common questions about our services
            </p>
          </div>
        </div>

        {/* FAQs Content */}
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-3">
                  <span className="text-blue-600 font-bold">{index + 1}.</span>
                  <span>{faq.question}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground pl-8">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Our customer support team is here to help you
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="tel:+26771799129" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Call: +267 71 799 129
                </a>
                <span className="text-muted-foreground">|</span>
                <a 
                  href="https://wa.me/26773442135" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  WhatsApp: +267 73 442 135
                </a>
                <span className="text-muted-foreground">|</span>
                <a 
                  href="mailto:info@kjkhandala.com" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Email: info@kjkhandala.com
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
