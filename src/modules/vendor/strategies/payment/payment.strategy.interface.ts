export interface IVendorPaymentStrategy {
  calculatePayment(contractValue: number, variableFactor?: number): number;
  shouldPayNow(currentDate: Date, triggerDate?: Date): boolean;
}
