import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Timesheet } from '../../timesheet/entities/timesheet.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('fin_vendor_debts')
export class VendorDebt extends AbstractEntity {
  @Column({ name: 'timesheet_id', type: 'uuid' })
  timesheetId: string;

  @OneToOne(() => Timesheet)
  @JoinColumn({ name: 'timesheet_id' })
  timesheet: Timesheet;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'vendor_id' })
  vendor: User;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 50, default: 'PENDING_PAYMENT' })
  status: string;
}
