import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Calculator, FileText, Mail } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { useQuotes } from "@/hooks/useQuotes";
import { useInvoices } from "@/hooks/useInvoices";

/* ─── Email Scenarios ─── */
const QUOTE_SCENARIOS = ["quote-request", "quote-followup", "booking-confirmation"];
const INVOICE_SCENARIOS = ["unpaid-invoice", "tax-invoice", "payment-remittance"];

const EMAIL_SCENARIOS = [
  { value: "quote-request", label: "Send Quote", description: "Send a quote to the client" },
  { value: "booking-confirmation", label: "Booking Confirmation", description: "Confirm a scheduled job with the client" },
  { value: "unpaid-invoice", label: "Payment Request", description: "Request payment for an invoice" },
  { value: "quote-followup", label: "Payment Follow-Up", description: "Follow up on an unanswered quote" },
  { value: "job-completion", label: "Job Completion", description: "Notify client that work is finished" },
  { value: "rate-review", label: "Rate & Review", description: "Ask client for a review after completion" },
  { value: "tax-invoice", label: "Tax Invoice", description: "Send a tax invoice to the client" },
  { value: "payment-remittance", label: "Payment Remittance", description: "Send payment advice to a supplier" },
] as const;

/* ─── Unified Email Composer ─── */
function EmailComposer() {
  const { clients } = useClients();
  const { quotes } = useQuotes();
  const { invoices } = useInvoices();
  const [sending, setSending] = useState(false);
  const [scenario, setScenario] = useState("");
  const [clientId, setClientId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [notes, setNotes] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedScenario = EMAIL_SCENARIOS.find((s) => s.value === scenario);

  const showQuotePicker = QUOTE_SCENARIOS.includes(scenario);
  const showInvoicePicker = INVOICE_SCENARIOS.includes(scenario);

  // Filter quotes/invoices by selected client
  const clientQuotes = useMemo(() =>
    clientId ? quotes.filter((q) => q.client.id === clientId) : quotes,
    [quotes, clientId]
  );
  const clientInvoices = useMemo(() =>
    clientId ? invoices.filter((inv) => inv.clientId === clientId) : invoices,
    [invoices, clientId]
  );

  const selectedQuote = quotes.find((q) => q.id === quoteId);
  const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);

  // Reset linked doc when scenario changes
  const handleScenarioChange = (v: string) => {
    setScenario(v);
    setQuoteId("");
    setInvoiceId("");
  };

  const getEmailPreview = () => {
    if (!scenario || !selectedClient) return null;
    let subject = "Message from Mayura Gardening";
    const firstName = selectedClient.name.split(' ')[0] || "there";
    let body = `Hi ${firstName},\n\n`;

    const qNum = selectedQuote ? selectedQuote.id.slice(-6) : "[Quote ID]";
    const qAmt = selectedQuote ? `$${selectedQuote.grandTotal.toFixed(2)}` : "[$0.00]";
    const iNum = selectedInvoice ? selectedInvoice.invoiceNumber : "[Invoice #]";
    const iAmt = selectedInvoice ? `$${selectedInvoice.totalWithGst.toFixed(2)}` : "[$0.00]";
    const iDue = selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString("en-AU") : "[Due Date]";

    switch (scenario) {
      case "quote-request":
        subject = `Your Quote from Mayura Gardening`;
        body += `Thank you for the opportunity to provide an estimate. Please find Quote #${qNum} for ${qAmt} attached.\n\n`;
        break;
      case "booking-confirmation":
        subject = "Booking Confirmation - Mayura Gardening";
        body += `Your job has been successfully scheduled. We look forward to seeing you soon.\n\n`;
        break;
      case "unpaid-invoice":
        subject = `Payment Reminder: Invoice ${iNum}`;
        body += `This is a friendly reminder that Invoice ${iNum} for ${iAmt} is due on ${iDue}. Please let us know if you have any questions or need a copy of the invoice.\n\n`;
        break;
      case "quote-followup":
        subject = `Following up on Quote #${qNum}`;
        body += `We are following up on Quote #${qNum} for ${qAmt}. Please let us know if you'd like to proceed or if you need any adjustments to the scope.\n\n`;
        break;
      case "job-completion":
        subject = "Your Garden Job is Complete!";
        body += `We have completed the work at ${selectedClient.address || "your property"}. Let us know if everything is to your satisfaction.\n\n`;
        break;
      case "rate-review":
        subject = "How did we do? - Mayura Gardening";
        body += `Thank you for choosing Mayura Gardening. We’d love it if you could leave us a quick review online to share your experience!\n\n`;
        break;
      case "tax-invoice":
        subject = `Tax Invoice ${iNum} from Mayura Gardening`;
        body += `Please find attached Tax Invoice ${iNum} for ${iAmt}.\n\n`;
        break;
      case "payment-remittance":
        subject = "Payment Remittance Advice";
        body += `Please be advised that payment has been processed for your most recent invoice.\n\n`;
        break;
    }

    if (notes) {
      body += `${notes}\n\n`;
    }

    body += "Best regards,\nThe Mayura Gardening Team";

    return { subject, body };
  };

  const preview = getEmailPreview();

  const handleSend = async () => {
    if (!scenario) { toast.error("Please select an email type"); return; }
    if (!selectedClient?.email) { toast.error("Please select a client with an email address"); return; }

    setSending(true);
    try {
      const id = crypto.randomUUID();
      const templateData: Record<string, string> = {
        clientName: selectedClient.name,
      };
      if (selectedClient.address) templateData.propertyAddress = selectedClient.address;
      if (notes) templateData.notes = notes;

      // Auto-populate reference numbers from linked documents
      if (selectedQuote) {
        templateData.quoteNumber = selectedQuote.id.slice(-6);
        templateData.amount = `$${selectedQuote.grandTotal.toFixed(2)}`;
      }
      if (selectedInvoice) {
        templateData.invoiceNumber = selectedInvoice.invoiceNumber;
        templateData.amount = `$${selectedInvoice.totalWithGst.toFixed(2)}`;
        if (selectedInvoice.dueDate) templateData.dueDate = new Date(selectedInvoice.dueDate).toLocaleDateString("en-AU");
      }

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: scenario,
          recipientEmail: selectedClient.email,
          idempotencyKey: `${scenario}-${id}`,
          templateData,
        },
      });
      if (error) throw error;
      toast.success(`${selectedScenario?.label || "Email"} sent to ${selectedClient.name}`);
      setNotes("");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Send Email</CardTitle>
        <CardDescription>Pick a scenario, choose a client, and send</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Step 1: Scenario */}
        <div>
          <Label>Email Type</Label>
          <Select value={scenario} onValueChange={handleScenarioChange}>
            <SelectTrigger><SelectValue placeholder="Select email type…" /></SelectTrigger>
            <SelectContent>
              {EMAIL_SCENARIOS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedScenario && (
            <p className="text-xs text-muted-foreground mt-1">{selectedScenario.description}</p>
          )}
        </div>

        {/* Step 2: Client */}
        <div>
          <Label>Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}{c.email ? ` — ${c.email}` : " (no email)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClient && (
            <div className="mt-2 bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{selectedClient.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedClient.email || "—"}</span></div>
              {selectedClient.address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span>{selectedClient.address}</span></div>}
            </div>
          )}
        </div>

        {/* Step 3: Link Quote or Invoice */}
        {showQuotePicker && (
          <div>
            <Label>Link Quote (optional)</Label>
            <Select value={quoteId} onValueChange={setQuoteId}>
              <SelectTrigger><SelectValue placeholder="Select a quote…" /></SelectTrigger>
              <SelectContent>
                {clientQuotes.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    Quote #{q.id.slice(-6)} — ${q.grandTotal.toFixed(2)} ({q.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedQuote && (
              <p className="text-xs text-muted-foreground mt-1">
                Ref #{selectedQuote.id.slice(-6)} • ${selectedQuote.grandTotal.toFixed(2)} will be auto-populated
              </p>
            )}
          </div>
        )}

        {showInvoicePicker && (
          <div>
            <Label>Link Invoice (optional)</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId}>
              <SelectTrigger><SelectValue placeholder="Select an invoice…" /></SelectTrigger>
              <SelectContent>
                {clientInvoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — ${inv.totalWithGst.toFixed(2)} ({inv.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedInvoice && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedInvoice.invoiceNumber} • ${selectedInvoice.totalWithGst.toFixed(2)} will be auto-populated
              </p>
            )}
          </div>
        )}

        {/* Step 4: Notes */}
        <div>
          <Label>Additional Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any extra details to include in the email…" rows={3} />
        </div>

        {/* Email Preview */}
        {preview && (
          <div className="bg-muted/30 border rounded-lg p-4 space-y-3 mt-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Email Preview</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm"><span className="text-muted-foreground font-medium w-16 inline-block">To:</span> {selectedClient.email || <span className="text-destructive italic">Missing Email</span>}</div>
              <div className="text-sm"><span className="text-muted-foreground font-medium w-16 inline-block">Subject:</span> <span className="font-medium">{preview.subject}</span></div>
            </div>
            <div className="whitespace-pre-wrap text-sm border-t pt-3 mt-2 bg-background/50 p-3 rounded font-serif italic text-foreground/80 leading-relaxed">
              {preview.body}
            </div>
          </div>
        )}

        {/* Step 5: Send */}
        <Button onClick={handleSend} disabled={sending || !scenario || !clientId} className="w-full">
          {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {sending ? "Sending…" : `Send ${selectedScenario?.label || "Email"}`}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── GST Calculator ─── */
function GSTCalculator() {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const GST_RATE = 0.10;
  const num = parseFloat(amount) || 0;
  const gstAmount = mode === "add" ? num * GST_RATE : num - (num / (1 + GST_RATE));
  const total = mode === "add" ? num + gstAmount : num;
  const exGst = mode === "add" ? num : num / (1 + GST_RATE);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" />GST Calculator</CardTitle><CardDescription>Australian GST at 10%</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant={mode === "add" ? "default" : "outline"} onClick={() => setMode("add")} className="flex-1">Add GST</Button>
          <Button variant={mode === "remove" ? "default" : "outline"} onClick={() => setMode("remove")} className="flex-1">Remove GST</Button>
        </div>
        <div>
          <Label>{mode === "add" ? "Amount (ex GST)" : "Amount (inc GST)"}</Label>
          <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="text-lg" />
        </div>
        {num > 0 && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Ex GST</span><span className="font-semibold">${exGst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST (10%)</span><span className="font-semibold">${gstAmount.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-semibold">Inc GST</span><span className="font-bold text-lg">${total.toFixed(2)}</span></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── BAS Summary ─── */
function BASSummary() {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const GST_RATE = 0.10;
  const incNum = parseFloat(income) || 0;
  const expNum = parseFloat(expenses) || 0;
  const gstCollected = incNum / (1 + GST_RATE) * GST_RATE;
  const gstPaid = expNum / (1 + GST_RATE) * GST_RATE;
  const gstOwed = gstCollected - gstPaid;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />BAS Summary</CardTitle><CardDescription>Quick GST calculation for your Business Activity Statement</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Total Income (inc GST)</Label><Input type="number" step="0.01" min="0" value={income} onChange={e => setIncome(e.target.value)} placeholder="0.00" /></div>
          <div><Label>Total Expenses (inc GST)</Label><Input type="number" step="0.01" min="0" value={expenses} onChange={e => setExpenses(e.target.value)} placeholder="0.00" /></div>
        </div>
        {(incNum > 0 || expNum > 0) && (
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">GST Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">G1 — Total sales (inc GST)</span><span>${incNum.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">1A — GST on sales</span><span>${gstCollected.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">G11 — Total purchases (inc GST)</span><span>${expNum.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">1B — GST on purchases</span><span>${gstPaid.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">{gstOwed >= 0 ? "GST Payable to ATO" : "GST Refund from ATO"}</span>
                <span className={`font-bold text-lg ${gstOwed >= 0 ? "text-destructive" : "text-primary"}`}>${Math.abs(gstOwed).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is a simplified estimate. Consult your accountant for your actual BAS lodgement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function BusinessTools() {
  return (
    <AppLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Tools</h1>
        <p className="text-muted-foreground">Email composer, GST calculator & BAS helper</p>
      </div>

      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emails" className="gap-2"><Mail className="w-4 h-4" />Email Composer</TabsTrigger>
          <TabsTrigger value="gst" className="gap-2"><Calculator className="w-4 h-4" />GST & BAS</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <EmailComposer />
        </TabsContent>

        <TabsContent value="gst" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <GSTCalculator />
            <BASSummary />
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </AppLayout>
  );
}
