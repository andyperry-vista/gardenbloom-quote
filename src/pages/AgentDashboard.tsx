import AgentLayout from "@/components/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import { useAgentRequests } from "@/hooks/useAgentRequests";
import { Briefcase, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AgentDashboard() {
  const { profile } = useAgentProfile();
  const { requests } = useAgentRequests(profile?.id);

  const activeRequests = requests.filter((r) => r.status !== "completed");
  const completedRequests = requests.filter((r) => r.status === "completed");

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.agentName || "Agent"}</h1>
          <p className="text-muted-foreground">{profile?.agencyName}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRequests.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedRequests.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/agent/request" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11">New Quote Request</Button>
          </Link>
          <Link to="/agent/jobs" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-11">View Jobs</Button>
          </Link>
        </div>

        {activeRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{req.propertyAddress}</p>
                      <p className="text-xs text-muted-foreground">{req.servicePackage} · {req.propertyType}</p>
                    </div>
                    <Badge variant={req.status === "pending" ? "secondary" : req.status === "quoted" ? "default" : "outline"}>
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AgentLayout>
  );
}
