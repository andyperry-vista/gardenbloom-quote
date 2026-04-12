import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Package, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Material } from "@/types/quote";

interface MaterialCardProps {
  material: Material;
  onUpdate: (id: string, updates: Partial<Material>) => void;
  onDelete: (id: string) => void;
}

export default function MaterialCard({ material: m, onUpdate, onDelete }: MaterialCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    name: m.name,
    category: m.category,
    wholesalePrice: m.wholesalePrice.toString(),
    unit: m.unit,
    supplier: m.supplier,
    supplierLocation: m.supplierLocation,
    inStock: m.inStock,
    notes: m.notes || "",
  });

  const handleSave = () => {
    if (!form.name || !form.wholesalePrice) return;
    onUpdate(m.id, {
      name: form.name,
      category: form.category,
      wholesalePrice: parseFloat(form.wholesalePrice),
      unit: form.unit,
      supplier: form.supplier,
      supplierLocation: form.supplierLocation,
      inStock: form.inStock,
      notes: form.notes || undefined,
    });
    setEditOpen(false);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow group relative">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between pr-8">
            <CardTitle className="text-base">{m.name}</CardTitle>
            <Badge variant={m.inStock ? "default" : "destructive"} className="text-xs shrink-0">
              {m.inStock ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ${m.wholesalePrice.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">per {m.unit}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{m.supplier}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{m.supplierLocation}</span>
          </div>
          {m.notes && <p className="text-xs text-accent italic">{m.notes}</p>}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription className="sr-only">Form to edit an existing material</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Wholesale Price ($)</Label>
                <Input type="number" step="0.01" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
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
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Material</DialogTitle>
            <DialogDescription className="sr-only">Confirm deletion of material</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{m.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { onDelete(m.id); setConfirmDelete(false); }}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
