import { Injectable } from '@nestjs/common';
import { IPnLCalculationStrategy } from './pnl.strategy.interface';

@Injectable()
export class FixedPricePnLStrategy implements IPnLCalculationStrategy {
  calculate(
    fixedRevenue: number, 
    loggedHours: number, 
    hourlyRate: number, 
    vendorCosts: number
  ): number {
    const internalCosts = loggedHours * hourlyRate;
    return fixedRevenue - internalCosts - vendorCosts;
  }
}
