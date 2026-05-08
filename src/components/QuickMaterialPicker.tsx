import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Globe, Plus, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMaterials } from "@/hooks/useMaterials";
import type { Material, QuoteLineItem } from "@/types/quote";

const SUPPLIERS = [
  { id: "bunnings", label: "Bunnings", location: "Doncaster, VIC" },
  { id: "colsmith", label: "Colsmith Wholesale Nursery", location: "Skye, VIC" },
  { id: "plantmulti", label: "Plant Multi Nursery", location: "Devon Meadows, VIC" },
] as const;
type SupplierId = (typeof SUPPLIERS)[number]["id"];

interface SupplierProduct {
  name: string;
  price: number | null;
  unit: string;
  inStock: boolean;
  category: string;
}

interface QuickMaterialPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMarkup: number;
  /** Called with one or more new line items to append to the quote. */
  onAdd: (items: QuoteLineItem[]) => void;
}

interface PendingItem extends SupplierProduct {
  key: string;
  quantity: number;
  markupPercent: number;
  supplierLabel: string;
  supplierLocation: string;
  saveToCatalog: boolean;
}

export default function QuickMaterialPicker({
  open,
  onOpenChange,
  defaultMarkup,
  onAdd,
}: QuickMaterialPickerProps) {
  const { toast } = useToast();
  const { materials, addMaterial } = useMaterials();

  const [supplierId, setSupplierId] = useState<SupplierId>("bunnings");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingItem[]>([]);

  const supplier = SUPPLIERS.find((s) => s.id === supplierId)!;

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("search-supplier", {
        body: { query: query.trim(), supplier: supplierId },
      });
      if (error) throw error;
      if (data?.success && data.products?.length > 0) {
        setResults(data.products);
      } else {
        toast({ title: "No results", description: `No products found at ${supplier.label}.` });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Search failed",
        description: `Could not search ${supplier.label}.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCatalogItem = (m: Material) => {
    setPending((prev) => [
      ...prev,
      {
        key: `pending-${Date.now()}-${Math.random()}`,
        name: m.name,
        price: m.wholesalePrice,
        unit: m.unit,
        inStock: m.inStock,
        category: m.category,
        quantity: 1,
        markupPercent: defaultMarkup,
        supplierLabel: m.supplier,
        supplierLocation: m.supplierLocation,
        saveToCatalog: false, // already in catalog
      },
    ]);
  };

  const addSupplierResult = (p: SupplierProduct) => {
    setPending((prev) => [
      ...prev,
      {
        key: `pending-${Date.now()}-${Math.random()}`,
        ...p,
        quantity: 1,
        markupPercent: defaultMarkup,
        supplierLabel: supplier.label,
        supplierLocation: supplier.location,
        saveToCatalog: true,
      },
    ]);
  };

  const updatePending = (key: string, patch: Partial<PendingItem>) => {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const removePending = (key: string) => {
    setPending((prev) => prev.filter((p) => p.key !== key));
  };

  const handleConfirm = () => {
    if (pending.length === 0) return;

    // Persist newly searched items to the local catalog (if flagged)
    pending.forEach((p) => {
      if (p.saveToCatalog && p.price != null) {
        const newMat: Material = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: p.name,
          category: p.category || "Garden Supplies",
          wholesalePrice: p.price,
          unit: p.unit,
          supplier: p.supplierLabel,
          supplierLocation: p.supplierLocation,
          inStock: p.inStock,
        };
        addMaterial(newMat);
      }
    });

    // Build line items
    const newLines: QuoteLineItem[] = pending.map((p) => {
      const unitCost = p.price ?? 0;
      const total = p.quantity * unitCost * (1 + p.markupPercent / 100);
      return {
        id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "material",
        description: p.name,
        quantity: p.quantity,
        unitCost,
        markupPercent: p.markupPercent,
        total,
      };
    });

    onAdd(newLines);
    toast({ title: `Added ${newLines.length} item${newLines.length === 1 ? "" : "s"}` });
    setPending([]);
    setResults([]);
    setQuery("");
    onOpenChange(false);
  };

  // Filter catalog by query for quick lookup
  const catalogMatches = query.trim().length >= 2
    ? materials.filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Material Picker</DialogTitle>
          <DialogDescription>
            Search wholesale suppliers or your saved catalog. Set quantity & markup, then add all at once.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Globe className="w-4 h-4" /> Supplier
          </div>
          <Select value={supplierId} onValueChange={(v) => { setSupplierId(v as SupplierId); setResults([]); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUPPLIERS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label} <span className="text-muted-foreground">· {s.location}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. mulch, lomandra, paver, sleeper…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || query.trim().length < 2} size="sm" className="shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Catalog quick-matches */}
          {catalogMatches.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Bookmark className="w-3 h-3" /> From your catalog</p>
              <div className="grid gap-1">
                {catalogMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => addCatalogItem(m)}
                    className="flex items-center justify-between text-left p-2 rounded-md border bg-background hover:bg-accent/50 transition-colors text-sm"
                  >
                    <span className="font-medium truncate">{m.name}</span>
                    <span className="text-primary font-semibold shrink-0 ml-2">${m.wholesalePrice.toFixed(2)}/{m.unit}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live supplier results */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              <p className="text-xs text-muted-foreground">Live results from {supplier.label}</p>
              {results.map((p, i) => (
                <button
                  key={i}
                  onClick={() => addSupplierResult(p)}
                  className="w-full text-left p-2 rounded-md border bg-background hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight line-clamp-2">{p.name}</span>
                    {p.price != null
                      ? <span className="text-sm font-bold text-primary shrink-0">${p.price.toFixed(2)}</span>
                      : <span className="text-xs text-muted-foreground shrink-0">Price N/A</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={p.inStock ? "default" : "destructive"} className="text-[10px] py-0">
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">per {p.unit} · {p.category}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pending selections — qty + markup before adding */}
        {pending.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected items ({pending.length})</p>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {pending.map((p) => {
                const unitCost = p.price ?? 0;
                const lineTotal = p.quantity * unitCost * (1 + p.markupPercent / 100);
                return (
                  <div key={p.key} className="rounded-md border p-3 bg-muted/30 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.supplierLabel} · ${unitCost.toFixed(2)}/{p.unit}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removePending(p.key)} className="h-7 px-2 text-destructive">Remove</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number" min={0} step="0.01" inputMode="decimal"
                          value={p.quantity}
                          onChange={(e) => updatePending(p.key, { quantity: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Markup %</Label>
                        <Input
                          type="number" min={0} step="1" inputMode="decimal"
                          value={p.markupPercent}
                          onChange={(e) => updatePending(p.key, { markupPercent: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Line Total</Label>
                        <div className="h-9 flex items-center font-semibold text-primary">${lineTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={pending.length === 0}>
            <Plus className="w-4 h-4 mr-1" /> Add {pending.length || ""} to Quote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
