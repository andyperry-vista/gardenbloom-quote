import { Link } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilePlus, DollarSign, FileText, TrendingUp } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
};

export default function Dashboard() {
  const { quotes } = useQuotes();

  const totalQuoted = quotes.reduce((sum, q) => sum + q.grandTotal, 0);
  const acceptedTotal = quotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + q.grandTotal, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Pre-sale garden styling quotes
            </p>
          </div>
          <Link to="/quotes/new">
            <Button>
              <FilePlus className="w-4 h-4 mr-2" />
              New Quote
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Quotes
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Quoted
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalQuoted.toLocaleString("en-NZ", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accepted Value
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${acceptedTotal.toLocaleString("en-NZ", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {quotes.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No quotes yet. Create your first garden styling quote!
              </p>
              <Link to="/quotes/new">
                <Button>
                  <FilePlus className="w-4 h-4 mr-2" />
                  Create Quote
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    to={`/quotes/${quote.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{quote.client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.client.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        ${quote.grandTotal.toLocaleString("en-NZ", { minimumFractionDigits: 2 })}
                      </span>
                      <Badge className={statusColors[quote.status]} variant="secondary">
                        {quote.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
