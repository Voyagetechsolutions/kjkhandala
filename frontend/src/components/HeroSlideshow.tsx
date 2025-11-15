import { useState, useEffect } from "react";

const images = [
  "/2buses1.jpg",
  "/2buses2.jpg",
  "/2buses3.jpg",
  "/2buses4.jpg",
  "/2buses5.jpg",
  "/scania1.jpg",
  "/scania2.jpg",
  "/scania3.jpg",
  "/torino1.jpg",
  "/torino2.jpg",
  "/torino3.jpg",
];

export default function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000); // Change image every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={image}
            alt={`KJ Khandala Coach ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
