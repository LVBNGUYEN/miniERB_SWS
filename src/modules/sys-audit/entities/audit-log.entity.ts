import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('sys_audit_logs')
export class AuditLog extends AbstractEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'actor_type', length: 20 })
  actorType: string;

  @Column({ length: 50 })
  action: string;

  @Column({ name: 'table_name', length: 50 })
  tableName: string;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId: string;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: any;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: any;
}
