import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Branch } from '../../system/entities/branch.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('sls_quotations')
export class Quotation extends AbstractEntity {
  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'pm_id', type: 'uuid' })
  pmId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'pm_id' })
  pm: User;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'total_estimated_hours', type: 'decimal', precision: 10, scale: 2 })
  totalEstimatedHours: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ length: 50 })
  status: string;

  @Column({ name: 'valid_until', type: 'date' })
  validUntil: Date;

  @Column({ name: 'file_url', length: 255, nullable: true })
  fileUrl: string;
}
