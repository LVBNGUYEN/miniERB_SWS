import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Project } from '../../project/entities/project.entity';
import { Branch } from '../../system/entities/branch.entity';

@Entity('fin_invoices')
export class Invoice extends AbstractEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'invoice_number', unique: true, length: 100 })
  invoiceNumber: string;

  @Column({ name: 'subtotal_amount', type: 'decimal', precision: 15, scale: 2 })
  subtotalAmount: number;

  @Column({ name: 'vat_amount', type: 'decimal', precision: 15, scale: 2 })
  vatAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  contractId: string;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ name: 'pki_payment_signature', type: 'text', nullable: true })
  pkiPaymentSignature: string;

  @Column({ length: 50 })
  status: string;
}
