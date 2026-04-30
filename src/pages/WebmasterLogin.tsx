import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Crown, Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react";
import mayuraLogo from "@/assets/mayura-logo.png";
import { supabase } from "@/integrations/supabase/client";

/**
 * Verifies the given user still has the webmaster role.
 * Returns true if access should be granted, false otherwise.
 */
async function verifyWebmasterRole(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "webmaster")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export default function WebmasterLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // On mount: if a valid webmaster session already exists, skip the login form.
  // Also re-verify the webmaster role whenever the auth state changes (sign-in,
  // token refresh, etc.) so a revoked role is enforced immediately.
  useEffect(() => {
    let cancelled = false;

    const checkAndRoute = async (userId: string | null) => {
      if (!userId) {
        if (!cancelled) setCheckingSession(false);
        return;
      }
      const ok = await verifyWebmasterRole(userId);
      if (cancelled) return;
      if (ok) {
        navigate("/admin/webmaster", { replace: true });
      } else {
        // Session exists but role was removed — clear it.
        await supabase.auth.signOut();
        setCheckingSession(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAndRoute(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Re-validate role on token refresh; sign user out if it was revoked.
        if (event === "TOKEN_REFRESHED" && session?.user?.id) {
          verifyWebmasterRole(session.user.id).then((ok) => {
            if (!ok && !cancelled) {
              supabase.auth.signOut();
              setError("Your webmaster access has been revoked.");
            }
          });
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const ok = await verifyWebmasterRole(authData.user.id);
    if (!ok) {
      await supabase.auth.signOut();
      setError("Access denied. Webmaster privileges required.");
      setLoading(false);
      return;
    }

    navigate("/admin/webmaster", { replace: true });
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 relative">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Return to Homepage
      </Button>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={mayuraLogo} alt="Mayura" className="h-16 w-auto mx-auto rounded mb-4" />
          <CardTitle className="flex items-center justify-center gap-2">
            <Crown className="w-4 h-4" /> Webmaster Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="webmaster@example.com"
                autoFocus
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
