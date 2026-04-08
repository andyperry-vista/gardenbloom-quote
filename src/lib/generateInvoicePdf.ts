import type { Invoice, Payment } from "@/hooks/useInvoices";

const BRAND_GREEN = [5, 42, 29] as const; // #052A1D
const BRAND_GOLD = [191, 163, 88] as const; // approx gold from palette
const GREY = [100, 100, 100] as const;

export async function generateInvoicePdf(invoice: Invoice, payments: Payment[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 0;

  // Header bar
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pw, 40, "F");

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Mayura Garden Service", margin, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Pre-Sale Gardening • Lower Templestowe, VIC", margin, 26);

  // Invoice number & date — right side
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, pw - margin, 18, { align: "right" });
  doc.text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString("en-AU")}`, pw - margin, 24, { align: "right" });
  if (invoice.dueDate) {
    doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString("en-AU")}`, pw - margin, 30, { align: "right" });
  }

  y = 52;

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
    doc.text("JOB REFERENCE", pw - margin - 50, 60);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.job.job_number, pw - margin - 50, 65);
  }

  y += 6;

  // Amount table
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 6;

  const col1 = margin;
  const col2 = pw - margin - 40;
  const drawRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(bold ? 0 : 80, bold ? 0 : 80, bold ? 0 : 80);
    doc.text(label, col1, y);
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
  doc.text("Payment is due within 14 days of the invoice date.", margin, y);
  y += 4;
  doc.text("Please transfer to: Mayura Garden Service", margin, y);
  y += 10;

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pw - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text("Mayura Garden Service • Lower Templestowe, VIC • ABN: [Your ABN]", pw / 2, footerY, { align: "center" });

  // Save / download
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
