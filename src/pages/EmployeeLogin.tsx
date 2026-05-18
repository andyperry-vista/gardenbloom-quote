import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ChevronLeft, HardHat } from "lucide-react";
import mayuraLogo from "@/assets/mayura-logo.png";
import { toast } from "sonner";
import { useDocumentHead } from "@/hooks/useDocumentHead";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);
  const navigate = useNavigate();
  useDocumentHead({
    title: "Crew Sign In | Mayura Garden Services",
    description: "Crew sign-in portal for Mayura Garden Services team members to log hours and view assigned jobs.",
    path: "/employee/login",
    noindex: true,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) { setError(authErr.message); setLoading(false); return; }
    navigate("/employee");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error: e2 } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/employee/login`,
    });
    setLoading(false);
    if (e2) { toast.error(e2.message); return; }
    toast.success("Check your email for a reset link");
    setForgot(false);
  };

  return (
    <div
      className="min-h-screen bg-primary flex items-center justify-center p-4 relative"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Home
      </Button>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={mayuraLogo} alt="Mayura" className="h-16 w-auto mx-auto rounded mb-3" />
          <CardTitle className="flex items-center justify-center gap-2"><HardHat className="w-5 h-5" /> Crew Sign In</CardTitle>
          <CardDescription>{forgot ? "Reset your password" : "Log hours and view your assigned jobs"}</CardDescription>
        </CardHeader>
        <CardContent>
          {forgot ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Send reset link
              </Button>
              <button type="button" onClick={() => setForgot(false)} className="text-xs text-muted-foreground underline w-full text-center">
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} required autoFocus />
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    required
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sign In
              </Button>
              <button type="button" onClick={() => setForgot(true)} className="text-xs text-muted-foreground underline w-full text-center">
                Forgot password?
              </button>
              <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                New here? Your manager needs to invite you from the admin portal.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
