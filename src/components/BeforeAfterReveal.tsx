import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowDown } from "lucide-react";

export default function BeforeAfterReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const top = rect.top;
      
      // Calculate how far the image is visible inside the viewport
      // If it reaches height/3, it should be 100% revealed.
      const startTrigger = windowHeight * 0.9; // Start when element top hits 90% of screen height
      const endTrigger = windowHeight * 0.15; // Fully revealed when element top hits 15% of screen height
      
      let rawProgress = 0;
      if (top <= endTrigger) {
        rawProgress = 100;
      } else if (top >= startTrigger) {
        rawProgress = 0;
      } else {
        const totalDistance = startTrigger - endTrigger;
        const currentDistance = startTrigger - top;
        rawProgress = (currentDistance / totalDistance) * 100;
      }
      
      setProgress(Math.max(0, Math.min(100, rawProgress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger measurement immediately
    setTimeout(handleScroll, 100);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 my-12 md:my-20">
      <div className="mb-4 text-center pb-2">
        <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary uppercase tracking-[0.2em] px-4 py-1 text-xs md:text-sm font-semibold border-primary/20">
          The Mayura Focus
        </Badge>
        <h2 className="text-xl md:text-3xl font-display font-bold mt-2 text-foreground">See the Transformation</h2>
      </div>
      
      <div 
        ref={containerRef} 
        className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[21/9] lg:h-[550px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl bg-secondary transition-all"
      >
        {/* Before Layer (Bottom) */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img 
            src="/before-demo.jpg" 
            alt="Property Before Landscaping" 
            className="w-full h-full object-cover filter brightness-[0.9] blur-[1px] md:blur-0"
          />
        </div>

        {/* After Layer (Top, Clipped) */}
        <div 
          className="absolute inset-0 z-10 select-none pointer-events-none"
          style={{ 
            clipPath: `inset(0 ${100 - progress}% 0 0)`,
            transition: 'clip-path 0.05s ease-out'
          }}
        >
          <img 
            src="/after-demo.jpg" 
            alt="Property After Landscaping" 
            className="w-full h-full object-cover filter brightness-110 saturate-110"
          />
        </div>

        {/* Dynamic Drag Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-1.5 md:w-2 bg-white z-20 transition-all shadow-[0_0_20px_rgba(255,255,255,1)]"
          style={{ 
            left: `${progress}%`,
            opacity: progress > 0.5 && progress < 99.5 ? 1 : 0.1,
            transition: 'opacity 0.3s ease'
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-white backdrop-blur rounded-full flex gap-1 items-center justify-center shadow-[0_4px_25px_rgba(0,0,0,0.5)] border border-border">
             {/* Slider grip lines */}
             <div className="w-1 md:w-1.5 h-4 md:h-6 bg-primary/40 rounded-full" />
             <div className="w-1 md:w-1.5 h-4 md:h-6 bg-primary/40 rounded-full" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-6 left-6 z-0 pointer-events-none">
          <Badge variant="outline" className="bg-background/90 backdrop-blur-md border border-foreground/10 text-foreground py-2 px-4 md:px-6 text-xs md:text-sm font-bold tracking-widest uppercase shadow-md">
            Before
          </Badge>
        </div>
        
        <div 
          className="absolute bottom-6 md:top-6 right-6 z-30 transition-opacity duration-700 ease-in pointer-events-none"
          style={{ opacity: progress > 30 ? 1 : 0 }}
        >
          <Badge variant="default" className="bg-primary hover:bg-primary shadow-[0_0_15px_rgba(34,197,94,0.4)] border border-primary-foreground/30 py-2 px-5 text-sm md:text-base font-bold flex items-center gap-2 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 fill-white" /> After
          </Badge>
        </div>
        
        {/* Scroll Call to Action Hint */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 transition-all duration-700 ease-in-out pointer-events-none"
          style={{ 
            opacity: progress < 15 ? 1 : 0,
            transform: `translateY(${progress < 15 ? '0px' : '30px'}) scale(${progress < 15 ? 1 : 0.95})`
          }}
        >
          <span className="bg-background/95 backdrop-blur-md text-foreground text-xs md:text-sm font-bold uppercase tracking-wider px-6 py-2 rounded-full shadow-2xl border border-foreground/10">
            Scroll down to reveal
          </span>
          <ArrowDown className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-bounce" />
        </div>
      </div>
    </div>
  );
}
