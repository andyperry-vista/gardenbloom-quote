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
import { Search, Plus, MapPin, Package, RefreshCw } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import type { Material } from "@/types/quote";

export default function Materials() {
  const { materials, addMaterial, resetToDefaults } = useMaterials();
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

  const filtered = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(materials.map((m) => m.category))];

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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{m.name}</CardTitle>
                        <Badge variant={m.inStock ? "default" : "destructive"} className="text-xs">
                          {m.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          ${m.wholesalePrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          per {m.unit}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Package className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{m.supplier}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{m.supplierLocation}</span>
                      </div>
                      {m.notes && (
                        <p className="text-xs text-accent italic">{m.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
