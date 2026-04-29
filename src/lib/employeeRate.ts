import type { Employee } from "@/hooks/useEmployees";

/**
 * Returns the effective hourly rate for an employee.
 * - Hourly: uses hourlyRate directly
 * - Salary: annualSalary / (standardHoursPerWeek * 52)
 */
export function effectiveHourlyRate(e: Pick<Employee, "payBasis" | "hourlyRate" | "annualSalary" | "standardHoursPerWeek">): number {
  if (e.payBasis === "salary") {
    const hpw = e.standardHoursPerWeek > 0 ? e.standardHoursPerWeek : 38;
    const annual = e.annualSalary || 0;
    return annual > 0 ? annual / (hpw * 52) : 0;
  }
  return e.hourlyRate || 0;
}

export interface PayrollDefaults {
  defaultPayBasis: "hourly" | "salary";
  defaultHourlyRate: number;
  defaultAnnualSalary: number;
  defaultStandardHoursPerWeek: number;
  defaultSuperRate: number;
}

export const DEFAULT_PAYROLL_DEFAULTS: PayrollDefaults = {
  defaultPayBasis: "hourly",
  defaultHourlyRate: 35,
  defaultAnnualSalary: 0,
  defaultStandardHoursPerWeek: 38,
  defaultSuperRate: 11.5,
};
