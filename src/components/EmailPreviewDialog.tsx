import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Mail, FileText, RefreshCw, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateQuotePdf } from "@/lib/generateQuotePdf";
import type { Quote } from "@/types/quote";

interface EmailPreviewDialogProps {
  quote: Quote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful send so the parent can update quote status. */
  onSent?: () => void;
}

const formatAUD = (n: number) =>
  `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parseEmailList = (raw: string): string[] =>
  raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

export default function EmailPreviewDialog({
  quote,
  open,
  onOpenChange,
  onSent,
}: EmailPreviewDialogProps) {
  const quoteNumber = quote.id.slice(-6).toUpperCase();
  const quoteTotal = formatAUD(quote.grandTotal);
  const propertyAddress = quote.client.address || "";
  const clientName = quote.client.name || "";

  const defaultSubject = `Your Garden Quote #${quoteNumber} from Mayura Garden Services`;
  const defaultIntro = propertyAddress
    ? `Thank you for the opportunity to quote on your garden at ${propertyAddress}. Please find the details of your tailored quote attached.`
    : `Thank you for the opportunity to quote on your garden. Please find the details of your tailored quote attached.`;

  const [subject, setSubject] = useState(defaultSubject);
  const [introMessage, setIntroMessage] = useState(defaultIntro);
  const [ccRaw, setCcRaw] = useState("");
  const [bccRaw, setBccRaw] = useState("");
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<"preview" | "confirm">("preview");
  const renderTimer = useRef<number | null>(null);
  const lastBlobUrl = useRef<string | null>(null);

  // Reset when opened with a (potentially) new quote
  useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setIntroMessage(defaultIntro);
      setCcRaw("");
      setBccRaw("");
      setStep("preview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quote.id]);

  const ccList = useMemo(() => parseEmailList(ccRaw), [ccRaw]);
  const bccList = useMemo(() => parseEmailList(bccRaw), [bccRaw]);
  const invalidEmails = useMemo(
    () => [...ccList, ...bccList].filter((e) => !EMAIL_RE.test(e)),
    [ccList, bccList],
  );

  const lineItems = useMemo(
    () =>
      quote.items.map((item) => {
        const unitClientPrice = item.unitCost * (1 + item.markupPercent / 100);
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: formatAUD(unitClientPrice),
          total: formatAUD(item.total),
        };
      }),
    [quote.items],
  );

  const preDiscountTotal = useMemo(
    () => quote.items.reduce((s, i) => s + i.total, 0),
    [quote.items],
  );

  const discountAmountNum = useMemo(() => {
    if (quote.discountType === "percentage") return preDiscountTotal * (quote.discountValue / 100);
    if (quote.discountType === "fixed") return quote.discountValue;
    return 0;
  }, [quote.discountType, quote.discountValue, preDiscountTotal]);

  const templateData = useMemo(
    () => ({
      clientName,
      quoteNumber,
      quoteTotal,
      propertyAddress,
      introMessage,
      subject,
      lineItems,
      subtotal: formatAUD(preDiscountTotal),
      discountLabel:
        quote.discountType === "percentage"
          ? `Discount (${quote.discountValue}%)`
          : quote.discountType === "fixed"
          ? "Discount"
          : undefined,
      discountAmount: discountAmountNum > 0 ? formatAUD(discountAmountNum) : undefined,
      notes: quote.notes,
    }),
    [
      clientName, quoteNumber, quoteTotal, propertyAddress, introMessage, subject,
      lineItems, preDiscountTotal, discountAmountNum,
      quote.discountType, quote.discountValue, quote.notes,
    ],
  );

  // Render email HTML via the edge function whenever editable fields change (debounced)
  useEffect(() => {
    if (!open) return;
    if (renderTimer.current) window.clearTimeout(renderTimer.current);
    renderTimer.current = window.setTimeout(async () => {
      setLoadingEmail(true);
      try {
        const { data, error } = await supabase.functions.invoke("render-quote-email", {
          body: { templateName: "quote-ready", templateData },
        });
        if (error) throw error;
        setEmailHtml((data as { html?: string })?.html ?? "");
      } catch (err) {
        console.error("Email render failed", err);
        setEmailHtml(
          `<div style="font-family:sans-serif;padding:24px;color:#b91c1c">Failed to render email preview. ${
            err instanceof Error ? err.message : ""
          }</div>`,
        );
      } finally {
        setLoadingEmail(false);
      }
    }, 350);
    return () => {
      if (renderTimer.current) window.clearTimeout(renderTimer.current);
    };
  }, [templateData, open]);

  // Generate the PDF preview once per open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingPdf(true);
    (async () => {
      try {
        const blobUrl = await generateQuotePdfBlobUrl(quote);
        if (!cancelled) {
          if (lastBlobUrl.current) URL.revokeObjectURL(lastBlobUrl.current);
          lastBlobUrl.current = blobUrl;
          setPdfUrl(blobUrl);
        }
      } catch (err) {
        console.error("PDF render failed", err);
        if (!cancelled) setPdfUrl("");
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, quote]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (lastBlobUrl.current) {
        URL.revokeObjectURL(lastBlobUrl.current);
        lastBlobUrl.current = null;
      }
    };
  }, []);

  const handleProceed = () => {
    if (!quote.client.email) {
      toast.error("No client email address on this quote");
      return;
    }
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email address: ${invalidEmails[0]}`);
      return;
    }
    setStep("confirm");
  };

  const handleSend = async () => {
    if (!quote.client.email) {
      toast.error("No client email address on this quote");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "quote-ready",
          recipientEmail: quote.client.email,
          cc: ccList.length > 0 ? ccList : undefined,
          bcc: bccList.length > 0 ? bccList : undefined,
          idempotencyKey: `quote-ready-${quote.id}-${hashString(
            subject + "|" + introMessage + "|" + ccList.join(",") + "|" + bccList.join(","),
          )}`,
          templateData,
        },
      });
      if (error) throw error;
      toast.success(`Quote sent to ${quote.client.email}`);
      onSent?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Send failed", err);
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle>
            {step === "preview" ? "Preview Email to Client" : "Confirm & Send"}
          </DialogTitle>
          <DialogDescription>
            {step === "preview"
              ? `Edit the subject, recipients and intro, then preview exactly what ${clientName || "your client"} will see.`
              : "Review the recipients and content below. Nothing has been sent yet."}
          </DialogDescription>
        </DialogHeader>

        {step === "preview" ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] overflow-hidden">
            {/* Editable fields */}
            <aside className="border-r p-5 space-y-4 overflow-y-auto bg-muted/30">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">To</Label>
                <Input value={quote.client.email || "(no email on file)"} readOnly className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-cc" className="text-xs uppercase tracking-wider">CC</Label>
                <Input
                  id="email-cc"
                  value={ccRaw}
                  onChange={(e) => setCcRaw(e.target.value)}
                  className="bg-background"
                  placeholder="comma separated"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-bcc" className="text-xs uppercase tracking-wider">BCC</Label>
                <Input
                  id="email-bcc"
                  value={bccRaw}
                  onChange={(e) => setBccRaw(e.target.value)}
                  className="bg-background"
                  placeholder="comma separated"
                />
              </div>
              {invalidEmails.length > 0 && (
                <p className="text-xs text-destructive flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  Invalid: {invalidEmails.join(", ")}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email-subject" className="text-xs uppercase tracking-wider">Subject</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-intro" className="text-xs uppercase tracking-wider">Personal Intro</Label>
                <Textarea
                  id="email-intro"
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                  rows={6}
                  className="bg-background resize-none"
                  placeholder="Add a personal note to the client…"
                />
              </div>
              <div className="rounded border bg-background p-3 text-sm space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Quote Summary</p>
                <p><span className="text-muted-foreground">Quote #</span> {quoteNumber}</p>
                {propertyAddress && <p><span className="text-muted-foreground">Property:</span> {propertyAddress}</p>}
                <p className="font-semibold"><span className="text-muted-foreground font-normal">Total:</span> {quoteTotal}</p>
              </div>
            </aside>

            {/* Preview tabs */}
            <section className="overflow-hidden flex flex-col">
              <Tabs defaultValue="email" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-5 mt-3 self-start">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="w-4 h-4" /> Email Body
                    {loadingEmail && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="gap-2">
                    <FileText className="w-4 h-4" /> Attached PDF
                    {loadingPdf && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="flex-1 overflow-hidden m-0 p-5 pt-3">
                  <div className="h-full border rounded-md bg-white overflow-hidden">
                    {emailHtml ? (
                      <iframe
                        title="Email preview"
                        srcDoc={emailHtml}
                        className="w-full h-full border-0"
                        sandbox=""
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Rendering preview…
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pdf" className="flex-1 overflow-hidden m-0 p-5 pt-3">
                  <div className="h-full border rounded-md bg-muted overflow-hidden">
                    {pdfUrl ? (
                      <iframe
                        title="Quote PDF preview"
                        src={pdfUrl}
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Generating PDF…
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Recipients</p>
                <SummaryRow label="To" values={[quote.client.email || ""]} />
                <SummaryRow label="CC" values={ccList} emptyText="— none —" />
                <SummaryRow label="BCC" values={bccList} emptyText="— none —" />
              </div>

              <div className="rounded-md border p-4 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Subject</p>
                <p className="text-sm font-medium">{subject}</p>
              </div>

              <div className="rounded-md border p-4 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Intro Message</p>
                <p className="text-sm whitespace-pre-wrap">{introMessage}</p>
              </div>

              <div className="rounded-md border p-4 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Quote</p>
                <div className="text-sm grid grid-cols-2 gap-y-1">
                  <span className="text-muted-foreground">Quote #</span><span>{quoteNumber}</span>
                  {clientName && (<><span className="text-muted-foreground">Client</span><span>{clientName}</span></>)}
                  {propertyAddress && (<><span className="text-muted-foreground">Property</span><span>{propertyAddress}</span></>)}
                  <span className="text-muted-foreground">Line items</span><span>{lineItems.length}</span>
                  <span className="text-muted-foreground">Total (inc. GST)</span><span className="font-semibold">{quoteTotal}</span>
                </div>
              </div>

              <div className="rounded-md border p-4 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Attachment: <span className="font-medium">Quote-{quoteNumber}.pdf</span>
              </div>

              <p className="text-xs text-muted-foreground text-center pt-1">
                Confirming will send the email immediately. You can still go back to make changes.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t flex-row sm:justify-between items-center gap-3">
          {step === "preview" ? (
            <>
              <p className="text-xs text-muted-foreground hidden sm:block">
                <RefreshCw className="w-3 h-3 inline mr-1" /> Preview updates as you type.
              </p>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProceed}
                  disabled={!quote.client.email || invalidEmails.length > 0}
                >
                  Continue to Confirm
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("preview")} disabled={sending}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to edit
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                  Cancel
                </Button>
                <Button onClick={handleSend} disabled={sending || !quote.client.email}>
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Confirm & Send
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, values, emptyText }: { label: string; values: string[]; emptyText?: string }) {
  const filtered = values.filter(Boolean);
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-12 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 flex flex-wrap gap-1.5">
        {filtered.length === 0 ? (
          <span className="text-muted-foreground italic">{emptyText ?? "—"}</span>
        ) : (
          filtered.map((v) => (
            <span key={v} className="inline-flex items-center rounded-full bg-background border px-2.5 py-0.5 text-xs">
              {v}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Generate the same quote PDF as the download flow but return a Blob URL for inline preview. */
async function generateQuotePdfBlobUrl(quote: Quote): Promise<string> {
  const jspdfModule = await import("jspdf");
  const originalSave = jspdfModule.jsPDF.prototype.save;
  let captured: { blob: Blob } | null = null;
  jspdfModule.jsPDF.prototype.save = function () {
    captured = { blob: this.output("blob") as Blob };
    return this;
  };
  try {
    await generateQuotePdf(quote);
  } finally {
    jspdfModule.jsPDF.prototype.save = originalSave;
  }
  if (!captured) throw new Error("PDF blob was not captured");
  return URL.createObjectURL((captured as { blob: Blob }).blob);
}
