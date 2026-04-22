import { useSettings } from "@/hooks/useSettings";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();

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

        <Card>
          <CardHeader>
            <CardTitle>Landing Page Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Provide public URLs to override the default before and after photos shown on the landing page.
            </p>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Hero Section</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Before Image URL</Label>
                  <Input 
                    value={settings.heroBeforeImage || ""} 
                    onChange={(e) => updateSettings({ heroBeforeImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>After Image URL</Label>
                  <Input 
                    value={settings.heroAfterImage || ""} 
                    onChange={(e) => updateSettings({ heroAfterImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Professional Shot URL</Label>
                  <Input 
                    value={settings.heroProfessionalImage || ""} 
                    onChange={(e) => updateSettings({ heroProfessionalImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Gallery Project 1</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Before Image URL</Label>
                  <Input 
                    value={settings.galleryProject1Before || ""} 
                    onChange={(e) => updateSettings({ galleryProject1Before: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>After Image URL</Label>
                  <Input 
                    value={settings.galleryProject1After || ""} 
                    onChange={(e) => updateSettings({ galleryProject1After: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Gallery Project 2</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Before Image URL</Label>
                  <Input 
                    value={settings.galleryProject2Before || ""} 
                    onChange={(e) => updateSettings({ galleryProject2Before: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>After Image URL</Label>
                  <Input 
                    value={settings.galleryProject2After || ""} 
                    onChange={(e) => updateSettings({ galleryProject2After: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Gallery Project 3</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Before Image URL</Label>
                  <Input 
                    value={settings.galleryProject3Before || ""} 
                    onChange={(e) => updateSettings({ galleryProject3Before: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>After Image URL</Label>
                  <Input 
                    value={settings.galleryProject3After || ""} 
                    onChange={(e) => updateSettings({ galleryProject3After: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSupported && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get notified instantly when new quote requests come in or jobs are updated.
              </p>
              {permission === "denied" ? (
                <p className="text-sm text-destructive">
                  Notifications are blocked. Please enable them in your browser/device settings.
                </p>
              ) : isSubscribed ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-success flex items-center gap-1.5">
                    <Bell className="w-4 h-4" /> Notifications enabled
                  </span>
                  <Button variant="outline" size="sm" onClick={() => { unsubscribe(); toast.success("Notifications disabled"); }}>
                    <BellOff className="w-4 h-4 mr-1.5" /> Disable
                  </Button>
                </div>
              ) : (
                <Button onClick={() => { subscribe().then(() => toast.success("Notifications enabled!")); }}>
                  <Bell className="w-4 h-4 mr-1.5" /> Enable Notifications
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
