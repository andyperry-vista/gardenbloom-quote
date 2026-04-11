import type { Quote } from "@/types/quote";

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

export async function generateQuotePdf(quote: Quote) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 0;

  const logoDataUrl = await loadLogoDataUrl();

  // Header bar
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pw, 40, "F");

  // Horizontal logo (aspect ratio ~4.27:1)
  doc.addImage(logoDataUrl, "PNG", margin, 6, 65, 15);

  // Contact details in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Nicholas  •  0413 806 551  •  nicholas@mayuragardenservices.com.au", margin, 27);

  // Quote number & date on right
  doc.setFontSize(10);
  doc.text(`Quote #${quote.id.slice(-6)}`, pw - margin, 18, { align: "right" });
  doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString("en-AU")}`, pw - margin, 24, { align: "right" });

  y = 48;

  // QUOTATION heading
  doc.setTextColor(...BRAND_GREEN);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", margin, y);
  y += 10;

  // Gold divider
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // Prepared For
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.text("PREPARED FOR", margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(quote.client.name || "—", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  if (quote.client.address) { doc.text(quote.client.address, margin, y); y += 4; }
  if (quote.client.email) { doc.text(quote.client.email, margin, y); y += 4; }
  if (quote.client.phone) { doc.text(quote.client.phone, margin, y); y += 4; }

  y += 6;

  // Line items table header
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", margin, y);
  doc.text("QTY", 115, y, { align: "right" });
  doc.text("UNIT PRICE", 145, y, { align: "right" });
  doc.text("TOTAL", pw - margin, y, { align: "right" });
  y += 5;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pw - margin, y);
  y += 4;

  // Line items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const item of quote.items) {
    const clientPrice = item.unitCost * (1 + item.markupPercent / 100);
    const desc = item.type === "labor" ? `${item.description} (per hour)` : item.description;
    doc.setTextColor(0, 0, 0);
    doc.text(desc, margin, y, { maxWidth: 80 });
    doc.text(String(item.quantity), 115, y, { align: "right" });
    doc.text(`$${clientPrice.toFixed(2)}`, 145, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`$${item.total.toFixed(2)}`, pw - margin, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 6;
  }

  y += 2;
  doc.setDrawColor(...BRAND_GOLD);
  doc.line(margin, y, pw - margin, y);
  y += 6;

  // Totals
  const drawRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(bold ? 0 : 80, bold ? 0 : 80, bold ? 0 : 80);
    doc.text(label, 120, y);
    doc.text(value, pw - margin, y, { align: "right" });
    y += 6;
  };

  drawRow("Subtotal", `$${quote.grandTotal.toFixed(2)}`);
  drawRow("GST", "Included");
  doc.setDrawColor(...BRAND_GOLD);
  doc.line(120, y, pw - margin, y);
  y += 6;
  drawRow("Total (incl. GST)", `$${quote.grandTotal.toFixed(2)}`, true);

  // Notes
  if (quote.notes) {
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text("NOTES", margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(quote.notes, margin, y, { maxWidth: pw - margin * 2 });
  }

  // Validity
  y += 14;
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("This quote is valid for 30 days from the date of issue.", margin, y);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pw - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text("Mayura Garden Services • Lower Templestowe, VIC • ABN: 22 046 912 532", pw / 2, footerY, { align: "center" });

  doc.save(`Quote-${quote.id.slice(-6)}.pdf`);
}
