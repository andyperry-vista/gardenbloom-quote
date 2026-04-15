import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import heroBefore from "@/assets/gallery/hero-before.jpg";
import heroAfter from "@/assets/gallery/hero-after.jpg";
import heroProfessional from "@/assets/gallery/hero-professional.jpg";

const slides = [
  { src: heroBefore, label: "Before", variant: "outline" as const },
  { src: heroAfter, label: "After", variant: "default" as const },
  { src: heroProfessional, label: "Professional Shot", variant: "secondary" as const },
];

export default function BeforeAfterReveal() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 mt-4 md:mt-6 mb-8 md:mb-12">
      <div className="relative w-full aspect-video lg:aspect-[2/1] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl bg-secondary">
        {slides.map((slide, i) => (
          <img
            key={i}
            src={slide.src}
            alt={slide.label}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: current === i ? 1 : 0 }}
          />
        ))}

        {/* Label */}
        <div className="absolute top-6 left-6 z-10">
          <Badge
            variant={slides[current].variant}
            className="py-2 px-4 md:px-6 text-xs md:text-sm font-bold tracking-widest uppercase shadow-md backdrop-blur-md bg-background/90 border border-foreground/10 text-foreground transition-all duration-500"
          >
            {slides[current].label}
          </Badge>
        </div>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                current === i ? "bg-primary scale-125" : "bg-background/60"
              }`}
              aria-label={`Show ${slides[i].label}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
