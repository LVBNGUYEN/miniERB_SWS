export interface IPnLCalculationStrategy {
  calculate(revenue: number, loggedHours: number, hourlyRate: number, vendorCosts: number, internalCost?: number): number;
}
