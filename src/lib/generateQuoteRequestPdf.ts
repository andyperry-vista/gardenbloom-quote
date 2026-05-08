import type { QuoteRequest } from "@/hooks/useQuoteRequests";

const BRAND_GREEN = [5, 42, 29] as const;
const BRAND_GOLD = [191, 163, 88] as const;
const GREY = [100, 100, 100] as const;

async function loadLogoDataUrl(): Promise<string> {
  const { default: logoUrl } = await import("@/assets/mayura-logo-horizontal.png");
  const res = await fetch(logoUrl);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function generateQuoteRequestPdf(req: QuoteRequest) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  const logoDataUrl = await loadLogoDataUrl();

  // Header bar
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pw, 40, "F");
  doc.addImage(logoDataUrl, "PNG", margin, 6, 65, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Nicholas  •  0413 806 551  •  nicholas@mayuragardenservices.com.au", margin, 27);

  doc.setFontSize(10);
  doc.text(`Request #${req.id.slice(-6)}`, pw - margin, 18, { align: "right" });
  doc.text(`Received: ${new Date(req.createdAt).toLocaleDateString("en-AU")}`, pw - margin, 24, { align: "right" });

  y = 48;

  // Heading
  doc.setTextColor(...BRAND_GREEN);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTE REQUEST", margin, y);
  y += 10;

  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // Status pill
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "normal");
  doc.text(`Status: ${req.status.toUpperCase()}`, margin, y);
  y += 8;

  // Client details
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("FROM", margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(req.name || "—", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (req.email) { doc.text(req.email, margin, y); y += 5; }
  if (req.phone) { doc.text(req.phone, margin, y); y += 5; }
  if (req.address) {
    const lines = doc.splitTextToSize(req.address, pw - margin * 2) as string[];
    lines.forEach((line) => { doc.text(line, margin, y); y += 5; });
  }

  y += 6;

  // Message
  if (req.message) {
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text("MESSAGE", margin, y);
    y += 5;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const msgLines = doc.splitTextToSize(req.message, pw - margin * 2) as string[];
    msgLines.forEach((line) => {
      if (y > ph - 30) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  }

  // Analyzer result
  if (req.analyzerResult) {
    if (y > ph - 60) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text("AI SITE ANALYSIS", margin, y);
    y += 5;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const analysisLines = doc.splitTextToSize(req.analyzerResult, pw - margin * 2) as string[];
    analysisLines.forEach((line) => {
      if (y > ph - 30) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  }

  // Photos
  if (req.photoUrls && req.photoUrls.length > 0) {
    if (y > ph - 30) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text(`PHOTOS ATTACHED (${req.photoUrls.length})`, margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    req.photoUrls.forEach((url, i) => {
      if (y > ph - 25) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(`${i + 1}. ${url}`, pw - margin * 2) as string[];
      lines.forEach((line) => { doc.text(line, margin, y); y += 4; });
    });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pw - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text("Mayura Garden Services • Lower Templestowe, VIC • ABN: 22 046 912 532", pw / 2, footerY, { align: "center" });

  doc.save(`QuoteRequest-${req.id.slice(-6)}.pdf`);
}
