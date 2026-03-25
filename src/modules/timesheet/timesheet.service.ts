import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Timesheet } from './entities/timesheet.entity';
import { Task } from '../project/entities/task.entity';
import { VendorDebt } from '../finance/entities/vendor-debt.entity';
import { SysAlertService } from '../sys-alert/services/sys-alert.service';

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(Timesheet)
    private readonly timesheetRepository: Repository<Timesheet>,
    private readonly dataSource: DataSource,
    private readonly alertService: SysAlertService,
  ) {}

  async logHours(taskId: string, hours: number, vendorId: string, snapshotPrice: number) {
    const timesheet = this.timesheetRepository.create({
      taskId,
      userId: vendorId,
      loggedHours: hours,
      logDate: new Date(),
      snapshotPrice,
      snapshotBillablePrice: snapshotPrice * 1.5, // Default billable margin
      approvalStatus: 'PENDING',
      workType: 'DEVELOPMENT'
    });

    return this.timesheetRepository.save(timesheet);
  }

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
      let projectId: string | undefined;
      
      if (task) {
        projectId = task.projectId;
        const currentActual = Number(task.actualHours) || 0;
        const loggedHours = Number(timesheet.loggedHours) || 0;
        task.actualHours = currentActual + loggedHours;
        await queryRunner.manager.save(task);
      }

      // 3. Record Vendor Debt
      const vendorDebt = queryRunner.manager.create(VendorDebt, {
        timesheetId: timesheet.id,
        vendorId: timesheet.userId,
        amount: (Number(timesheet.loggedHours) || 0) * (Number(timesheet.snapshotPrice) || 0),
        status: 'PENDING_PAYMENT',
      });
      await queryRunner.manager.save(vendorDebt);

      await queryRunner.commitTransaction();

      // 4. Trigger Alerting Check (Flow 15)
      if (projectId) {
        this.alertService.checkProjectBudget(projectId).catch(e => console.error('Alert trigger error:', e));
      }

      return timesheet;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findPending(): Promise<Timesheet[]> {
    return this.timesheetRepository.find({
      where: { approvalStatus: 'PENDING' },
      relations: ['task'],
      order: { logDate: 'DESC' }
    });
  }

  async findByUser(userId: string): Promise<Timesheet[]> {
    return this.timesheetRepository.find({
      where: { userId },
      relations: ['task'],
      order: { logDate: 'DESC' }
    });
  }
}
