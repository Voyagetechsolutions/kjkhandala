import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function Privacy() {
  const sections = [
    {
      title: "1. Introduction",
      content: [
        "We respect your privacy and follow all applicable data protection laws, including South Africa's POPIA (Protection of Personal Information Act).",
        "By using our website or mobile app, you consent to the collection, processing, and storage of your information as described in this policy."
      ]
    },
    {
      title: "2. Information We Collect",
      content: [
        "We may collect the following information:",
        "• Name, phone number, email address",
        "• ID number or passport details (for cross-border travel)",
        "• Billing and payment information",
        "• Travel history and preferences",
        "• Device and usage data (cookies, analytics, IP address)",
        "• App usage statistics (via Firebase or Huawei analytics)",
        "",
        "Cookies help improve your browsing experience and are not harmful."
      ]
    },
    {
      title: "3. How We Use Your Information",
      content: [
        "Your data may be used to:",
        "• Process bookings and payments",
        "• Provide customer support",
        "• Improve our website and mobile app",
        "• Send promotions, updates, and service notifications",
        "• Ensure safety and security",
        "",
        "We do not sell your information to third parties."
      ]
    },
    {
      title: "4. When We May Share Your Information",
      content: [
        "We may share information with:",
        "• Law enforcement agencies (when required by law)",
        "• Payment providers (to process transactions)",
        "• Border or immigration officials (for cross-border travel)",
        "• Service providers who assist in our operations",
        "",
        "Information is only shared when legally required or necessary for service delivery."
      ]
    },
    {
      title: "5. Security",
      content: [
        "We take reasonable steps to secure your information using industry-standard security measures.",
        "However, we cannot guarantee complete internet security.",
        "Passwords and personal login details must be kept private and secure.",
        "Please notify us immediately if you suspect unauthorized access to your account."
      ]
    },
    {
      title: "6. External Links",
      content: [
        "Our website may contain links to external websites.",
        "These external sites are not covered by this Privacy Policy.",
        "We are not responsible for the privacy practices of third-party websites.",
        "Please review their privacy policies before providing any personal information."
      ]
    },
    {
      title: "7. Mobile App Analytics",
      content: [
        "Our mobile app uses analytics services:",
        "• Firebase Analytics (Google Play & Apple App Store)",
        "• Huawei Push Kit (Huawei AppGallery)",
        "",
        "Data collected includes:",
        "• Device model and operating system",
        "• App version and session duration",
        "• Install statistics and crash reports",
        "",
        "All data is handled according to POPIA and international data protection standards."
      ]
    },
    {
      title: "8. Your Rights",
      content: [
        "Under POPIA, you have the right to:",
        "• Access your personal information",
        "• Request correction of inaccurate data",
        "• Request deletion of your data (subject to legal requirements)",
        "• Object to processing of your data",
        "• Withdraw consent at any time",
        "",
        "To exercise these rights, please contact us using the details below."
      ]
    },
    {
      title: "9. Data Retention",
      content: [
        "We retain your personal information for as long as necessary to:",
        "• Provide our services",
        "• Comply with legal obligations",
        "• Resolve disputes and enforce agreements",
        "",
        "When data is no longer needed, it will be securely deleted or anonymized."
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your privacy is important to us
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="py-6">
              <p className="text-blue-900">
                This Privacy Policy explains how KJ Khandala Travel & Tours collects, uses, and protects 
                your personal information. We are committed to protecting your privacy and complying with 
                all applicable data protection laws.
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

          {/* Contact Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights, 
                please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> info@kjkhandala.com</p>
                <p><strong>Phone:</strong> +267 71 799 129</p>
                <p><strong>WhatsApp:</strong> +267 73 442 135</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">
                Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                This Privacy Policy is subject to change. Please check this page regularly for updates.
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
