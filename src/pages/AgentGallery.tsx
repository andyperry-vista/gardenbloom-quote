import { useState, useEffect } from "react";
import AgentLayout from "@/components/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  name: string;
  url: string;
}

export default function AgentGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.storage.from("garden-photos").list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (data) {
        const urls = data
          .filter((f) => !f.id?.endsWith("/"))
          .map((f) => ({
            name: f.name,
            url: supabase.storage.from("garden-photos").getPublicUrl(f.name).data.publicUrl,
          }));
        setImages(urls);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Before & After Gallery</h1>
          <p className="text-muted-foreground">Browse completed project photos for your marketing materials.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No gallery photos available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <Card key={img.name} className="overflow-hidden group">
                <div className="aspect-square relative">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={img.url} download target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary"><Download className="w-3 h-3 mr-1" /> Download</Button>
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AgentLayout>
  );
}
