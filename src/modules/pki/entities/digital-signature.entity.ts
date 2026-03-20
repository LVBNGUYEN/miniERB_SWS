import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Contract } from '../../sales/entities/contract.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('sys_digital_signatures')
export class DigitalSignature extends AbstractEntity {
  @Column({ name: 'contract_id', type: 'uuid' })
  contractId: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 50 })
  provider: string;

  @Column({ name: 'cert_serial_number', length: 255 })
  certSerialNumber: string;

  @Column({ name: 'signature_value', type: 'text' })
  signatureValue: string;

  @Column({ name: 'signed_at', type: 'timestamp' })
  signedAt: Date;
}
