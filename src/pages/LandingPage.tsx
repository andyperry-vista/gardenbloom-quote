import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import mayuraLogoHorizontal from "@/assets/mayura-logo-horizontal.png";
import mayuraLogoStacked from "@/assets/mayura-logo-stacked.webp";
import { supabase } from "@/integrations/supabase/client";
import { Flower2, TreePine, Shovel, Scissors, Leaf, Sparkles, Phone, Mail, Send, CheckCircle, Loader2, Camera, X, MessageCircle, Facebook, Twitter, Linkedin, Link2, Share2 } from "lucide-react";
import BeforeAfterGallery from "@/components/BeforeAfterGallery";
import GoldDivider from "@/components/GoldDivider";
import BeforeAfterReveal from "@/components/BeforeAfterReveal";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { TranslationKey } from "@/i18n/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";

const services: { icon: typeof Flower2; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Flower2, titleKey: "serviceGardenStyling", descKey: "serviceGardenStylingDesc" },
  { icon: TreePine, titleKey: "servicePlanting", descKey: "servicePlantingDesc" },
  { icon: Shovel, titleKey: "serviceMulching", descKey: "serviceMulchingDesc" },
  { icon: Leaf, titleKey: "serviceLawnCare", descKey: "serviceLawnCareDesc" },
  { icon: Scissors, titleKey: "serviceHedgeTrimming", descKey: "serviceHedgeTrimmingDesc" },
  { icon: Sparkles, titleKey: "serviceCleanUps", descKey: "serviceCleanUpsDesc" },
];

