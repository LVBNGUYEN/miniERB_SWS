import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Quotation } from './quotation.entity';

@Entity('sls_contracts')
export class Contract extends AbstractEntity {
  @Column({ name: 'quotation_id', type: 'uuid' })
  quotationId: string;

  @ManyToOne(() => Quotation)
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column({ name: 'contract_number', unique: true, length: 100 })
  contractNumber: string;

  @Column({ name: 'file_url', length: 255 })
  fileUrl: string;

  @Column({ name: 'document_hash', length: 255 })
  documentHash: string;

  @Column({ length: 50 })
  status: string;
}
