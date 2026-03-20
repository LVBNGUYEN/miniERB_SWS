import { Injectable } from '@nestjs/common';
import { IVendorPaymentStrategy } from './payment.strategy.interface';

@Injectable()
export class MonthlyRetainerPaymentStrategy implements IVendorPaymentStrategy {
  calculatePayment(monthlyFee: number): number {
    return monthlyFee;
  }

  shouldPayNow(currentDate: Date): boolean {
    // Assuming payment is due at the end of the month or 1st of next month
    // Basic implementation: check if it's the 1st of the month
    return currentDate.getDate() === 1;
  }
}
