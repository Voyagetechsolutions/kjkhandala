import { ReactNode } from "react";

interface TicketingLayoutProps {
  children: ReactNode;
}

export default function TicketingLayout({ children }: TicketingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content - Full Width */}
      <main className="w-full">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
