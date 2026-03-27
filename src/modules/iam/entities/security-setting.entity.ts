import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('iam_security_settings')
export class SecuritySetting extends AbstractEntity {
  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'ip_whitelisting', type: 'text', nullable: true, comment: 'Comma-separated IP addresses' })
  ipWhitelisting: string;

  @Column({ name: 'session_timeout', type: 'int', default: 12, comment: 'Timeout in hours' })
  sessionTimeout: number;

  @Column({ name: 'api_key_active', type: 'boolean', default: true })
  apiKeyActive: boolean;

  @Column({ name: 'last_audit_at', type: 'timestamp', nullable: true })
  lastAuditAt: Date;
}
