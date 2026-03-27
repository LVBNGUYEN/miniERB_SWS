import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Branch } from '../../system/entities/branch.entity';

@Entity('iam_users')
export class User extends AbstractEntity {
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'full_name', length: 150, nullable: true })
  fullName: string;

  @Column({ length: 50 })
  role: string;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ name: 'skills', type: 'simple-array', nullable: true })
  skills: string[];

  @Column({ name: 'actor_type', length: 20, default: 'HUMAN' })
  actorType: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @Column({ name: 'login_attempts', type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  scorecard: Record<string, any> | null;
}
