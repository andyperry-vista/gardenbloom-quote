import { useState } from "react";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, Eye, CheckCircle, Trash2, Filter } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
];

const statusBadge: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-amber-500/10 text-amber-600",
  converted: "bg-emerald-500/10 text-emerald-600",
};

export default function QuoteRequests() {
  const { requests, isLoading, updateStatus } = useQuoteRequests();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">Quote Requests</h1>
            <p className="text-muted-foreground mt-1">Manage inbound enquiries from your website</p>
          </div>
          <Badge variant="secondary" className="text-sm">{requests.length} total</Badge>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={filter === opt.value ? "default" : "outline"}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
              {opt.value !== "all" && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                  {requests.filter((r) => opt.value === "all" || r.status === opt.value).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Inbox className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {filter === "all" ? "No quote requests yet." : `No ${filter} requests.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{req.name}</span>
                        <Badge className={statusBadge[req.status] || "bg-muted text-muted-foreground"} variant="secondary">
                          {req.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span>{req.email}</span>
                        {req.phone && <span>· {req.phone}</span>}
                        {req.referralCode && (
                          <Badge variant="outline" className="text-xs">Ref: {req.referralCode}</Badge>
                        )}
                      </div>

                      {req.address && (
                        <p className="text-sm text-muted-foreground">{req.address}</p>
                      )}

                      {req.message && (
                        <p className="text-sm text-foreground/80">{req.message}</p>
                      )}

                      {req.photoUrls && req.photoUrls.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {req.photoUrls.slice(0, 6).map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative block w-16 h-16 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                            >
                              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                          {req.photoUrls.length > 6 && (
                            <div className="w-16 h-16 rounded-md border flex items-center justify-center bg-muted text-xs text-muted-foreground font-medium">
                              +{req.photoUrls.length - 6}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground pt-1">
                        {new Date(req.createdAt).toLocaleDateString("en-AU", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {req.status === "new" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, "contacted")}>
                          <Eye className="w-3 h-3 mr-1" /> Contacted
                        </Button>
                      )}
                      {(req.status === "new" || req.status === "contacted") && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, "converted")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Converted
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
