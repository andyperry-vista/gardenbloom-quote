import AgentLayout from "@/components/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import { useAgentRequests } from "@/hooks/useAgentRequests";
import { useAgentReferrals } from "@/hooks/useAgentReferrals";
import { Briefcase, FileText, DollarSign, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AgentDashboard() {
  const { profile } = useAgentProfile();
  const { requests } = useAgentRequests(profile?.id);
  const { referrals } = useAgentReferrals(profile?.id);

  const activeRequests = requests.filter((r) => r.status !== "completed");
  const completedRequests = requests.filter((r) => r.status === "completed");
  const totalEarned = referrals.filter((r) => r.status === "earned" || r.status === "paid").reduce((s, r) => s + r.commissionAmount, 0);
  const pendingCommission = referrals.filter((r) => r.status === "earned").reduce((s, r) => s + r.commissionAmount, 0);

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.agentName || "Agent"}</h1>
          <p className="text-muted-foreground">{profile?.agencyName}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Commission</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pendingCommission.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Link to="/agent/request">
            <Button>New Quote Request</Button>
          </Link>
          <Link to="/agent/jobs">
            <Button variant="outline">View Jobs</Button>
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

        {profile?.referralCode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="bg-muted px-3 py-1.5 rounded text-lg font-mono">{profile.referralCode}</code>
              <p className="text-xs text-muted-foreground mt-2">Share this code to earn {profile.commissionRate}% commission on referred jobs.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AgentLayout>
  );
}
