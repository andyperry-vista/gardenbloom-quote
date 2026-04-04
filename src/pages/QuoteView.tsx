import { useParams, Link, useNavigate } from "react-router-dom";
import type { Quote } from "@/types/quote";
import { useQuotes } from "@/hooks/useQuotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import mayuraLogo from "@/assets/mayura-logo.jpeg";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
};

export default function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotes, updateQuote, deleteQuote } = useQuotes();
  const quote = quotes.find((q) => q.id === id);

  if (!quote) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Quote not found</p>
          <Link to="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleSendEmail = () => {
    if (!quote.client.email) {
      toast.error("No client email address on this quote");
      return;
    }
    toast.info(
      "Email sending requires Lovable Cloud. Enable it to send quotes directly!"
    );
    updateQuote(quote.id, { status: "sent" });
    toast.success("Quote marked as sent");
  };

  const handleDelete = () => {
    deleteQuote(quote.id);
    navigate("/");
    toast.success("Quote deleted");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Select
              value={quote.status}
              onValueChange={(v) =>
                updateQuote(quote.id, { status: v as Quote["status"] })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quote Document */}
        <Card className="overflow-hidden">
          <div className="bg-primary p-8 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={mayuraLogo} alt="Mayura Garden Service" className="h-12 w-auto rounded" />
                <div>
                  <h2 className="font-display text-3xl text-primary-foreground">Mayura</h2>
                  <p className="text-xs text-primary-foreground/70 tracking-widest uppercase">Garden Service — Quote</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Quote #{quote.id.slice(-6)}</p>
                <p className="text-sm opacity-80">
                  {new Date(quote.createdAt).toLocaleDateString("en-NZ")}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-8 space-y-6">
            {/* Client Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Prepared For
              </h3>
              <p className="font-semibold text-lg">{quote.client.name}</p>
              <p className="text-muted-foreground">{quote.client.address}</p>
              <p className="text-muted-foreground">{quote.client.email}</p>
              {quote.client.phone && (
                <p className="text-muted-foreground">{quote.client.phone}</p>
              )}
            </div>

            <Separator />

            {/* Items Table */}
            <div>
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-3 text-right">Total</div>
              </div>
              {quote.items.map((item) => {
                const clientPrice =
                  item.unitCost * (1 + item.markupPercent / 100);
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 py-3 border-b last:border-0 text-sm"
                  >
                    <div className="col-span-5">
                      <span className="font-medium">{item.description}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">
                        ({item.type})
                      </span>
                    </div>
                    <div className="col-span-2 text-right">{item.quantity}</div>
                    <div className="col-span-2 text-right">
                      ${clientPrice.toFixed(2)}
                    </div>
                    <div className="col-span-3 text-right font-medium">
                      ${item.total.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${quote.grandTotal.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total (incl. GST)</span>
                  <span>${quote.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {quote.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Notes
                  </h3>
                  <p className="text-sm">{quote.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Internal breakdown (not shown to client) */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Your Margin Breakdown (internal)
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">${quote.subtotal.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Wholesale Cost</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">
                  ${quote.markupTotal.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Your Markup</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  ${quote.grandTotal.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Client Price</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSendEmail}>
            <Send className="w-4 h-4 mr-2" />
            Send to Client
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
