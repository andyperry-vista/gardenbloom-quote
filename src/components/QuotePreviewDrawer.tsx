import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import mayuraLogo from "@/assets/mayura-logo.png";
import type { Quote, QuoteLineItem, Client } from "@/types/quote";
import { generateQuotePdf } from "@/lib/generateQuotePdf";

interface QuotePreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  items: QuoteLineItem[];
  notes?: string;
  subtotal: number;
  markupTotal: number;
  grandTotal: number;
  discountType: "none" | "percentage" | "fixed";
  discountValue: number;
  quoteId?: string;
  createdAt?: string;
}

export default function QuotePreviewDrawer({
  open,
  onOpenChange,
  client,
  items,
  notes,
  subtotal,
  markupTotal,
  grandTotal,
  discountType,
  discountValue,
  quoteId,
  createdAt,
}: QuotePreviewDrawerProps) {
  const displayDate = createdAt ? new Date(createdAt) : new Date();
  const displayId = quoteId ? quoteId.slice(-6) : "DRAFT";

  const preTotalBeforeDiscount = items.reduce((s, i) => s + i.total, 0);
  const discountAmount =
    discountType === "percentage"
      ? preTotalBeforeDiscount * (discountValue / 100)
      : discountType === "fixed"
      ? discountValue
      : 0;

  const handleDownload = () => {
    const draftQuote: Quote = {
      id: quoteId ?? "draft",
      createdAt: createdAt ?? new Date().toISOString(),
      status: "draft",
      client,
      items,
      subtotal,
      markupTotal,
      grandTotal,
      discountType,
      discountValue,
      notes: notes || undefined,
    };
    generateQuotePdf(draftQuote);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-2xl">Quote Preview</DrawerTitle>
          <DrawerDescription>
            This is how your client will see the quotation.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 sm:px-6 pb-4">
          <div className="max-w-2xl mx-auto rounded-lg border overflow-hidden bg-card">
            {/* Branded header */}
            <div className="bg-primary p-5 sm:p-6 text-primary-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={mayuraLogo} alt="Mayura Garden Service" className="h-10 sm:h-12 w-auto rounded" />
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl text-primary-foreground leading-tight">Mayura</h2>
                    <p className="text-[10px] sm:text-xs text-primary-foreground/70 tracking-widest uppercase">
                      Garden Service — Quote
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs sm:text-sm opacity-80">
                  <p>Quote #{displayId}</p>
                  <p>{displayDate.toLocaleDateString("en-AU")}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  Prepared For
                </h3>
                <p className="font-semibold">{client.name || "—"}</p>
                {client.address && <p className="text-sm text-muted-foreground">{client.address}</p>}
                {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
                {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
              </div>

              <Separator />

              {/* Items: table on sm+, stacked on mobile */}
              <div>
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No line items yet.</p>
                ) : (
                  items.map((item) => {
                    const clientPrice = item.unitCost * (1 + item.markupPercent / 100);
                    return (
                      <div
                        key={item.id}
                        className="sm:grid sm:grid-cols-12 sm:gap-2 py-3 border-b last:border-0 text-sm flex flex-col gap-1"
                      >
                        <div className="sm:col-span-6">
                          <span className="font-medium">{item.description || "Untitled item"}</span>
                          <span className="ml-2 text-xs text-muted-foreground capitalize">({item.type})</span>
                        </div>
                        <div className="sm:col-span-2 sm:text-right flex justify-between sm:block">
                          <span className="sm:hidden text-xs text-muted-foreground">Qty</span>
                          <span>{item.quantity}</span>
                        </div>
                        <div className="sm:col-span-2 sm:text-right flex justify-between sm:block">
                          <span className="sm:hidden text-xs text-muted-foreground">Unit</span>
                          <span>${clientPrice.toFixed(2)}</span>
                        </div>
                        <div className="sm:col-span-2 sm:text-right flex justify-between sm:block font-medium">
                          <span className="sm:hidden text-xs text-muted-foreground">Total</span>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${preTotalBeforeDiscount.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>
                        Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}
                      </span>
                      <span>−${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total (incl. GST)</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Notes</h3>
                    <p className="text-sm whitespace-pre-wrap">{notes}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2 border-t pt-3">
          <Button
            variant="outline"
            className="flex-1 min-h-11"
            onClick={handleDownload}
            disabled={items.length === 0}
          >
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <DrawerClose asChild>
            <Button className="flex-1 min-h-11">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
