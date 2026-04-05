import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import mayuraLogo from "@/assets/mayura-logo.png";
import { Flower2, TreePine, Shovel, Scissors, Leaf, Sparkles, Phone, Mail } from "lucide-react";

const services = [
  { icon: Flower2, title: "Garden Styling", desc: "Transform gardens to boost property appeal for marketing photos" },
  { icon: TreePine, title: "Planting", desc: "Strategic plant selection and placement for maximum visual impact" },
  { icon: Shovel, title: "Mulching & Soil", desc: "Premium mulch and soil preparation for a polished finish" },
  { icon: Leaf, title: "Lawn Care", desc: "Lush, green lawns that photograph beautifully" },
  { icon: Scissors, title: "Hedge Trimming", desc: "Crisp, manicured hedges and topiary for clean lines" },
  { icon: Sparkles, title: "Clean-Ups", desc: "Complete garden clean-ups to present properties at their best" },
];

const steps = [
  { num: "01", title: "Consultation", desc: "We visit the property and assess what's needed to make it shine" },
  { num: "02", title: "Quote", desc: "You receive a detailed, transparent quote with no surprises" },
  { num: "03", title: "Transformation", desc: "We transform the garden in time for the photographer" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center py-20 text-center">
          <img src={mayuraLogo} alt="Mayura Garden Services" className="h-28 w-auto rounded-lg mb-8" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Maximising Property Value
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mb-8">
            Professional pre-sale garden styling that makes your property photos stand out. 
            We transform gardens so homes sell faster and for more.
          </p>
          <div className="flex gap-4">
            <a href="tel:+64211234567">
              <Button size="lg" variant="secondary" className="gap-2">
                <Phone className="w-4 h-4" /> Call Us
              </Button>
            </a>
            <a href="mailto:hello@mayuragardenservices.com.au">
              <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Mail className="w-4 h-4" /> Get in Touch
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-2">Our Services</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
          Everything your property needs to look its absolute best before the camera arrives.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-3xl mx-auto">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="text-4xl font-bold text-primary/20 mb-2">{step.num}</div>
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Maximise Your Property's Value?</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Get in touch today for a free consultation and quote. We'll make sure your garden 
          looks picture-perfect for sale day.
        </p>
        <div className="flex justify-center gap-4">
          <a href="tel:+64211234567">
            <Button size="lg" className="gap-2">
              <Phone className="w-4 h-4" /> Call Now
            </Button>
          </a>
          <a href="mailto:hello@mayuragardenservices.com.au">
            <Button size="lg" variant="outline" className="gap-2">
              <Mail className="w-4 h-4" /> Email Us
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container text-center">
          <img src={mayuraLogo} alt="Mayura" className="h-12 w-auto mx-auto rounded mb-3" />
          <p className="text-sm text-primary-foreground/70">
            Mayura Garden Services — Maximising Property Value
          </p>
          <p className="text-xs text-primary-foreground/50 mt-2">
            © {new Date().getFullYear()} Mayura Garden Services. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
