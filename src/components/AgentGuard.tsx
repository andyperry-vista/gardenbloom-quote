import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Status = "loading" | "approved" | "pending" | "suspended" | "no-profile" | "unauthenticated";

export default function AgentGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("unauthenticated"); return; }

      const { data } = await supabase
        .from("agent_profiles")
        .select("status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!data) { setStatus("no-profile"); return; }
      setStatus(data.status as Status);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { check(); });
    check();
    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated" || status === "no-profile") {
    return <Navigate to="/agent/login" replace />;
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Account Pending Approval</h2>
          <p className="text-muted-foreground">Your agent account is pending approval. You'll receive an email once approved.</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm text-primary underline">Sign out</button>
        </div>
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Account Suspended</h2>
          <p className="text-muted-foreground">Your agent account has been suspended. Please contact support.</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm text-primary underline">Sign out</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
