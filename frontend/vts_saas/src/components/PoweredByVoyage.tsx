/**
 * PoweredByVoyage Component
 * 
 * Displays "Powered by Voyage" branding in the footer of all VTS SaaS pages.
 * This ensures consistent branding across the multi-tenant application.
 */

export default function PoweredByVoyage() {
  return (
    <div className="flex items-center justify-center py-4 px-4 text-sm text-muted-foreground border-t bg-background">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Powered by branding */}
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <a 
            href="https://voyage.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <svg 
              className="w-4 h-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M3 12h18M12 3l9 9-9 9" />
            </svg>
            Voyage
          </a>
        </div>

        {/* Right: Links */}
        <div className="flex items-center gap-2 text-xs">
          <a 
            href="https://voyage.com/terms" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Terms
          </a>
          <span>•</span>
          <a 
            href="https://voyage.com/privacy" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Privacy
          </a>
          <span>•</span>
          <a 
            href="https://voyage.com/contact" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Support
          </a>
          <span>•</span>
          <a 
            href="https://docs.voyage.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            API Docs
          </a>
        </div>
      </div>
    </div>
  );
}
