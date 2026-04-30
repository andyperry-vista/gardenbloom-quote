import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Status = "loading" | "ok" | "no-employee" | "unauthenticated";

export default function EmployeeGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("unauthenticated"); return; }

      // Webmaster bypass — full site access
      const { data: wmRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "webmaster");
      if ((wmRoles ?? []).length > 0) { setStatus("ok"); return; }

      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("linked_user_id", session.user.id)
        .maybeSingle();
      setStatus(data ? "ok" : "no-employee");
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check());
    check();
    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (status === "unauthenticated") return <Navigate to="/employee/login" replace />;
  if (status === "no-employee") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">No Employee Profile</h2>
          <p className="text-muted-foreground text-sm">Your login isn't linked to an employee record. Please contact your manager.</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm text-primary underline">Sign out</button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
