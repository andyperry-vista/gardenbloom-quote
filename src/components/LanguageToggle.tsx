import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLocale(locale === "en" ? "zh" : "en")}
        className="gap-2 bg-background/80 backdrop-blur-sm border-foreground/20 text-foreground hover:bg-foreground/10"
      >
        <Globe className="w-4 h-4" />
        {locale === "en" ? "中文" : "English"}
      </Button>
    </div>
  );
}
