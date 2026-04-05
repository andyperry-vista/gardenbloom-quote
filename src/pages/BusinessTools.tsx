import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Calculator, FileText, Mail } from "lucide-react";
import { toast } from "sonner";

/* ─── Email Sender Helper ─── */
function useEmailSender() {
  const [sending, setSending] = useState(false);
  const send = async (templateName: string, recipientEmail: string, templateData: Record<string, string>) => {
    if (!recipientEmail.trim()) { toast.error("Recipient email is required"); return false; }
    setSending(true);
    try {
      const id = crypto.randomUUID();
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: { templateName, recipientEmail, idempotencyKey: `${templateName}-${id}`, templateData },
      });
      if (error) throw error;
      toast.success("Email sent!");
      return true;
    } catch { toast.error("Failed to send email"); return false; }
    finally { setSending(false); }
  };
  return { send, sending };
}

/* ─── Payment Remittance Tab ─── */
function PaymentRemittanceForm() {
  const { send, sending } = useEmailSender();
  const [f, setF] = useState({ recipientEmail: "", recipientName: "", invoiceNumber: "", amount: "", paymentDate: new Date().toLocaleDateString("en-AU"), paymentMethod: "Bank Transfer", notes: "" });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await send("payment-remittance", f.recipientEmail, f)) setF({ ...f, recipientEmail: "", recipientName: "", invoiceNumber: "", amount: "", notes: "" });
  };
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" />Payment Remittance</CardTitle><CardDescription>Send a payment advice to a supplier confirming your payment</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Supplier Email *</Label><Input type="email" value={f.recipientEmail} onChange={e => setF({...f, recipientEmail: e.target.value})} placeholder="accounts@supplier.com" required /></div>
            <div><Label>Supplier Name</Label><Input value={f.recipientName} onChange={e => setF({...f, recipientName: e.target.value})} placeholder="Bunnings Trade" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Invoice Number</Label><Input value={f.invoiceNumber} onChange={e => setF({...f, invoiceNumber: e.target.value})} placeholder="INV-2026-042" /></div>
            <div><Label>Amount Paid *</Label><Input value={f.amount} onChange={e => setF({...f, amount: e.target.value})} placeholder="$385.00" required /></div>
            <div><Label>Payment Date</Label><Input value={f.paymentDate} onChange={e => setF({...f, paymentDate: e.target.value})} /></div>
          </div>
          <div><Label>Payment Method</Label>
            <Select value={f.paymentMethod} onValueChange={v => setF({...f, paymentMethod: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Card">Card</SelectItem><SelectItem value="PayPal">PayPal</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={f.notes} onChange={e => setF({...f, notes: e.target.value})} placeholder="Additional notes..." rows={2} /></div>
          <Button type="submit" disabled={sending} className="w-full">{sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}{sending ? "Sending…" : "Send Remittance"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Unpaid Invoice Tab ─── */
function UnpaidInvoiceForm() {
  const { send, sending } = useEmailSender();
  const [f, setF] = useState({ recipientEmail: "", clientName: "", invoiceNumber: "", amount: "", dueDate: "", daysPastDue: "", notes: "" });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await send("unpaid-invoice", f.recipientEmail, f)) setF({ recipientEmail: "", clientName: "", invoiceNumber: "", amount: "", dueDate: "", daysPastDue: "", notes: "" });
  };
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Invoice Follow-Up</CardTitle><CardDescription>Send a friendly payment reminder for an overdue invoice</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Client Email *</Label><Input type="email" value={f.recipientEmail} onChange={e => setF({...f, recipientEmail: e.target.value})} placeholder="client@example.com" required /></div>
            <div><Label>Client Name</Label><Input value={f.clientName} onChange={e => setF({...f, clientName: e.target.value})} placeholder="Sarah Johnson" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label>Invoice Number</Label><Input value={f.invoiceNumber} onChange={e => setF({...f, invoiceNumber: e.target.value})} placeholder="MGS-2026-015" /></div>
            <div><Label>Amount Due *</Label><Input value={f.amount} onChange={e => setF({...f, amount: e.target.value})} placeholder="$1,250.00" required /></div>
            <div><Label>Due Date</Label><Input value={f.dueDate} onChange={e => setF({...f, dueDate: e.target.value})} placeholder="20 March 2026" /></div>
            <div><Label>Days Past Due</Label><Input value={f.daysPastDue} onChange={e => setF({...f, daysPastDue: e.target.value})} placeholder="16" /></div>
          </div>
          <div><Label>Additional Notes</Label><Textarea value={f.notes} onChange={e => setF({...f, notes: e.target.value})} placeholder="Any extra context..." rows={2} /></div>
          <Button type="submit" disabled={sending} className="w-full">{sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}{sending ? "Sending…" : "Send Reminder"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Quote Follow-Up Tab ─── */
function QuoteFollowupForm() {
  const { send, sending } = useEmailSender();
  const [f, setF] = useState({ recipientEmail: "", clientName: "", quoteNumber: "", quoteDate: "", propertyAddress: "", notes: "" });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await send("quote-followup", f.recipientEmail, f)) setF({ recipientEmail: "", clientName: "", quoteNumber: "", quoteDate: "", propertyAddress: "", notes: "" });
  };
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Quote Follow-Up</CardTitle><CardDescription>Follow up with a client who hasn't responded to a quote</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Client Email *</Label><Input type="email" value={f.recipientEmail} onChange={e => setF({...f, recipientEmail: e.target.value})} placeholder="client@example.com" required /></div>
            <div><Label>Client Name</Label><Input value={f.clientName} onChange={e => setF({...f, clientName: e.target.value})} placeholder="David Chen" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Quote Number</Label><Input value={f.quoteNumber} onChange={e => setF({...f, quoteNumber: e.target.value})} placeholder="Q-042" /></div>
            <div><Label>Quote Date</Label><Input value={f.quoteDate} onChange={e => setF({...f, quoteDate: e.target.value})} placeholder="28 March 2026" /></div>
            <div><Label>Property Address</Label><Input value={f.propertyAddress} onChange={e => setF({...f, propertyAddress: e.target.value})} placeholder="15 Rose St, Kew" /></div>
          </div>
          <div><Label>Additional Notes</Label><Textarea value={f.notes} onChange={e => setF({...f, notes: e.target.value})} placeholder="Anything specific to mention..." rows={2} /></div>
          <Button type="submit" disabled={sending} className="w-full">{sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}{sending ? "Sending…" : "Send Follow-Up"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Job Completion Tab ─── */
function JobCompletionForm() {
  const { send, sending } = useEmailSender();
  const [f, setF] = useState({ recipientEmail: "", clientName: "", propertyAddress: "", workCompleted: "", invoiceAmount: "", notes: "" });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await send("job-completion", f.recipientEmail, f)) setF({ recipientEmail: "", clientName: "", propertyAddress: "", workCompleted: "", invoiceAmount: "", notes: "" });
  };
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" />Job Completion</CardTitle><CardDescription>Notify the client that their garden work is finished</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Client Email *</Label><Input type="email" value={f.recipientEmail} onChange={e => setF({...f, recipientEmail: e.target.value})} placeholder="client@example.com" required /></div>
            <div><Label>Client Name</Label><Input value={f.clientName} onChange={e => setF({...f, clientName: e.target.value})} placeholder="Lisa Wang" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Property Address</Label><Input value={f.propertyAddress} onChange={e => setF({...f, propertyAddress: e.target.value})} placeholder="8 Elm Ave, Richmond" /></div>
            <div><Label>Invoice Amount</Label><Input value={f.invoiceAmount} onChange={e => setF({...f, invoiceAmount: e.target.value})} placeholder="$980.00 (inc GST)" /></div>
          </div>
          <div><Label>Work Completed</Label><Textarea value={f.workCompleted} onChange={e => setF({...f, workCompleted: e.target.value})} placeholder="Full garden clean-up, hedge trimming, mulching..." rows={2} /></div>
          <div><Label>Additional Notes</Label><Textarea value={f.notes} onChange={e => setF({...f, notes: e.target.value})} placeholder="Any follow-up info..." rows={2} /></div>
          <Button type="submit" disabled={sending} className="w-full">{sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}{sending ? "Sending…" : "Send Completion Notice"}</Button>
        </form>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Tools</h1>
        <p className="text-muted-foreground">Email templates, GST calculator & BAS helper</p>
      </div>

      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emails" className="gap-2"><Mail className="w-4 h-4" />Email Templates</TabsTrigger>
          <TabsTrigger value="gst" className="gap-2"><Calculator className="w-4 h-4" />GST & BAS</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4">
          <Tabs defaultValue="remittance">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="remittance">Payment Remittance</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid Invoice</TabsTrigger>
              <TabsTrigger value="followup">Quote Follow-Up</TabsTrigger>
              <TabsTrigger value="completion">Job Completion</TabsTrigger>
            </TabsList>
            <TabsContent value="remittance"><PaymentRemittanceForm /></TabsContent>
            <TabsContent value="unpaid"><UnpaidInvoiceForm /></TabsContent>
            <TabsContent value="followup"><QuoteFollowupForm /></TabsContent>
            <TabsContent value="completion"><JobCompletionForm /></TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="gst" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <GSTCalculator />
            <BASSummary />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
