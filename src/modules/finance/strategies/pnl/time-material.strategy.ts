import { Injectable } from '@nestjs/common';
import { IPnLCalculationStrategy } from './pnl.strategy.interface';

@Injectable()
export class TimeAndMaterialPnLStrategy implements IPnLCalculationStrategy {
  calculate(
    revenueUnused: number, 
    loggedHours: number, 
    billableRate: number, 
    vendorCosts: number, 
    internalHourlyCost: number
  ): number {
    const revenueGenerated = loggedHours * billableRate;
    const internalCosts = loggedHours * internalHourlyCost;
    return revenueGenerated - internalCosts - vendorCosts;
  }
}
