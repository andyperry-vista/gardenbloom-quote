import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import mayuraLogo from "@/assets/mayura-logo.png";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) setStatus("invalid");
        else if (data.valid === false) setStatus("already_unsubscribed");
        else setStatus("valid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      setStatus(error ? "error" : "success");
    } catch { setStatus("error"); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8 space-y-6">
          <img src={mayuraLogo} alt="Mayura" className="h-16 w-auto mx-auto rounded" />
          {status === "loading" && <p className="text-muted-foreground">Verifying…</p>}
          {status === "valid" && (
            <>
              <p className="text-foreground">Are you sure you want to unsubscribe from emails?</p>
              <Button onClick={handleUnsubscribe}>Confirm Unsubscribe</Button>
            </>
          )}
          {status === "success" && <p className="text-foreground font-medium">You've been unsubscribed successfully.</p>}
          {status === "already_unsubscribed" && <p className="text-muted-foreground">You're already unsubscribed.</p>}
          {status === "invalid" && <p className="text-destructive">Invalid or expired unsubscribe link.</p>}
          {status === "error" && <p className="text-destructive">Something went wrong. Please try again later.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
