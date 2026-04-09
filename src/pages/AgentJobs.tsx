import AgentLayout from "@/components/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import { useAgentRequests } from "@/hooks/useAgentRequests";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  quoted: "default",
  accepted: "outline",
  completed: "default",
};

const statusSteps = ["pending", "quoted", "accepted", "completed"];

export default function AgentJobs() {
  const { profile } = useAgentProfile();
  const { requests } = useAgentRequests(profile?.id);
  const qc = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("agent-requests-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["agentRequests"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <Link to="/agent/request"><Button size="sm">New Request</Button></Link>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No requests yet. Submit your first quote request to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const stepIndex = statusSteps.indexOf(req.status);
              return (
                <Card key={req.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{req.propertyAddress}</p>
                        <p className="text-sm text-muted-foreground">{req.servicePackage} · {req.propertyType}</p>
                        {req.preferredDate && <p className="text-xs text-muted-foreground mt-1">Preferred: {new Date(req.preferredDate).toLocaleDateString()}</p>}
                      </div>
                      <Badge variant={statusColors[req.status] || "secondary"}>{req.status}</Badge>
                    </div>

                    {/* Status timeline */}
                    <div className="flex items-center gap-1 mt-3">
                      {statusSteps.map((step, i) => (
                        <div key={step} className="flex items-center flex-1">
                          <div className={`w-3 h-3 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted"}`} />
                          <div className={`flex-1 h-0.5 ${i < statusSteps.length - 1 ? (i < stepIndex ? "bg-primary" : "bg-muted") : "hidden"}`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {statusSteps.map((step) => (
                        <span key={step} className="text-[10px] text-muted-foreground capitalize">{step}</span>
                      ))}
                    </div>

                    {req.notes && <p className="text-xs text-muted-foreground mt-3 border-t pt-2">{req.notes}</p>}

                    {req.status === "completed" && (
                      <div className="mt-3 flex gap-2">
                        <Link to={`/agent/request?reorder=${req.id}`}>
                          <Button size="sm" variant="outline"><RefreshCw className="w-3 h-3 mr-1" /> Re-order</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AgentLayout>
  );
}
