import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Invoice } from './invoice.entity';

@Entity('fin_payments')
export class Payment extends AbstractEntity {
  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'payment_method', length: 50 })
  paymentMethod: string;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 15, scale: 2 })
  paidAmount: number;

  @Column({ name: 'payment_date', type: 'timestamp' })
  paymentDate: Date;

  @Column({ name: 'reference_code', length: 255, nullable: true })
  referenceCode: string;
}