const steps: { num: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { num: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { num: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { num: "03", titleKey: "step3Title", descKey: "step3Desc" },
];

export default function LandingPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", message: "", referralCode: "" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const MAX_PHOTOS = 5;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);
    const valid = toAdd.filter(f => {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} is over 10MB`); return false; }
      return true;
    });
    setPhotos(prev => [...prev, ...valid]);
    setPhotoPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearPhotos = () => {
    setPhotos([]);
    setPhotoPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSending(true);
    try {
      const id = crypto.randomUUID();
      const photoUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const ext = photos[i].name.split(".").pop() || "jpg";
        const path = `quotes/${id}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("garden-photos").upload(path, photos[i]);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("garden-photos").getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      // Save to quote_requests table
      await supabase.from("quote_requests").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        message: form.message,
        photo_urls: photoUrls,
        referral_code: form.referralCode || "",
      });

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "quote-request",
          recipientEmail: form.email,
          idempotencyKey: `quote-req-${id}`,
          templateData: { name: form.name, email: form.email, phone: form.phone, address: form.address, message: form.message, photoUrl: photoUrls[0], photoUrls },
        },
      });
      if (error) throw error;

      // Automatically fire garden value analyzer AI if photos exist! (Runs asynchronously so client doesn't wait)
      if (photoUrls.length > 0) {
        supabase.functions.invoke("garden-value-analyzer", {
          body: { quoteRequestId: id, photoUrls }
        }).catch(err => console.error("Analyzer failed to fire:", err));
      }
      setSent(true);
      toast.success("Your request has been sent!");
    } catch {
      toast.error("Failed to send. Please try again or call us directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LanguageToggle />

      {/* Hero */}
      <section className="relative">
        <div className="container flex flex-col items-center py-8 md:py-12 text-center">
          <img
            src={mayuraLogoStacked}
            alt="Mayura Garden Services"
            width={480}
            height={480}
            fetchPriority="high"
            decoding="async"
            className="w-full max-w-sm md:max-w-md h-auto mb-8 px-4 sm:px-0 shadow-none object-scale-down"
          />
          <h1 className="sr-only">Mayura Garden Services</h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mb-8">
            {t("heroTagline")}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full px-6 sm:w-auto sm:px-0">
            <a href="#quote-form" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="gap-2 w-full">
                <Send className="w-4 h-4" /> {t("requestQuote")}
              </Button>
            </a>
            <a href="tel:0413806551" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="gap-2 border-foreground/30 text-foreground hover:bg-foreground/10 w-full">
                <Phone className="w-4 h-4" /> {t("callNick")}
              </Button>
            </a>
            <a href="mailto:nicholas@mayuragardenservices.com.au" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="gap-2 border-foreground/30 text-foreground hover:bg-foreground/10 w-full">
                <Mail className="w-4 h-4" /> {t("emailUs")}
              </Button>
            </a>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="gap-2 border-[#07C160]/30 text-[#07C160] hover:bg-[#07C160]/10 w-full sm:w-auto">
                  <MessageCircle className="w-4 h-4" /> WeChat Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">WeChat</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="contact" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contact">Add Me</TabsTrigger>
                    <TabsTrigger value="share">Share Page</TabsTrigger>
                  </TabsList>
                  <TabsContent value="contact">
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
                      <img src="/wechat-qr.jpg" alt="WeChat contact QR Code" className="w-64 h-64 object-contain shadow-sm border p-2 rounded-md" />
                      <p className="mt-4 text-sm text-center text-muted-foreground">Scan QR code to add me on WeChat</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="share">
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
                      <div className="p-3 bg-white border rounded-md shadow-sm">
                        <QRCodeSVG
                          value={typeof window !== "undefined" ? window.location.href : "https://www.mayuragardenservices.com.au/"}
                          size={232}
                          level="M"
                          marginSize={0}
                        />
                      </div>
                      <p className="mt-4 text-sm text-center text-muted-foreground">
                        Open WeChat → Scan, then tap ••• to share this page with your contacts or Moments.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Stunning Reveal Component added here */}
      <BeforeAfterReveal />

      <GoldDivider />

      {/* Services */}
      <section className="container py-12 md:py-16">
        <h2 className="text-3xl font-bold text-center mb-2">{t("servicesTitle")}</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
          {t("servicesSubtitle")}
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.titleKey} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{t(s.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(s.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <GoldDivider />

      {/* Before/After Gallery */}
      <BeforeAfterGallery />

      <GoldDivider />

      {/* How It Works */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-10">{t("howItWorksTitle")}</h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-3xl mx-auto">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="text-4xl font-bold text-primary/20 mb-2">{step.num}</div>
                <h3 className="font-semibold text-lg mb-1">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* Quote Request Form */}
      <section id="quote-form" className="container py-12 md:py-16">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">{t("quoteFormTitle")}</h2>
          <p className="text-muted-foreground text-center mb-8">
            {t("quoteFormSubtitle")}
          </p>

          {sent ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-xl font-semibold">{t("thankYouTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("thankYouMessage")}
                </p>
                <Button variant="outline" onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", address: "", message: "", referralCode: "" }); clearPhotos(); }}>
                  {t("submitAnother")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>{t("fullName")}</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Smith"
                        required
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label>{t("email")}</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@example.com"
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>{t("phone")}</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="0412 345 678"
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <Label>{t("propertyAddress")}</Label>
                      <Input
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="12 River Rd, Lower Templestowe VIC 3107"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label>Referral Code <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        value={form.referralCode}
                        onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                        placeholder="e.g. ABC123"
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t("projectDescription")}</Label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder={t("projectPlaceholder")}
                      rows={4}
                      maxLength={1000}
                    />
                  </div>
                  <div>
                    <Label>{t("photosLabel", { max: MAX_PHOTOS })}</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                      title="Upload photos"
                    />
                    {photoPreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {photoPreviews.map((preview, i) => (
                          <div key={i} className="relative">
                            <img src={preview} alt={`Garden photo ${i + 1}`} className="w-full h-32 object-cover rounded-lg border" />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-background"
                              title="Remove photo"
                              aria-label="Remove photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {photos.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 flex flex-col items-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-sm">{photos.length === 0 ? t("tapToAddPhotos") : t("addMore", { count: photos.length, max: MAX_PHOTOS })}</span>
                      </button>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {sending ? t("sending") : t("requestQuote")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center">
          <img src={mayuraLogoHorizontal} alt="Mayura" className="h-16 w-auto mx-auto rounded mb-3" />
          <p className="text-sm text-foreground/70">
            {t("footerTagline")}
          </p>
          <p className="text-xs text-foreground/50 mt-2">
            {t("footerRights", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <a href="/agent/login" className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors">
              Agent Portal
            </a>
            <span className="text-foreground/20">·</span>
            <a href="/admin/login" className="text-xs text-foreground/30 hover:text-foreground/60 transition-colors">
              {t("admin")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
