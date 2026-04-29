import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "webmaster" | "admin" | "manager" | "user";

export interface Permissions {
  loading: boolean;
  userId: string | null;
  roles: AppRole[];
  isWebmaster: boolean;
  isAdmin: boolean;
  isManager: boolean;
  /** Admins or managers — base access to admin portal */
  isStaff: boolean;
  /** Can add/edit/delete employees & send invites */
  canManageEmployees: boolean;
  /** Can edit hourly/salary rates and payroll defaults */
  canEditRates: boolean;
  /** Can create, issue, or delete payslips */
  canApprovePayslips: boolean;
  /** Can assign roles to other users */
  canManageRoles: boolean;
}

const empty: Permissions = {
  loading: true,
  userId: null,
  roles: [],
  isWebmaster: false,
  isAdmin: false,
  isManager: false,
  isStaff: false,
  canManageEmployees: false,
  canEditRates: false,
  canApprovePayslips: false,
  canManageRoles: false,
};

export function usePermissions(): Permissions {
  const [state, setState] = useState<Permissions>(empty);

  useEffect(() => {
    let cancelled = false;

    const load = async (userId: string | null) => {
      if (!userId) {
        if (!cancelled) setState({ ...empty, loading: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (cancelled) return;
      const roles = ((data ?? []).map((r) => r.role)) as AppRole[];
      const isWebmaster = roles.includes("webmaster");
      // Webmaster implicitly has admin & manager privileges.
      const isAdmin = isWebmaster || roles.includes("admin");
      const isManager = isWebmaster || roles.includes("manager");
      setState({
        loading: false,
        userId,
        roles,
        isWebmaster,
        isAdmin,
        isManager,
        isStaff: isAdmin || isManager,
        canManageEmployees: isAdmin || isManager,
        canEditRates: isAdmin,
        canApprovePayslips: isAdmin || isManager,
        canManageRoles: isAdmin,
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setState((s) => ({ ...s, loading: true }));
      load(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      load(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
