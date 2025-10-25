import { useEffect, useState } from "react";

export default function HeroCarousel() {
  const slides = [
    "/Screenshot (169).png",
    "/Screenshot (170).png",
    "/Screenshot (171).png",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative w-full h-[420px] overflow-hidden rounded-md">
      {slides.map((s, i) => (
        <img
          key={s}
          src={s}
          alt={`slide-${i}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
    </div>
  );
}
