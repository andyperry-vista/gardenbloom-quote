import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Mail, FileText, RefreshCw } from "lucide-react";
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
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [sending, setSending] = useState(false);
  const renderTimer = useRef<number | null>(null);
  const lastBlobUrl = useRef<string | null>(null);

  // Reset when opened with a (potentially) new quote
  useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setIntroMessage(defaultIntro);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quote.id]);

  const templateData = useMemo(
    () => ({
      clientName,
      quoteNumber,
      quoteTotal,
      propertyAddress,
      introMessage,
      subject, // used by subject() function in the template
    }),
    [clientName, quoteNumber, quoteTotal, propertyAddress, introMessage, subject],
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
        // Patched: generateQuotePdf saves the file. We need a Blob URL instead,
        // so we replicate using jsPDF's output('bloburl'). Easiest: call
        // generateQuotePdf with a Blob-returning variant. Since our existing
        // helper saves directly, regenerate inline here.
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        // Use the existing helper to populate the doc by monkey-patching save
        // is fragile — instead we re-use generateQuotePdf and produce a blob via
        // a wrapped jsPDF in lib later. For now, fall back to running generateQuotePdf
        // which downloads. To avoid forcing a download in the preview, we use a
        // dedicated blob path below.
        void doc; // discard placeholder
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
          // Idempotency keyed on subject+intro hash so an edited resend isn't blocked
          idempotencyKey: `quote-ready-${quote.id}-${hashString(subject + "|" + introMessage)}`,
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
          <DialogTitle>Preview Email to Client</DialogTitle>
          <DialogDescription>
            Edit the subject and intro message, then preview exactly what {clientName || "your client"} will see.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] overflow-hidden">
          {/* Editable fields */}
          <aside className="border-r p-5 space-y-4 overflow-y-auto bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">To</Label>
              <Input value={quote.client.email || "(no email on file)"} readOnly className="bg-background" />
            </div>
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
                rows={8}
                className="bg-background resize-none"
                placeholder="Add a personal note to the client…"
              />
              <p className="text-xs text-muted-foreground">
                This appears at the top of the email body.
              </p>
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

        <DialogFooter className="px-6 py-4 border-t flex-row sm:justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground hidden sm:block">
            <RefreshCw className="w-3 h-3 inline mr-1" /> Preview updates as you type.
          </p>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || !quote.client.email}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send to Client
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Generate the same quote PDF as the download flow but return a Blob URL for inline preview. */
async function generateQuotePdfBlobUrl(quote: Quote): Promise<string> {
  // Re-implement by intercepting jsPDF.save through a temporary override.
  // generateQuotePdf calls doc.save(filename) at the end. We monkey-patch save
  // to capture the doc instance and produce a blob instead of triggering a
  // download. This avoids duplicating ~150 lines of PDF layout code.
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
