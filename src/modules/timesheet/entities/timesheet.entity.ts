import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Task } from '../../project/entities/task.entity';
import { User } from '../../iam/entities/user.entity';
import { Invoice } from '../../finance/entities/invoice.entity';

@Entity('tms_timesheets')
export class Timesheet extends AbstractEntity {
  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'log_date', type: 'date' })
  logDate: Date;

  @Column({ name: 'logged_hours', type: 'decimal', precision: 5, scale: 2 })
  loggedHours: number;

  @Column({ name: 'work_type', length: 50 })
  workType: string;

  @Column({ name: 'snapshot_price', type: 'decimal', precision: 15, scale: 2 })
  snapshotPrice: number;

  @Column({ name: 'snapshot_billable_price', type: 'decimal', precision: 15, scale: 2 })
  snapshotBillablePrice: number;

  @Column({ name: 'approval_status', length: 50 })
  approvalStatus: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId: string;

  @ManyToOne(() => Invoice, { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
