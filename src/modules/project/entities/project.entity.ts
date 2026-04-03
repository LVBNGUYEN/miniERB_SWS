import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Quotation } from '../../sales/entities/quotation.entity';
import { Contract } from '../../sales/entities/contract.entity';
import { Branch } from '../../system/entities/branch.entity';
import { User } from '../../iam/entities/user.entity';
import { Task } from './task.entity';
import { ProjectStatus } from './project-status.enum';

@Entity('prj_projects')
export class Project extends AbstractEntity {
  @Column({ name: 'quotation_id', type: 'uuid', nullable: true })
  quotationId: string;

  @ManyToOne(() => Quotation, { nullable: true })
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  contractId: string;

  @ManyToOne(() => Contract, { nullable: true })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'pm_id', type: 'uuid', nullable: true })
  pmId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'pm_id' })
  pm: User;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'estimated_budget', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEstimatedBudget: number;

  @Column({ name: 'total_estimated_hours', type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalEstimatedHours: number;

  @Column({ name: 'total_actual_hours', type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalActualHours: number;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.IN_PROGRESS })
  status: ProjectStatus;

  @Column({ name: 'is_alerted_80', default: false })
  isAlerted80: boolean;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];
}
