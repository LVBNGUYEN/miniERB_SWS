import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { VendorDebt } from '../entities/vendor-debt.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}

  async registerClientPayment(invoiceId: string, amount: number, reference: string): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await queryRunner.manager.findOne(Invoice, {
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status === 'PAID') {
        throw new BadRequestException('Invoice is already paid');
      }

      const payment = queryRunner.manager.create(Payment, {
        invoiceId,
        paidAmount: Number(amount),
        paymentDate: new Date(),
        paymentMethod: 'TRANSFER',
        referenceCode: reference || `PYM-${Date.now()}`,
      });

      await queryRunner.manager.save(payment);

      // Simple Logic: if amount >= invoice.total, set to PAID
      // For partial payments, we could use more logic
      if (Number(amount) >= Number(invoice.totalAmount)) {
        await queryRunner.manager.update(Invoice, invoiceId, { status: 'PAID' });
      }

      await queryRunner.commitTransaction();
      return payment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async payVendorDebt(debtId: string): Promise<VendorDebt> {
    const debt = await this.dataSource.getRepository(VendorDebt).findOne({ where: { id: debtId } });
    if (!debt) throw new NotFoundException('Debt not found');
    
    await this.dataSource.getRepository(VendorDebt).update(debtId, { status: 'PAID' });
    return this.dataSource.getRepository(VendorDebt).findOne({ where: { id: debtId } });
  }
}
