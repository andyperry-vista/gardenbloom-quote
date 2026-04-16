import AgentLayout from "@/components/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import { useAgentReferrals } from "@/hooks/useAgentReferrals";
import { DollarSign } from "lucide-react";
import { Navigate } from "react-router-dom";

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  pending: "secondary",
  earned: "default",
  paid: "outline",
};

export default function AgentReferrals() {
  const { profile, isLoading } = useAgentProfile();
  const { referrals } = useAgentReferrals(profile?.id);

  // Redirect agents without commission access
  if (!isLoading && profile && !profile.commissionEnabled) {
    return <Navigate to="/agent" replace />;
  }

  const totalEarned = referrals.filter((r) => r.status !== "pending").reduce((s, r) => s + r.commissionAmount, 0);
  const totalPaid = referrals.filter((r) => r.status === "paid").reduce((s, r) => s + r.commissionAmount, 0);
  const totalPending = referrals.filter((r) => r.status === "earned").reduce((s, r) => s + r.commissionAmount, 0);

  return (
    <AgentLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Referral Commissions</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Awaiting Payment</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-600">${totalPending.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Paid</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div></CardContent>
          </Card>
        </div>

        {profile?.referralCode && (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Your referral code:</p>
              <code className="bg-muted px-3 py-1.5 rounded text-lg font-mono">{profile.referralCode}</code>
              <p className="text-xs text-muted-foreground mt-2">Commission rate: {profile.commissionRate}%</p>
            </CardContent>
          </Card>
        )}

        {referrals.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No referrals yet.</CardContent></Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Referral History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">${ref.commissionAmount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={statusColors[ref.status]}>{ref.status}</Badge>
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
