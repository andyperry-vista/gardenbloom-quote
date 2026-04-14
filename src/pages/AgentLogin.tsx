import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, UserPlus, Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react";
import mayuraLogo from "@/assets/mayura-logo.png";
import { supabase } from "@/integrations/supabase/client";

export default function AgentLogin() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      navigate("/agent");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/agent/login",
        data: {
          is_agent: "true",
          agent_name: agentName,
          agency_name: agencyName,
          phone,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    setSignupSuccess(true);
    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4 relative">
        <Button 
          variant="ghost" 
          className="absolute top-4 left-4 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Return to Homepage
        </Button>
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <img src={mayuraLogo} alt="Mayura" className="h-16 w-auto mx-auto rounded mb-4" />
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to <strong>{email}</strong>. Please verify your email, then log in. Your account will be reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => { setSignupSuccess(false); setTab("login"); }}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
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
          <CardTitle>Agent Portal</CardTitle>
          <CardDescription>Sign in or create your agent account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setError(""); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login"><Lock className="w-3 h-3 mr-1" /> Login</TabsTrigger>
              <TabsTrigger value="signup"><UserPlus className="w-3 h-3 mr-1" /> Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="agent@agency.com" required autoFocus />
                </div>
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Enter password" required />
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
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3 mt-4">
                <div>
                  <Label>Your Name</Label>
                  <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Jane Smith" required />
                </div>
                <div>
                  <Label>Agency Name</Label>
                  <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Ray White Doncaster" required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="agent@agency.com" required />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0412 345 678" />
                </div>
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Min 6 characters" required />
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
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
