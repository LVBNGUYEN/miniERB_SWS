import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Timesheet } from './entities/timesheet.entity';
import { Task } from '../project/entities/task.entity';
import { VendorDebt } from '../finance/entities/vendor-debt.entity';

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(Timesheet)
    private readonly timesheetRepository: Repository<Timesheet>,
    private readonly dataSource: DataSource,
  ) {}

  async approveTimesheet(id: string, approverId: string): Promise<Timesheet> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const timesheet = await queryRunner.manager.findOne(Timesheet, {
        where: { id },
        relations: ['task'],
      });

      if (!timesheet) {
        throw new NotFoundException('Timesheet not found');
      }

      if (timesheet.approvalStatus === 'Approved') {
        throw new BadRequestException('Timesheet is already approved');
      }

      // 1. Update Timesheet
      timesheet.approvalStatus = 'Approved';
      timesheet.approvedBy = approverId;
      await queryRunner.manager.save(timesheet);

      // 2. Update Task actual hours
      const task = timesheet.task;
      if (task) {
        // Convert to number explicitly if decimal comes back as string
        const currentActual = Number(task.actualHours) || 0;
        const loggedHours = Number(timesheet.loggedHours) || 0;
        task.actualHours = currentActual + loggedHours;
        await queryRunner.manager.save(task);
      }

      // 3. Record Vendor Debt
      const vendorDebt = queryRunner.manager.create(VendorDebt, {
        timesheetId: timesheet.id,
        vendorId: timesheet.userId, // Assuming the user who logged is the vendor/provider
        amount: (Number(timesheet.loggedHours) || 0) * (Number(timesheet.snapshotPrice) || 0),
        status: 'PENDING_PAYMENT',
      });
      await queryRunner.manager.save(vendorDebt);

      await queryRunner.commitTransaction();
      return timesheet;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
