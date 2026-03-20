import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Project } from './project.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('prj_tasks')
export class Task extends AbstractEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 50, default: 'TODO' })
  status: string;

  @Column({ name: 'estimated_hours', type: 'decimal', precision: 8, scale: 2, nullable: true })
  estimatedHours: number;

  @Column({ name: 'risk_buffer_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  riskBufferPercent: number;

  @Column({ name: 'rejection_count', type: 'int', default: 0 })
  rejectionCount: number;

  @Column({ name: 'actual_hours', type: 'decimal', precision: 8, scale: 2, default: 0 })
  actualHours: number;
}
