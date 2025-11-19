import HeroSlideshow from "./HeroSlideshow";
import BookingWidget from "./BookingWidget";
import TypingAnimation from "./TypingAnimation";

export default function NewHero() {
  return (
    <div className="relative min-h-[600px] w-full flex items-center justify-center overflow-hidden">
      {/* Background Slideshow - Absolute positioned behind content */}
      <div className="absolute inset-0 w-full h-full">
        <HeroSlideshow />
      </div>

      {/* Content - Centered with proper z-index */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg min-h-[120px] md:min-h-[160px] flex items-center justify-center">
            <TypingAnimation 
              text="The world is yours to create memories with us" 
              speed={80}
            />
          </h1>
        </div>

        {/* Booking Widget */}
        <BookingWidget />
      </div>
    </div>
  );
}
