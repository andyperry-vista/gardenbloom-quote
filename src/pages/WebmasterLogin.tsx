import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Crown, Loader2, Eye, EyeOff, ChevronLeft, ShieldAlert } from "lucide-react";
import mayuraLogo from "@/assets/mayura-logo.png";
import { supabase } from "@/integrations/supabase/client";

/**
 * Verifies the given user still has the webmaster role.
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

// ------------------------------------------------------------------
// Client-side brute-force throttle
// NOTE: This is a UX deterrent only — it is not a real security control
// (an attacker can clear localStorage or hit the API directly). True
// brute-force protection is enforced server-side by the auth provider's
// per-IP throttling. See docs.
// ------------------------------------------------------------------
const THROTTLE_KEY = "wm_login_throttle_v1";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface ThrottleState {
  failures: number;
  lockedUntil: number; // epoch ms; 0 if not locked
}

function readThrottle(): ThrottleState {
  try {
    const raw = localStorage.getItem(THROTTLE_KEY);
    if (!raw) return { failures: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw);
    return {
      failures: Number(parsed.failures) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
  } catch {
    return { failures: 0, lockedUntil: 0 };
  }
}

function writeThrottle(state: ThrottleState) {
  try {
    localStorage.setItem(THROTTLE_KEY, JSON.stringify(state));
  } catch {
    /* storage disabled — silently no-op */
  }
}

function clearThrottle() {
  try {
    localStorage.removeItem(THROTTLE_KEY);
  } catch {
    /* no-op */
  }
}

/** Map known auth error messages to friendly copy. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid_credentials")) {
    return "Email or password is incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function WebmasterLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [throttle, setThrottle] = useState<ThrottleState>(() => readThrottle());
  const [now, setNow] = useState<number>(Date.now());
  const navigate = useNavigate();

  const lockRemaining = Math.max(0, throttle.lockedUntil - now);
  const isLocked = lockRemaining > 0;
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - throttle.failures);

  // Tick every second while locked, so the countdown updates.
  useEffect(() => {
    if (!isLocked) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLocked]);

  // When the lockout expires, reset the throttle so the user can try again.
  useEffect(() => {
    if (throttle.lockedUntil > 0 && now >= throttle.lockedUntil) {
      clearThrottle();
      setThrottle({ failures: 0, lockedUntil: 0 });
      setError("");
    }
  }, [now, throttle.lockedUntil]);

  // Existing session handling: route already-signed-in webmasters straight
  // to the console; sign out users whose role was revoked.
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
        await supabase.auth.signOut();
        setCheckingSession(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAndRoute(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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

  const recordFailure = () => {
    const next: ThrottleState = {
      failures: throttle.failures + 1,
      lockedUntil:
        throttle.failures + 1 >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0,
    };
    writeThrottle(next);
    setThrottle(next);
    setNow(Date.now());
  };

  const recordSuccess = () => {
    clearThrottle();
    setThrottle({ failures: 0, lockedUntil: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      recordFailure();
      setError(friendlyAuthError(authError.message));
      setLoading(false);
      return;
    }

    const ok = await verifyWebmasterRole(authData.user.id);
    if (!ok) {
      await supabase.auth.signOut();
      // Treat missing role like a failed attempt — prevents fishing for
      // valid non-webmaster credentials from this page.
      recordFailure();
      setError("Access denied. Webmaster privileges required.");
      setLoading(false);
      return;
    }

    recordSuccess();
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
        className="absolute left-4 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
        style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
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
          {isLocked ? (
            <div className="space-y-3 text-center py-2">
              <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
              <h3 className="font-semibold">Too many failed attempts</h3>
              <p className="text-sm text-muted-foreground">
                For your security, sign-in is temporarily disabled on this device.
              </p>
              <p className="text-sm font-mono">
                Try again in <span className="font-semibold">{formatRemaining(lockRemaining)}</span>
              </p>
            </div>
          ) : (
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
                  disabled={loading}
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
                    disabled={loading}
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
              {error && (
                <div className="space-y-1">
                  <p className="text-sm text-destructive">{error}</p>
                  {throttle.failures > 0 && attemptsLeft > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining before lockout.
                    </p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
            Don't have webmaster access?{" "}
            <a
              href="mailto:nicholas@mayuragardenservices.com.au?subject=Webmaster%20access%20request"
              className="text-primary underline hover:no-underline"
            >
              Contact an admin
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
