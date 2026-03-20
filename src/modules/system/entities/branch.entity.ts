import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('sys_branches')
export class Branch extends AbstractEntity {
  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 10 })
  currency: string;

  @Column({ length: 50 })
  timezone: string;
}
