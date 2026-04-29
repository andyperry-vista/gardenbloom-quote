import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, UserCog, Trash2, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, type AppRole } from "@/hooks/usePermissions";

interface RoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  email?: string;
}

export default function AdminTeam() {
  const perms = usePermissions();
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("manager");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .in("role", ["admin", "manager"]);
    if (error) toast.error(error.message);
    setRows((data ?? []) as RoleRow[]);
    setLoading(false);
  };

  useEffect(() => { if (perms.isAdmin) load(); }, [perms.isAdmin]);

  if (perms.loading) {
    return <AppLayout><div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></AppLayout>;
  }
  if (!perms.isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const handleAdd = async () => {
    if (!newEmail.includes("@")) { toast.error("Valid email required"); return; }
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-role", {
        body: { email: newEmail.trim().toLowerCase(), role: newRole },
      });
      if (error) throw error;
      const result = data as { error?: string; message?: string };
      if (result?.error) throw new Error(result.error);
      toast.success(result?.message || "Role assigned");
      setNewEmail("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (row: RoleRow) => {
    if (row.user_id === perms.userId && row.role === "admin") {
      toast.error("You cannot remove your own admin role");
      return;
    }
    if (!confirm(`Remove ${row.role} role?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Role removed");
    load();
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2"><ShieldCheck className="w-7 h-7" /> Team & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Admins have full access. Managers can manage employees and approve payslips, but cannot edit pay rates or assign roles.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="w-5 h-5" /> Grant role</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-[1fr_180px_auto] items-end">
            <div>
              <Label>User email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="person@example.com" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={adding}>
              {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Grant
            </Button>
            <p className="sm:col-span-3 text-xs text-muted-foreground">
              The user must already have an account (e.g. signed up or been invited).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Current team</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground">No roles assigned yet.</p>
            ) : rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge>
                    {r.user_id === perms.userId && <Badge variant="outline">You</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{r.user_id}</p>
                </div>
                <Button variant="destructive" size="icon" onClick={() => handleRemove(r)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
