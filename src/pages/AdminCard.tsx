import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { Phone, Mail, Globe, Share2, Download, QrCode, LayoutDashboard, Copy, MapPin } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import mayuraLogo from "@/assets/mayura-logo-horizontal.png";
import { buildVCard, downloadVCard, type VCardData } from "@/lib/vcard";

const CONTACT: VCardData = {
  fullName: "Nicholas Di Pietro",
  organization: "Mayura Garden Services",
  title: "Pre-sale Garden Styling & Landscaping",
  phone: "+61413806551",
  email: "nicholas@mayuragardenservices.com.au",
  website: "https://mayuragardenservices.com.au",
  note: "ABN 22 046 912 532 — Lower Templestowe, Melbourne",
};

export default function AdminCard() {
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(buildVCard(CONTACT), {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
      color: { dark: "#052A1D", light: "#FFFFFF" },
    }).then(setQrDataUrl).catch(() => {});
  }, []);

  // Subtle tilt effect — feels collectible/holographic
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const handleLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
  };

  const handleShare = async () => {
    const shareData = {
      title: CONTACT.organization,
      text: `${CONTACT.fullName} — ${CONTACT.organization}\n${CONTACT.phone}\n${CONTACT.email}`,
      url: CONTACT.website,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast({ title: "Copied to clipboard", description: "Contact details ready to share." });
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-start py-4 sm:py-8">
        <div className="w-full max-w-md">
          {/* Collectible card */}
          <div
            ref={cardRef}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className="relative rounded-3xl p-6 sm:p-8 shadow-2xl transition-transform duration-200 ease-out overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #052A1D 0%, #0A3D2A 50%, #052A1D 100%)",
              border: "1px solid rgba(191, 163, 88, 0.35)",
              boxShadow:
                "0 20px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(191,163,88,0.2)",
            }}
          >
            {/* Holographic sheen */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
              style={{
                background:
                  "radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(191,163,88,0.35), transparent 45%)",
              }}
            />
            {/* Gold corner ornaments */}
            <div aria-hidden className="absolute top-3 left-3 w-6 h-6 border-t border-l rounded-tl-xl" style={{ borderColor: "#BFA358" }} />
            <div aria-hidden className="absolute top-3 right-3 w-6 h-6 border-t border-r rounded-tr-xl" style={{ borderColor: "#BFA358" }} />
            <div aria-hidden className="absolute bottom-3 left-3 w-6 h-6 border-b border-l rounded-bl-xl" style={{ borderColor: "#BFA358" }} />
            <div aria-hidden className="absolute bottom-3 right-3 w-6 h-6 border-b border-r rounded-br-xl" style={{ borderColor: "#BFA358" }} />

            <div className="relative flex flex-col items-center text-center gap-4">
              <img src={mayuraLogo} alt="Mayura Garden Services" className="h-16 w-auto" />

              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#BFA358" }}>
                  Digital Contact Card
                </p>
                <h1 className="font-display text-3xl" style={{ color: "#F5EBD0" }}>
                  Nicholas Di Pietro
                </h1>
                <p className="text-xs" style={{ color: "rgba(245,235,208,0.7)" }}>
                  Pre-sale Garden Styling &amp; Landscaping
                </p>
              </div>

              <div className="w-16 h-px" style={{ background: "linear-gradient(90deg, transparent, #BFA358, transparent)" }} />

              <div className="w-full space-y-2 text-left">
                <ContactRow icon={Phone} label="Phone" value="0413 806 551" href="tel:+61413806551" onCopy={() => handleCopy("0413 806 551", "Phone")} />
                <ContactRow icon={Mail} label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} onCopy={() => handleCopy(CONTACT.email, "Email")} />
                <ContactRow icon={Globe} label="Website" value="mayuragardenservices.com.au" href={CONTACT.website} onCopy={() => handleCopy(CONTACT.website, "Website")} />
                <ContactRow icon={MapPin} label="Service area" value="Lower Templestowe, Melbourne" />
              </div>

              <p className="text-[10px] tracking-wider pt-2" style={{ color: "rgba(191,163,88,0.7)" }}>
                ABN 22 046 912 532
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <Button
              onClick={() => downloadVCard(CONTACT, "nicholas-di-pietro.vcf")}
              className="h-12 flex-col gap-0.5 text-[11px]"
              style={{ background: "#BFA358", color: "#052A1D" }}
            >
              <Download className="w-4 h-4" />
              Save contact
            </Button>
            <Button onClick={handleShare} variant="outline" className="h-12 flex-col gap-0.5 text-[11px]">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button onClick={() => setQrOpen(true)} variant="outline" className="h-12 flex-col gap-0.5 text-[11px]">
              <QrCode className="w-4 h-4" />
              Show QR
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/admin/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
              <LayoutDashboard className="w-3 h-3 inline mr-1" />
              Open full dashboard
            </Link>
          </div>
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-2xl">Scan to save contact</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 pt-2">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Contact QR code" className="w-64 h-64 rounded-lg border" />
            ) : (
              <div className="w-64 h-64 bg-muted animate-pulse rounded-lg" />
            )}
            <p className="text-sm text-muted-foreground text-center">
              Point a phone camera at the code — it adds Nick straight to their contacts.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  onCopy,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
  onCopy?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5">
      <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "rgba(191,163,88,0.15)" }}>
        <Icon className="w-4 h-4" style={{ color: "#BFA358" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(245,235,208,0.5)" }}>
          {label}
        </p>
        <p className="text-sm truncate" style={{ color: "#F5EBD0" }}>
          {value}
        </p>
      </div>
      {onCopy && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCopy();
          }}
          className="p-1.5 rounded hover:bg-white/10"
          aria-label={`Copy ${label}`}
        >
          <Copy className="w-3.5 h-3.5" style={{ color: "rgba(191,163,88,0.7)" }} />
        </button>
      )}
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}
