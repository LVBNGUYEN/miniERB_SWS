import { Injectable } from '@nestjs/common';
import { IVendorPaymentStrategy } from './payment.strategy.interface';

@Injectable()
export class MilestonePaymentStrategy implements IVendorPaymentStrategy {
  calculatePayment(contractValue: number, milestonePercentage: number): number {
    return contractValue * (milestonePercentage / 100);
  }

  shouldPayNow(currentDate: Date, expectedMilestoneDate?: Date): boolean {
    if (!expectedMilestoneDate) return false;
    return currentDate >= expectedMilestoneDate;
  }
}
