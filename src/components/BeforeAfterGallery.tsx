import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";

import before1 from "@/assets/gallery/before-1.jpg";
import after1 from "@/assets/gallery/after-1.jpg";
import before2 from "@/assets/gallery/before-2.jpg";
import after2 from "@/assets/gallery/after-2.jpg";
import before3 from "@/assets/gallery/before-3.jpg";
import after3 from "@/assets/gallery/after-3.jpg";

const projects: { before: string; after: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { before: before1, after: after1, titleKey: "galleryProject1Title", descKey: "galleryProject1Desc" },
  { before: before2, after: after2, titleKey: "galleryProject2Title", descKey: "galleryProject2Desc" },
  { before: before3, after: after3, titleKey: "galleryProject3Title", descKey: "galleryProject3Desc" },
];

export default function BeforeAfterGallery() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  return (
    <section className="bg-muted/50 py-16">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-2">{t("galleryTitle")}</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
          {t("gallerySubtitle")}
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {projects.map((project, i) => (
            <Card key={i} className="overflow-hidden group">
              <div
                className="relative aspect-[3/2] overflow-hidden cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(hoveredIndex === i ? null : i)}
              >
                <img
                  src={project.before}
                  alt={`${t(project.titleKey)} - ${t("galleryBefore")}`}
                  loading="lazy"
                  width={768}
                  height={512}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                    hoveredIndex === i ? "opacity-0" : "opacity-100"
                  )}
                />
                <img
                  src={project.after}
                  alt={`${t(project.titleKey)} - ${t("galleryAfter")}`}
                  loading="lazy"
                  width={768}
                  height={512}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                    hoveredIndex === i ? "opacity-100" : "opacity-0"
                  )}
                />
                <Badge
                  className={cn(
                    "absolute top-3 left-3 transition-colors",
                    hoveredIndex === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive text-destructive-foreground"
                  )}
                >
                  {hoveredIndex === i ? t("galleryAfter") : t("galleryBefore")}
                </Badge>
                <span className="absolute bottom-3 right-3 text-xs text-primary-foreground/70 bg-background/40 backdrop-blur-sm rounded px-2 py-1">
                  {t("galleryHoverHint")}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{t(project.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(project.descKey)}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
