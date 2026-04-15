import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { useMaterials } from "@/hooks/useMaterials";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Minus, ChevronUp, ChevronDown } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import type { Quote, QuoteLineItem, Client } from "@/types/quote";
import { toast } from "sonner";

export default function QuoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { quotes, addQuote, updateQuote } = useQuotes();
  const { materials } = useMaterials();
  const { settings } = useSettings();

  const existingQuote = id ? quotes.find((q) => q.id === id) : undefined;
  const isEditing = !!existingQuote;

  // Support pre-filling from quote request navigation state
  const prefill = (location.state as { prefillClient?: Partial<Client>; prefillNotes?: string } | null);

  const [client, setClient] = useState<Client>(
    existingQuote?.client ?? {
      id: "",
      name: prefill?.prefillClient?.name ?? "",
      email: prefill?.prefillClient?.email ?? "",
      phone: prefill?.prefillClient?.phone ?? "",
      address: prefill?.prefillClient?.address ?? "",
    }
  );
  const [items, setItems] = useState<QuoteLineItem[]>(existingQuote?.items ?? []);
  const [notes, setNotes] = useState(existingQuote?.notes ?? prefill?.prefillNotes ?? "");
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>(existingQuote?.discountType ?? "none");
  const [discountValue, setDiscountValue] = useState(existingQuote?.discountValue ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingQuote) {
      setClient(existingQuote.client);
      setItems(existingQuote.items);
      setNotes(existingQuote.notes ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingQuote?.id]);

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingScrollId = useRef<string | null>(null);

  const scrollToItem = useCallback((itemId: string) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        itemRefs.current[itemId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    });
  }, []);

  const addLineItem = (type: "material" | "labor" | "misc") => {
    const markupPercent = type === "material" ? settings.defaultMarkupPercent : 0;
    const newId = `li-${Date.now()}`;
    pendingScrollId.current = newId;
    setItems((prev) => [
      ...prev,
      { id: newId, type, description: "", quantity: 1, unitCost: 0, markupPercent, total: 0 },
    ]);
  };

  // Scroll to newly added items
  useEffect(() => {
    if (pendingScrollId.current) {
      scrollToItem(pendingScrollId.current);
      pendingScrollId.current = null;
    }
  }, [items.length, scrollToItem]);

  const updateItem = (itemId: string, updates: Partial<QuoteLineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, ...updates };
        if (updated.type === "labor") updated.markupPercent = 0;
        const costWithMarkup = updated.unitCost * (1 + updated.markupPercent / 100);
        updated.total = updated.quantity * costWithMarkup;
        return updated;
      })
    );
  };

  const removeItem = (itemId: string) => setItems((prev) => prev.filter((i) => i.id !== itemId));

  const moveItem = (index: number, direction: "up" | "down") => {
    setItems((prev) => {
      const newItems = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newItems.length) return prev;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      return newItems;
    });
  };

  const selectMaterial = (itemId: string, materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return;
    updateItem(itemId, { materialId, description: mat.name, unitCost: mat.wholesalePrice, markupPercent: settings.defaultMarkupPercent });
    // After selecting material, scroll to its quantity/cost fields
    scrollToItem(itemId);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const preTotalBeforeDiscount = items.reduce((s, i) => s + i.total, 0);
  const discountAmount = discountType === "percentage"
    ? preTotalBeforeDiscount * (discountValue / 100)
    : discountType === "fixed"
    ? discountValue
    : 0;
  const grandTotal = Math.max(0, preTotalBeforeDiscount - discountAmount);
  const markupTotal = preTotalBeforeDiscount - subtotal;

  const handleSave = async () => {
    if (!client.name || saving) return;
    setSaving(true);
    try {
      if (isEditing) {
        updateQuote(existingQuote.id, { client, items, subtotal, markupTotal, grandTotal, discountType, discountValue, notes: notes || undefined });
        toast.success("Quote updated");
        navigate(`/admin/quotes/${existingQuote.id}`);
      } else {
        const newId = await addQuote({ client, items, subtotal, markupTotal, grandTotal, discountType, discountValue, notes: notes || undefined });
        toast.success("Quote created");
        navigate(`/admin/quotes/${newId}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save quote");
    } finally {
      setSaving(false);
    }
  };

  if (id && !existingQuote) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Quote not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin")}>Back to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl">{isEditing ? "Edit Quote" : "New Quote"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? `Editing quote for ${existingQuote.client.name}` : "Build a garden styling quote for your client"}
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label>Full Name</Label><Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Jane Smith" /></div>
            <div><Label>Email</Label><Input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="jane@example.com" /></div>
            <div><Label>Phone</Label><Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} placeholder="0412 345 678" /></div>
            <div><Label>Property Address</Label><Input value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} placeholder="123 Garden Lane, Melbourne" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Line Items</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => addLineItem("material")}><Plus className="w-4 h-4 mr-1" /> Material</Button>
                <Button variant="outline" size="sm" onClick={() => addLineItem("labor")}><Plus className="w-4 h-4 mr-1" /> Labour</Button>
                <Button variant="outline" size="sm" onClick={() => addLineItem("misc")}><Plus className="w-4 h-4 mr-1" /> Misc</Button>
                <Button variant="outline" size="sm" onClick={() => { const newId = `li-${Date.now()}`; pendingScrollId.current = newId; setItems((prev) => [...prev, { id: newId, type: "misc" as const, description: "Green waste removal", quantity: 1, unitCost: 0, markupPercent: 0, total: 0 }]); }}><Plus className="w-4 h-4 mr-1" /> Green Waste</Button>
                <Button variant="outline" size="sm" onClick={() => { const newId = `li-${Date.now()}`; pendingScrollId.current = newId; setItems((prev) => [...prev, { id: newId, type: "misc" as const, description: "Delivery", quantity: 1, unitCost: 0, markupPercent: 0, total: 0 }]); }}><Plus className="w-4 h-4 mr-1" /> Delivery</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && <p className="text-center text-muted-foreground py-8">Add materials or labour to build the quote</p>}
            {items.map((item, index) => (
              <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }} className="grid gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => moveItem(index, "up")}><ChevronUp className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === items.length - 1} onClick={() => moveItem(index, "down")}><ChevronDown className="w-4 h-4" /></Button>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">{item.type}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>

                {/* Description / Material selector — always full width */}
                {item.type === "material" ? (
                  <div>
                    <Label>Material</Label>
                    <Select value={item.materialId} onValueChange={(v) => selectMaterial(item.id, v)}>
                      <SelectTrigger><SelectValue placeholder="Choose material" /></SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name} – ${m.wholesalePrice.toFixed(2)}/{m.unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label>Description</Label>
                    <Input value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} placeholder={item.type === "labor" ? "e.g. Garden bed prep & planting" : "e.g. Skip bin hire, delivery fee"} />
                  </div>
                )}

                {/* Qty + Cost side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Qty</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => updateItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateItem(item.id, { quantity: val === "" ? 0 : Number(val) });
                        }}
                        className="text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>{item.type === "labor" ? "Rate ($/hr)" : "Unit Cost ($)"}</Label>
                    <Input type="number" step="0.01" value={item.unitCost === 0 ? "" : item.unitCost} onChange={(e) => { const val = e.target.value; updateItem(item.id, { unitCost: val === "" ? 0 : Number(val) }); }} />
                  </div>
                </div>

                <div className="text-right font-semibold text-primary">
                  Line Total: ${item.total.toFixed(2)}
                  {item.type === "material" && item.markupPercent > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">(incl. {item.markupPercent}% markup)</span>
                  )}
                </div>
              </div>
            ))}
            {items.length > 0 && (
              <>
                <Separator />
                {/* Discount */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="w-40">
                    <Label>Discount</Label>
                    <Select value={discountType} onValueChange={(v) => { setDiscountType(v as any); if (v === "none") setDiscountValue(0); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Discount</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {discountType !== "none" && (
                    <div className="w-32">
                      <Label>{discountType === "percentage" ? "Discount %" : "Discount $"}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={discountType === "percentage" ? 100 : undefined}
                        step={discountType === "percentage" ? 1 : 0.01}
                        value={discountValue === 0 ? "" : discountValue}
                        onChange={(e) => setDiscountValue(e.target.value === "" ? 0 : Number(e.target.value))}
                      />
                    </div>
                  )}
                  {discountType !== "none" && discountAmount > 0 && (
                    <span className="text-sm text-destructive font-medium">−${discountAmount.toFixed(2)}</span>
                  )}
                </div>
                <Separator />
                <div className="space-y-2 text-right">
                  <p className="text-muted-foreground">Cost (wholesale): <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span></p>
                  <p className="text-muted-foreground">Markup: <span className="font-medium text-accent">${markupTotal.toFixed(2)}</span></p>
                  {discountAmount > 0 && (
                    <p className="text-muted-foreground">Discount: <span className="font-medium text-destructive">−${discountAmount.toFixed(2)}</span></p>
                  )}
                  <p className="text-xl font-bold text-foreground">Total: ${grandTotal.toFixed(2)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes for the client…" rows={3} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(isEditing ? `/admin/quotes/${id}` : "/admin")}>Cancel</Button>
          <Button onClick={handleSave} disabled={!client.name || items.length === 0 || saving}>
            <Save className="w-4 h-4 mr-2" /> {isEditing ? "Update Quote" : "Save Quote"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
