import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Quotation } from '../../sales/entities/quotation.entity';
import { Contract } from '../../sales/entities/contract.entity';
import { Branch } from '../../system/entities/branch.entity';
import { User } from '../../iam/entities/user.entity';
import { Task } from './task.entity';

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

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, default: 'PENDING' })
  status: string;

  @Column({ name: 'is_alerted_80', default: false })
  isAlerted80: boolean;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];
}
