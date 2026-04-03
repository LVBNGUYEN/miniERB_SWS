import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Project } from './project.entity';
import { User } from '../../iam/entities/user.entity';

export enum TaskRequestStatus {
  PROPOSED = 'PROPOSED',
  ESTIMATING = 'ESTIMATING',
  ESTIMATED = 'ESTIMATED',
  PRICED = 'PRICED',
  CLIENT_SIGNED = 'CLIENT_SIGNED',
  CEO_SIGNED = 'CEO_SIGNED',
  DISTRIBUTED = 'DISTRIBUTED',
  REJECTED = 'REJECTED',
}

@Entity('prj_task_requests')
export class TaskRequest extends AbstractEntity {
  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'pm_id', type: 'uuid', nullable: true })
  pmId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'pm_id' })
  pm: User;

  @Column({ name: 'sale_id', type: 'uuid', nullable: true })
  saleId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sale_id' })
  sale: User;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'estimated_hours', type: 'decimal', precision: 8, scale: 2, nullable: true })
  estimatedHours: number;

  @Column({ name: 'final_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  finalPrice: number;

  @Column({
    type: 'enum',
    enum: TaskRequestStatus,
    default: TaskRequestStatus.PROPOSED,
  })
  status: TaskRequestStatus;

  @Column({ type: 'jsonb', nullable: true })
  signatures: {
    pmSignature?: string;
    pmSignedAt?: Date;
    clientSignature?: string;
    clientSignedAt?: Date;
    ceoSignature?: string;
    ceoSignedAt?: Date;
  };

  @Column({ length: 50, default: 'FEATURE' })
  type: string;
}
