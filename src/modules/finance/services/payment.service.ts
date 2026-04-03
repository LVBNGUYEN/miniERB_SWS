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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repository = queryRunner.manager.getRepository(VendorDebt);
      const debt = await repository.findOne({ where: { id: debtId } });
      if (!debt) throw new NotFoundException('Debt not found');
      
      await repository.update(debtId, { status: 'PAID' });
      const updated = await repository.findOne({ where: { id: debtId } });

      await queryRunner.commitTransaction();
      return updated!;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getVendorDebtSummary() {
    return this.dataSource.getRepository(VendorDebt)
      .createQueryBuilder('debt')
      .innerJoin('iam_users', 'vendor', 'vendor.id = debt.vendorId AND vendor.deletedAt IS NULL')
      .select('vendor.fullName', 'vendorName')
      .addSelect('vendor.id', 'vendorId')
      .addSelect('COALESCE(SUM(debt.amount), 0)', 'totalOwed')
      .addSelect('COUNT(debt.id)', 'debtRecordCount')
      .where('debt.status = :status', { status: 'PENDING_PAYMENT' })
      .andWhere('debt.deletedAt IS NULL')
      .groupBy('vendor.id')
      .addGroupBy('vendor.fullName')
      .getRawMany();
  }

  async getVendorEarnings(vendorId: string) {
    const data: any = await this.dataSource.getRepository(VendorDebt)
      .createQueryBuilder('debt')
      .select('SUM(CASE WHEN debt.status = \'PAID\' THEN debt.amount ELSE 0 END)', 'paid')
      .addSelect('SUM(CASE WHEN debt.status = \'PENDING_PAYMENT\' THEN debt.amount ELSE 0 END)', 'pending')
      .addSelect('COUNT(debt.id)', 'totalTasks')
      .where('debt.vendorId = :vendorId', { vendorId })
      .andWhere('debt.deletedAt IS NULL')
      .getRawOne();

    return {
      totalPaid: Number(data.paid || 0),
      pendingPayment: Number(data.pending || 0),
      totalTasks: Number(data.totalTasks || 0),
    };
  }
}
