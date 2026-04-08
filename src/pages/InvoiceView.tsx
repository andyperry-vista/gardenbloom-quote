import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useInvoices, usePayments } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, DollarSign, Download } from "lucide-react";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  unpaid: "bg-warning/10 text-warning",
  sent: "bg-primary/10 text-primary",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
};

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, updateInvoice } = useInvoices();
  const { payments, addPayment } = usePayments(id);
  const invoice = invoices.find((i) => i.id === id);

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);

  if (!invoice) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Invoice not found</p>
          <Link to="/admin/invoices"><Button variant="outline">Back to Invoices</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = invoice.totalWithGst - totalPaid;

  const handleRecordPayment = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    try {
      await addPayment({
        invoiceId: invoice.id,
        amount,
        paymentMethod: payMethod,
        paymentDate: format(new Date(), "yyyy-MM-dd"),
      });
      if (amount >= remaining) {
        updateInvoice(invoice.id, { status: "paid", paidDate: format(new Date(), "yyyy-MM-dd") });
      }
      toast.success("Payment recorded");
      setShowPayForm(false);
      setPayAmount("");
      setPayMethod("");
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice.client?.email) {
      toast.error("No client email");
      return;
    }
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "unpaid-invoice",
          recipientEmail: invoice.client.email,
          idempotencyKey: `invoice-${invoice.id}`,
          templateData: {
            clientName: invoice.client.name,
            invoiceNumber: invoice.invoiceNumber,
            amount: `$${invoice.totalWithGst.toFixed(2)}`,
            dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-AU") : "Upon receipt",
          },
        },
      });
      updateInvoice(invoice.id, { status: "sent", sentAt: new Date().toISOString() });
      toast.success("Invoice sent");
    } catch {
      toast.error("Failed to send invoice");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/admin/invoices" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <Select value={invoice.status} onValueChange={(v) => updateInvoice(invoice.id, { status: v })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{invoice.invoiceNumber}</CardTitle>
              <Badge className={statusColors[invoice.status]} variant="secondary">{invoice.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">Client</Label>
                <p className="font-medium">{invoice.client?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{invoice.client?.address}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Job</Label>
                <p className="font-medium">{invoice.job?.job_number ?? "—"}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-3 text-center">
              <div>
                <p className="text-2xl font-bold">${invoice.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Subtotal (ex GST)</p>
              </div>
              <div>
                <p className="text-2xl font-bold">${invoice.gstAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">GST (10%)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">${invoice.totalWithGst.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total (incl. GST)</p>
              </div>
            </div>
            {invoice.dueDate && (
              <p className="text-sm text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString("en-AU")}</p>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payments</CardTitle>
              {invoice.status !== "paid" && (
                <Button size="sm" onClick={() => setShowPayForm(!showPayForm)}>
                  <DollarSign className="w-4 h-4 mr-1" /> Record Payment
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showPayForm && (
              <div className="grid gap-3 sm:grid-cols-3 p-4 border rounded-lg">
                <div>
                  <Label>Amount ($)</Label>
                  <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={remaining.toFixed(2)} />
                </div>
                <div>
                  <Label>Method</Label>
                  <Input value={payMethod} onChange={(e) => setPayMethod(e.target.value)} placeholder="Bank transfer" />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleRecordPayment} disabled={!payAmount}>Save</Button>
                </div>
              </div>
            )}

            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between p-3 border rounded-lg text-sm">
                    <div>
                      <span className="font-medium">${p.amount.toFixed(2)}</span>
                      <span className="text-muted-foreground ml-2">{p.paymentMethod}</span>
                    </div>
                    <span className="text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString("en-AU")}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2 border-t text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-bold">${remaining.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button onClick={handleSendInvoice}>
            <Send className="w-4 h-4 mr-2" /> Send Invoice
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
