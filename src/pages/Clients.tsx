import { useState } from "react";
import { Link } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useQuotes } from "@/hooks/useQuotes";
import { useJobs } from "@/hooks/useJobs";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Mail, Phone, MapPin, ChevronDown, ChevronUp, FileText, Briefcase, Receipt } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { useSettings } from "@/hooks/useSettings";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-900/30 text-blue-300",
  accepted: "bg-green-900/30 text-green-300",
  declined: "bg-destructive/20 text-destructive",
  scheduled: "bg-blue-900/30 text-blue-300",
  in_progress: "bg-yellow-900/30 text-yellow-300",
  completed: "bg-green-900/30 text-green-300",
  invoiced: "bg-purple-900/30 text-purple-300",
  unpaid: "bg-yellow-900/30 text-yellow-300",
  paid: "bg-green-900/30 text-green-300",
  overdue: "bg-destructive/20 text-destructive",
};

export default function Clients() {
  const { clients, isLoading } = useClients();
  const { quotes } = useQuotes();
  const { jobs } = useJobs();
  const { invoices } = useInvoices();
  const { settings } = useSettings();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
  });

  const getClientQuotes = (clientId: string) => quotes.filter((q) => q.client.id === clientId);
  const getClientJobs = (clientId: string) => jobs.filter((j) => j.clientId === clientId);
  const getClientInvoices = (clientId: string) => invoices.filter((i) => i.clientId === clientId);

  const getClientTotal = (clientId: string) => {
    return getClientInvoices(clientId)
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.totalWithGst, 0);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">
              {clients.length} client{clients.length !== 1 ? "s" : ""} on record
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}

        {!isLoading && filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto w-10 h-10 mb-3 opacity-50" />
              {search ? "No clients match your search." : "No clients yet. Create a quote to add your first client."}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {filtered.map((client) => {
            const isExpanded = expandedId === client.id;
            const cQuotes = getClientQuotes(client.id);
            const cJobs = getClientJobs(client.id);
            const cInvoices = getClientInvoices(client.id);
            const totalPaid = getClientTotal(client.id);

            return (
              <Card key={client.id} className="overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg truncate">{client.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          {client.address && (
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{client.address}</span>
                          )}
                          {client.email && (
                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{cQuotes.length} quote{cQuotes.length !== 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span>{cJobs.length} job{cJobs.length !== 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span>{cInvoices.length} invoice{cInvoices.length !== 1 ? "s" : ""}</span>
                          </div>
                          {totalPaid > 0 && (
                            <p className="text-sm font-medium text-green-400 mt-0.5">
                              {settings.currencySymbol}{totalPaid.toFixed(2)} paid
                            </p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardContent>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-6 py-4 space-y-4 bg-muted/20">
                    {/* Quotes */}
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                        <FileText className="w-4 h-4" /> Quotes ({cQuotes.length})
                      </h4>
                      {cQuotes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No quotes</p>
                      ) : (
                        <div className="space-y-1">
                          {cQuotes.map((q) => (
                            <Link key={q.id} to={`/admin/quotes/${q.id}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/40 text-sm">
                              <span>{format(new Date(q.createdAt), "dd MMM yyyy")}</span>
                              <div className="flex items-center gap-2">
                                <span>{settings.currencySymbol}{q.grandTotal.toFixed(2)}</span>
                                <Badge className={statusColors[q.status] || ""}>{q.status}</Badge>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Jobs */}
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                        <Briefcase className="w-4 h-4" /> Jobs ({cJobs.length})
                      </h4>
                      {cJobs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No jobs</p>
                      ) : (
                        <div className="space-y-1">
                          {cJobs.map((j) => (
                            <Link key={j.id} to={`/admin/jobs/${j.id}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/40 text-sm">
                              <span>{j.jobNumber}</span>
                              <div className="flex items-center gap-2">
                                {j.scheduledDate && <span className="text-muted-foreground">{format(new Date(j.scheduledDate), "dd MMM yyyy")}</span>}
                                <Badge className={statusColors[j.status] || ""}>{j.status.replace("_", " ")}</Badge>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Invoices */}
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                        <Receipt className="w-4 h-4" /> Invoices ({cInvoices.length})
                      </h4>
                      {cInvoices.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No invoices</p>
                      ) : (
                        <div className="space-y-1">
                          {cInvoices.map((inv) => (
                            <Link key={inv.id} to={`/admin/invoices/${inv.id}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/40 text-sm">
                              <span>{inv.invoiceNumber}</span>
                              <div className="flex items-center gap-2">
                                <span>{settings.currencySymbol}{inv.totalWithGst.toFixed(2)}</span>
                                <Badge className={statusColors[inv.status] || ""}>{inv.status}</Badge>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
