import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Calculator, FileText, Users as UsersIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const blank: Partial<Employee> = {
  name: "", email: "", phone: "", address: "",
  hourlyRate: 35, superRate: 11.5, superFund: "", superMemberNumber: "",
  bsb: "", accountNumber: "", taxFileNumber: "",
  employmentType: "casual", active: true, notes: "",
};

export default function Employees() {
  const { employees, isLoading, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Partial<Employee>>(blank);

  const openNew = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (e: Employee) => { setEditing(e); setForm(e); setOpen(true); };

  const save = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    try {
      if (editing) {
        updateEmployee(editing.id, form);
        toast.success("Employee updated");
      } else {
        await createEmployee(form);
        toast.success("Employee added");
      }
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = (e: Employee) => {
    if (!confirm(`Delete ${e.name}? This cannot be undone.`)) return;
    deleteEmployee(e.id);
    toast.success("Employee deleted");
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl flex items-center gap-2"><UsersIcon className="w-7 h-7" /> Employees</h1>
            <p className="text-muted-foreground mt-1">Staff, hourly rates, super and payroll setup</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/payroll"><Button variant="outline"><Calculator className="w-4 h-4 mr-2" /> Payroll</Button></Link>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Employee</Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : employees.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No employees yet. Add your first.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {employees.map((e) => (
              <Card key={e.id}>
                <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">{e.name}</span>
                      <Badge variant={e.active ? "default" : "secondary"}>{e.active ? "Active" : "Inactive"}</Badge>
                      <Badge variant="outline">{e.employmentType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ${e.hourlyRate.toFixed(2)}/hr · Super {e.superRate}%
                      {e.email && ` · ${e.email}`}
                      {e.phone && ` · ${e.phone}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/admin/payroll?employee=${e.id}`}>
                      <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-1" /> Payslips</Button>
                    </Link>
                    <Button variant="outline" size="icon" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(e)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Full Name *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Address</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Hourly Rate ($)</Label><Input type="number" step="0.01" value={form.hourlyRate ?? 0} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} /></div>
            <div>
              <Label>Employment Type</Label>
              <Select value={form.employmentType ?? "casual"} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Super Rate (%)</Label><Input type="number" step="0.1" value={form.superRate ?? 11.5} onChange={(e) => setForm({ ...form, superRate: Number(e.target.value) })} /></div>
            <div><Label>Super Fund</Label><Input value={form.superFund ?? ""} onChange={(e) => setForm({ ...form, superFund: e.target.value })} /></div>
            <div><Label>Super Member #</Label><Input value={form.superMemberNumber ?? ""} onChange={(e) => setForm({ ...form, superMemberNumber: e.target.value })} /></div>
            <div><Label>Tax File Number</Label><Input value={form.taxFileNumber ?? ""} onChange={(e) => setForm({ ...form, taxFileNumber: e.target.value })} /></div>
            <div><Label>BSB</Label><Input value={form.bsb ?? ""} onChange={(e) => setForm({ ...form, bsb: e.target.value })} placeholder="000-000" /></div>
            <div><Label>Account Number</Label><Input value={form.accountNumber ?? ""} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.startDate ?? ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="flex items-end gap-2">
              <Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Active</Label>
            </div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
