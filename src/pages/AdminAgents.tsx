import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAllAgentProfiles, useUpdateAgentStatus } from "@/hooks/useAgentProfile";
import { useAgentRequests } from "@/hooks/useAgentRequests";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  suspended: "destructive",
};

export default function AdminAgents() {
  const { data: agents = [], isLoading } = useAllAgentProfiles();
  const updateStatus = useUpdateAgentStatus();
  const { requests } = useAgentRequests();
  const { toast } = useToast();

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: `Agent ${status}` });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getRequestCount = (agentId: string) => requests.filter((r) => r.agentId === agentId).length;

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Agent Management</h1>

        {agents.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No agents registered yet.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.agentName}</TableCell>
                      <TableCell>{agent.agencyName}</TableCell>
                      <TableCell>
                        <div className="text-sm">{agent.email}</div>
                        <div className="text-xs text-muted-foreground">{agent.phone}</div>
                      </TableCell>
                      <TableCell>{getRequestCount(agent.id)}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{agent.referralCode}</code></TableCell>
                      <TableCell><Badge variant={statusColors[agent.status]}>{agent.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {agent.status !== "approved" && (
                            <Button size="sm" variant="outline" onClick={() => handleStatus(agent.id, "approved")}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Approve
                            </Button>
                          )}
                          {agent.status !== "suspended" && (
                            <Button size="sm" variant="outline" onClick={() => handleStatus(agent.id, "suspended")}>
                              <XCircle className="w-3 h-3 mr-1" /> Suspend
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
