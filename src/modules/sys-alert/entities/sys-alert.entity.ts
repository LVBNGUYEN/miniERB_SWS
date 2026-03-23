import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Project } from '../../project/entities/project.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('sys_alerts')
export class SysAlert extends AbstractEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 50 })
  type: string; // 'BUDGET_EXCEEDED_80', 'DEADLINE_APPROACHING'

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;
}
