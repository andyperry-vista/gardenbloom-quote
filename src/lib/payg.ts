// Simplified ATO weekly PAYG estimate (2024-25, no tax-free threshold flag = with TFT claimed).
// This is an approximation suitable for indicative payslips; not a substitute for accountant calculations.
// Brackets are annual thresholds converted to weekly equivalents.
// Source: ATO individual income tax rates 2024-25 (resident, with tax-free threshold).
//   $0 – $18,200       0%
//   $18,201 – $45,000  16% over $18,200
//   $45,001 – $135,000 $4,288 + 30% over $45,000
//   $135,001 – $190,000 $31,288 + 37% over $135,000
//   $190,001+          $51,638 + 45% over $190,000

export type PayPeriod = "weekly" | "fortnightly" | "monthly";

const PERIODS_PER_YEAR: Record<PayPeriod, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

export function estimatePAYG(grossForPeriod: number, period: PayPeriod = "weekly", claimTaxFreeThreshold = true): number {
  if (grossForPeriod <= 0) return 0;
  const periods = PERIODS_PER_YEAR[period];
  const annualised = grossForPeriod * periods;

  let annualTax: number;
  if (!claimTaxFreeThreshold) {
    // No tax-free threshold: 16% from $0 (simplified — actual NAT 1004 column 3 is more complex)
    if (annualised <= 45000) annualTax = annualised * 0.16;
    else if (annualised <= 135000) annualTax = 45000 * 0.16 + (annualised - 45000) * 0.30;
    else if (annualised <= 190000) annualTax = 45000 * 0.16 + 90000 * 0.30 + (annualised - 135000) * 0.37;
    else annualTax = 45000 * 0.16 + 90000 * 0.30 + 55000 * 0.37 + (annualised - 190000) * 0.45;
  } else {
    if (annualised <= 18200) annualTax = 0;
    else if (annualised <= 45000) annualTax = (annualised - 18200) * 0.16;
    else if (annualised <= 135000) annualTax = 4288 + (annualised - 45000) * 0.30;
    else if (annualised <= 190000) annualTax = 31288 + (annualised - 135000) * 0.37;
    else annualTax = 51638 + (annualised - 190000) * 0.45;
  }

  const perPeriod = annualTax / periods;
  // Round up to nearest dollar (ATO convention)
  return Math.max(0, Math.ceil(perPeriod));
}

export function inferPayPeriod(periodStart: string, periodEnd: string): PayPeriod {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (days <= 8) return "weekly";
  if (days <= 16) return "fortnightly";
  return "monthly";
}
