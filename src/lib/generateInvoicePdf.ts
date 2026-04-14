import type { Invoice, Payment } from "@/hooks/useInvoices";

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

export async function generateInvoicePdf(invoice: Invoice, payments: Payment[]) {
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

  // Invoice number & date — right side
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, pw - margin, 18, { align: "right" });
  doc.text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString("en-AU")}`, pw - margin, 24, { align: "right" });
  if (invoice.dueDate) {
    doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString("en-AU")}`, pw - margin, 30, { align: "right" });
  }

  y = 48;

  // TAX INVOICE heading
  doc.setTextColor(...BRAND_GREEN);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", margin, y);
  y += 10;

  // Gold divider
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // Bill To
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.text("BILL TO", margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.client?.name ?? "—", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  if (invoice.client?.address) { doc.text(invoice.client.address, margin, y); y += 4; }
  if (invoice.client?.email) { doc.text(invoice.client.email, margin, y); y += 4; }
  if (invoice.client?.phone) { doc.text(invoice.client.phone, margin, y); y += 4; }

  // Job ref on right
  if (invoice.job?.job_number) {
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text("JOB REFERENCE", pw - margin - 50, 68);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.job.job_number, pw - margin - 50, 73);
  }

  y += 6;

  // Amount table
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 6;

  const drawRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(bold ? 0 : 80, bold ? 0 : 80, bold ? 0 : 80);
    doc.text(label, margin, y);
    doc.text(value, pw - margin, y, { align: "right" });
    y += 6;
  };

  drawRow("Subtotal (ex GST)", `$${invoice.amount.toFixed(2)}`);
  drawRow("GST (10%)", `$${invoice.gstAmount.toFixed(2)}`);

  doc.setDrawColor(...BRAND_GOLD);
  doc.line(margin, y, pw - margin, y);
  y += 6;

  drawRow("Total (incl. GST)", `$${invoice.totalWithGst.toFixed(2)}`, true);

  y += 4;

  // Payments section
  if (payments.length > 0) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pw - margin, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text("PAYMENTS RECEIVED", margin, y);
    y += 5;

    for (const p of payments) {
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`${new Date(p.paymentDate).toLocaleDateString("en-AU")} — ${p.paymentMethod || "Payment"}`, margin, y);
      doc.text(`$${p.amount.toFixed(2)}`, pw - margin, y, { align: "right" });
      y += 5;
    }

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const remaining = invoice.totalWithGst - totalPaid;
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pw - margin, y);
    y += 6;
    drawRow("Amount Paid", `$${totalPaid.toFixed(2)}`);
    drawRow("Balance Due", `$${remaining.toFixed(2)}`, true);
  }

  y += 10;

  // Payment terms
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "normal");
  doc.text("Payment is due within 14 days of the invoice date.", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_GREEN);
  doc.text("Bank Transfer Details", margin, y);
  y += 4;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0); // Black for readability
  doc.text("Account Name: Nicholas Dipietro", margin, y);
  y += 4;
  doc.text("BSB: 013148", margin, y);
  y += 4;
  doc.text("Account Number: 183858375", margin, y);
  y += 10;

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pw - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text("Mayura Garden Services • Lower Templestowe, VIC • ABN: 22 046 912 532", pw / 2, footerY, { align: "center" });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
