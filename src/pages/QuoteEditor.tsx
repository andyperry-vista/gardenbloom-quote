import { useState, useEffect } from "react";
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
import { Plus, Trash2, Save } from "lucide-react";
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingQuote) {
      setClient(existingQuote.client);
      setItems(existingQuote.items);
      setNotes(existingQuote.notes ?? "");
    }
  }, [existingQuote?.id]);

  const addLineItem = (type: "material" | "labor" | "misc") => {
    const markupPercent = type === "material" ? settings.defaultMarkupPercent : 0;
    setItems((prev) => [
      ...prev,
      { id: `li-${Date.now()}`, type, description: "", quantity: 1, unitCost: 0, markupPercent, total: 0 },
    ]);
  };

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

  const selectMaterial = (itemId: string, materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return;
    updateItem(itemId, { materialId, description: mat.name, unitCost: mat.wholesalePrice, markupPercent: settings.defaultMarkupPercent });
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const grandTotal = items.reduce((s, i) => s + i.total, 0);
  const markupTotal = grandTotal - subtotal;

  const handleSave = async () => {
    if (!client.name || saving) return;
    setSaving(true);
    try {
      if (isEditing) {
        updateQuote(existingQuote.id, { client, items, subtotal, markupTotal, grandTotal, notes: notes || undefined });
        toast.success("Quote updated");
        navigate(`/admin/quotes/${existingQuote.id}`);
      } else {
        const newId = await addQuote({ client, items, subtotal, markupTotal, grandTotal, notes: notes || undefined });
        toast.success("Quote created");
        navigate(`/admin/quotes/${newId}`);
      }
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
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addLineItem("material")}><Plus className="w-4 h-4 mr-1" /> Material</Button>
                <Button variant="outline" size="sm" onClick={() => addLineItem("labor")}><Plus className="w-4 h-4 mr-1" /> Labour</Button>
                <Button variant="outline" size="sm" onClick={() => addLineItem("misc")}><Plus className="w-4 h-4 mr-1" /> Misc</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && <p className="text-center text-muted-foreground py-8">Add materials or labour to build the quote</p>}
            {items.map((item) => (
              <div key={item.id} className="grid gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.type}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {item.type === "material" ? (
                    <div className="sm:col-span-2">
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
                    <div className="sm:col-span-2">
                      <Label>Description</Label>
                      <Input value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} placeholder={item.type === "labor" ? "e.g. Garden bed prep & planting" : "e.g. Skip bin hire, delivery fee"} />
                    </div>
                  )}
                  <div><Label>Qty</Label><Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} /></div>
                  <div><Label>{item.type === "labor" ? "Rate ($)" : "Unit Cost ($)"}</Label><Input type="number" step="0.01" value={item.unitCost} onChange={(e) => updateItem(item.id, { unitCost: Number(e.target.value) })} /></div>
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
                <div className="space-y-2 text-right">
                  <p className="text-muted-foreground">Cost (wholesale): <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span></p>
                  <p className="text-muted-foreground">Markup: <span className="font-medium text-accent">${markupTotal.toFixed(2)}</span></p>
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
