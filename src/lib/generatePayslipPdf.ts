import type { Payslip } from "@/hooks/usePayroll";
import type { Employee } from "@/hooks/useEmployees";

const BRAND_GREEN = [5, 42, 29] as const;
const BRAND_GOLD = [191, 163, 88] as const;

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

const fmt = (n: number) =>
  n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-AU") : "—";

export async function generatePayslipPdf(payslip: Payslip, employee: Employee) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 0;

  const logo = await loadLogoDataUrl();

  // Header
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pw, 40, "F");
  doc.addImage(logo, "PNG", margin, 6, 65, 15);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text("Mayura Garden Services  •  ABN 22 046 912 532", margin, 27);

  doc.setFontSize(10);
  doc.text(payslip.payslipNumber, pw - margin, 18, { align: "right" });
  doc.text(`Issued: ${fmtDate(payslip.issuedAt ?? payslip.createdAt)}`, pw - margin, 24, { align: "right" });

  y = 50;

  doc.setTextColor(...BRAND_GREEN);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PAYSLIP", margin, y);
  y += 8;

  doc.setDrawColor(...BRAND_GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // Employee + period block
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const colR = pw / 2 + 5;
  doc.setFont("helvetica", "bold");
  doc.text("Employee", margin, y);
  doc.text("Pay Period", colR, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.text(employee.name, margin, y);
  doc.text(`${fmtDate(payslip.periodStart)} – ${fmtDate(payslip.periodEnd)}`, colR, y);
  y += 5;
  if (employee.address) {
    doc.text(employee.address, margin, y);
    y += 5;
  }
  if (employee.email) {
    doc.text(employee.email, margin, y);
    y += 5;
  }
  y += 4;

  // Earnings table
  doc.setFillColor(...BRAND_GREEN);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.rect(margin, y, pw - margin * 2, 7, "F");
  doc.text("Description", margin + 2, y + 5);
  doc.text("Hours", margin + 95, y + 5, { align: "right" });
  doc.text("Rate", margin + 125, y + 5, { align: "right" });
  doc.text("Amount", pw - margin - 2, y + 5, { align: "right" });
  y += 7;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  const lines = payslip.lines ?? [];
  if (lines.length === 0) {
    doc.text("Hours worked", margin + 2, y + 5);
    doc.text(payslip.hoursTotal.toFixed(2), margin + 95, y + 5, { align: "right" });
    doc.text(`$${fmt(payslip.hoursTotal > 0 ? payslip.gross / payslip.hoursTotal : 0)}`, margin + 125, y + 5, { align: "right" });
    doc.text(`$${fmt(payslip.gross)}`, pw - margin - 2, y + 5, { align: "right" });
    y += 7;
  } else {
    for (const l of lines) {
      doc.text(l.description.slice(0, 60), margin + 2, y + 5);
      doc.text(l.hours.toFixed(2), margin + 95, y + 5, { align: "right" });
      doc.text(`$${fmt(l.rate)}`, margin + 125, y + 5, { align: "right" });
      doc.text(`$${fmt(l.amount)}`, pw - margin - 2, y + 5, { align: "right" });
      y += 6;
    }
  }

  y += 4;
  doc.setDrawColor(...BRAND_GOLD);
  doc.line(margin, y, pw - margin, y);
  y += 6;

  // Totals
  doc.setFont("helvetica", "bold");
  doc.text("Gross Pay", margin + 95, y, { align: "right" });
  doc.text(`$${fmt(payslip.gross)}`, pw - margin - 2, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Less: PAYG Tax Withheld", margin + 95, y, { align: "right" });
  doc.text(`-$${fmt(payslip.taxWithheld)}`, pw - margin - 2, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_GREEN);
  doc.text("Net Pay", margin + 95, y, { align: "right" });
  doc.text(`$${fmt(payslip.net)}`, pw - margin - 2, y, { align: "right" });
  y += 10;

  // Super
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Superannuation", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Super (${employee.superRate}%):`, margin, y);
  doc.text(`$${fmt(payslip.superAmount)}`, pw - margin - 2, y, { align: "right" });
  y += 5;
  if (employee.superFund) {
    doc.text(`Fund: ${employee.superFund}`, margin, y);
    y += 5;
  }
  if (employee.superMemberNumber) {
    doc.text(`Member #: ${employee.superMemberNumber}`, margin, y);
    y += 5;
  }
  y += 5;

  // Payment details
  if (employee.bsb || employee.accountNumber) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Payment Details", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (employee.bsb) {
      doc.text(`BSB: ${employee.bsb}`, margin, y);
      y += 5;
    }
    if (employee.accountNumber) {
      doc.text(`Account: ${employee.accountNumber}`, margin, y);
      y += 5;
    }
    y += 4;
  }

  // YTD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Year-to-Date", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Gross", margin, y);
  doc.text(`$${fmt(payslip.ytdGross)}`, margin + 50, y, { align: "right" });
  doc.text("Tax", margin + 70, y);
  doc.text(`$${fmt(payslip.ytdTax)}`, margin + 110, y, { align: "right" });
  doc.text("Super", margin + 130, y);
  doc.text(`$${fmt(payslip.ytdSuper)}`, pw - margin - 2, y, { align: "right" });

  // Footer
  const ph = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Mayura Garden Services  •  ABN 22 046 912 532  •  This is an indicative payslip. PAYG figures are estimates.", pw / 2, ph - 8, { align: "center" });

  doc.save(`${payslip.payslipNumber}-${employee.name.replace(/\s+/g, "_")}.pdf`);
}
