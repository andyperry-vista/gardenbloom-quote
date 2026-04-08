import { useState } from "react";
import { useMaterials } from "@/hooks/useMaterials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, MapPin, Package, RefreshCw, Loader2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import type { Material } from "@/types/quote";
import { supabase } from "@/integrations/supabase/client";
import MaterialCard from "@/components/MaterialCard";

interface BunningsProduct {
  name: string;
  price: number | null;
  unit: string;
  inStock: boolean;
  category: string;
}

export default function Materials() {
  const { materials, addMaterial, updateMaterial, deleteMaterial, resetToDefaults } = useMaterials();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    wholesalePrice: "",
    unit: "",
    supplier: "",
    supplierLocation: "",
    inStock: true,
    notes: "",
  });

  // Bunnings search state
  const [bunningsQuery, setBunningsQuery] = useState("");
  const [bunningsResults, setBunningsResults] = useState<BunningsProduct[]>([]);
  const [bunningsLoading, setBunningsLoading] = useState(false);

  const filtered = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(materials.map((m) => m.category))];

  const handleBunningsSearch = async () => {
    if (!bunningsQuery.trim() || bunningsQuery.trim().length < 2) return;
    setBunningsLoading(true);
    setBunningsResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("search-bunnings", {
        body: { query: bunningsQuery.trim() },
      });

      if (error) throw error;

      if (data?.success && data.products?.length > 0) {
        setBunningsResults(data.products);
      } else {
        toast({
          title: "No results",
          description: "No products found. Try a different search term.",
        });
      }
    } catch (err) {
      console.error("Bunnings search error:", err);
      toast({
        title: "Search failed",
        description: "Could not search Bunnings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBunningsLoading(false);
    }
  };

  const selectBunningsProduct = (product: BunningsProduct) => {
    setForm({
      name: product.name,
      category: product.category,
      wholesalePrice: product.price?.toString() || "",
      unit: product.unit,
      supplier: "Bunnings",
      supplierLocation: "Doncaster, VIC",
      inStock: product.inStock,
      notes: "",
    });
    setBunningsResults([]);
    setBunningsQuery("");
  };

  const handleAdd = () => {
    if (!form.name || !form.wholesalePrice) return;
    const newMaterial: Material = {
      id: `m-${Date.now()}`,
      name: form.name,
      category: form.category,
      wholesalePrice: parseFloat(form.wholesalePrice),
      unit: form.unit,
      supplier: form.supplier,
      supplierLocation: form.supplierLocation,
      inStock: form.inStock,
      notes: form.notes || undefined,
    };
    addMaterial(newMaterial);
    setForm({ name: "", category: "", wholesalePrice: "", unit: "", supplier: "", supplierLocation: "", inStock: true, notes: "" });
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Materials Catalog</h1>
            <p className="text-muted-foreground mt-1">
              Wholesale prices, suppliers & stock
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setBunningsResults([]);
                setBunningsQuery("");
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
              </DialogHeader>

              {/* Bunnings Search Section */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Globe className="w-4 h-4" />
                  Search Bunnings Live
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. garden soil, pavers, timber sleeper…"
                    value={bunningsQuery}
                    onChange={(e) => setBunningsQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBunningsSearch()}
                  />
                  <Button
                    onClick={handleBunningsSearch}
                    disabled={bunningsLoading || bunningsQuery.trim().length < 2}
                    size="sm"
                    className="shrink-0"
                  >
                    {bunningsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {bunningsLoading && (
                  <p className="text-xs text-muted-foreground">Searching Bunnings for real-time pricing…</p>
                )}
                {bunningsResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bunningsResults.map((product, i) => (
                      <button
                        key={i}
                        onClick={() => selectBunningsProduct(product)}
                        className="w-full text-left p-2 rounded-md border bg-background hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-tight line-clamp-2">{product.name}</span>
                          <div className="text-right shrink-0">
                            {product.price != null ? (
                              <span className="text-sm font-bold text-primary">${product.price.toFixed(2)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Price N/A</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={product.inStock ? "default" : "destructive"} className="text-[10px] py-0">
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">per {product.unit}</span>
                          <span className="text-xs text-muted-foreground">· {product.category}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex items-center gap-2 py-1">
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">or enter manually</span>
                <div className="flex-1 border-t" />
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Plants" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Wholesale Price ($)</Label>
                    <Input type="number" step="0.01" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. each, bag, metre" />
                  </div>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                </div>
                <div>
                  <Label>Supplier Location</Label>
                  <Input value={form.supplierLocation} onChange={(e) => setForm({ ...form, supplierLocation: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.inStock} onCheckedChange={(v) => setForm({ ...form, inStock: v })} />
                  <Label>In Stock</Label>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={handleAdd}>Add Material</Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search materials, categories, suppliers…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {categories.map((cat) => {
          const items = filtered.filter((m) => m.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="font-display text-lg font-semibold mb-3 text-foreground">
                {cat}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <MaterialCard
                    key={m.id}
                    material={m}
                    onUpdate={updateMaterial}
                    onDelete={deleteMaterial}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
