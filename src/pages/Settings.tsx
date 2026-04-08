import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

export default function Settings() {
  const { settings, updateSettings } = useSettings();

  const handleMarkupChange = (value: number) => {
    updateSettings({ defaultMarkupPercent: value });
    toast.success("Markup updated");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure default values for your quotes and business
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap min-w-[160px]">Location</Label>
              <Input
                className="max-w-xs"
                value={settings.businessLocation}
                onChange={(e) => updateSettings({ businessLocation: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap min-w-[160px]">Currency</Label>
              <Input
                className="w-28"
                value={settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value })}
              />
              <Input
                className="w-20"
                value={settings.currencySymbol}
                onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
                placeholder="$"
              />
              <span className="text-sm text-muted-foreground">Symbol</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Label className="whitespace-nowrap min-w-[160px]">
                  Material Markup %
                </Label>
                <Input
                  type="number"
                  className="w-28"
                  value={settings.defaultMarkupPercent}
                  onChange={(e) => handleMarkupChange(Number(e.target.value))}
                  min={0}
                  max={200}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Applied to material costs only (not labour)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
