import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Task } from './task.entity';
import { User } from '../../iam/entities/user.entity';
import { TimesheetStatus } from './timesheet-status.enum';

@Entity('prj_timesheets')
export class Timesheet extends AbstractEntity {
  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hours: number;

  @Column({ name: 'progress_note', type: 'text', nullable: true })
  progressNote: string;

  @Column({
    type: 'enum',
    enum: TimesheetStatus,
    default: TimesheetStatus.PENDING,
  })
  status: TimesheetStatus;

  @ManyToOne(() => Task, (task) => task.timesheets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: User;
}
