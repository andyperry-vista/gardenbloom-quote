import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgentLayout from "@/components/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import { useAgentRequests } from "@/hooks/useAgentRequests";
import { useServicePackages } from "@/hooks/useServicePackages";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const propertyTypes = ["House", "Townhouse", "Unit/Apartment", "Commercial", "Vacant Land"];

export default function AgentQuoteRequest() {
  const { profile } = useAgentProfile();
  const { createRequest } = useAgentRequests(profile?.id);
  const { packages } = useServicePackages(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    propertyAddress: "",
    propertyType: "",
    servicePackage: "",
    preferredDate: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await createRequest({
        agentId: profile.id,
        propertyAddress: form.propertyAddress,
        propertyType: form.propertyType,
        servicePackage: form.servicePackage,
        preferredDate: form.preferredDate || undefined,
        notes: form.notes,
      });
      toast({ title: "Request submitted", description: "We'll prepare a quote for you shortly." });
      navigate("/agent");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <AgentLayout>
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Request a Quote</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Property Address</Label>
              <Input value={form.propertyAddress} onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })} placeholder="123 Smith St, Doncaster VIC 3108" required />
            </div>
            <div>
              <Label>Property Type</Label>
              <Select value={form.propertyType} onValueChange={(v) => setForm({ ...form, propertyType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Service Package</Label>
              <Select value={form.servicePackage} onValueChange={(v) => setForm({ ...form, servicePackage: v })}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} — ${p.basePrice.toFixed(0)}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom (describe below)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Date</Label>
              <Input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special requirements, access details, etc." rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </AgentLayout>
  );
}
