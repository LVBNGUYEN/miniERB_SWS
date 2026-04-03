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

  async logHours(taskId: string, hours: number, vendorId: string, snapshotPrice: number, notes?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const timesheet = queryRunner.manager.create(Timesheet, {
        taskId,
        userId: vendorId,
        loggedHours: Number(hours),
        logDate: new Date(),
        snapshotPrice: Number(snapshotPrice),
        snapshotBillablePrice: Number(snapshotPrice) * 1.5, // Default billable margin
        approvalStatus: 'PENDING',
        workType: 'DEVELOPMENT',
        rejectReason: notes // Reusing rejectReason as general notes field prior to rejection
      });

      const saved = await queryRunner.manager.save(Timesheet, timesheet);
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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

      if (timesheet.approvalStatus === 'APPROVED') {
        throw new BadRequestException('Timesheet is already approved');
      }

      // 1. Update Timesheet
      timesheet.approvalStatus = 'APPROVED';
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

  async rejectTimesheet(id: string, reason: string, approverId: string): Promise<Timesheet> {
    const timesheet = await this.timesheetRepository.findOne({ where: { id } });
    if (!timesheet) throw new NotFoundException('Timesheet not found');

    timesheet.approvalStatus = 'REJECTED';
    timesheet.rejectReason = reason;
    timesheet.approvedBy = approverId;

    return this.timesheetRepository.save(timesheet);
  }

  async findPending(): Promise<Timesheet[]> {
    return this.timesheetRepository.find({
      where: { approvalStatus: 'PENDING' },
      relations: ['task', 'task.project', 'user'],
      order: { logDate: 'DESC' }
    });
  }

  async clockIn(taskId: string, userId: string): Promise<Timesheet> {
    const active = await this.timesheetRepository.findOne({
      where: { userId, approvalStatus: 'IN_PROGRESS' }
    });
    if (active) throw new BadRequestException('You already have an active work session. Please clock out first.');

    const timesheet = this.timesheetRepository.create({
      taskId,
      userId,
      startTime: new Date(),
      approvalStatus: 'IN_PROGRESS',
      workType: 'DEVELOPMENT',
      logDate: new Date(),
      loggedHours: 0,
      snapshotPrice: 0, 
      snapshotBillablePrice: 0
    });

    const saved = await this.timesheetRepository.save(timesheet);
    
    // Return with relations so UI shows task title immediately
    return this.timesheetRepository.findOne({
      where: { id: saved.id },
      relations: ['task']
    }) as Promise<Timesheet>;
  }

  async clockOut(userId: string, notes?: string): Promise<Timesheet> {
    const active = await this.timesheetRepository.findOne({
      where: { userId, approvalStatus: 'IN_PROGRESS' },
      relations: ['task']
    });

    if (!active) throw new NotFoundException('No active work session found.');

    const now = new Date();
    const start = new Date(active.startTime);
    const diffMs = now.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    /* 
    if (diffHours < 0.5) {
      throw new BadRequestException('Work session must be at least 30 minutes. Current duration: ' + Math.round(diffHours * 60) + ' minutes.');
    }
    */

    active.endTime = now;
    active.loggedHours = Number(diffHours.toFixed(2));
    active.approvalStatus = 'PENDING';
    active.rejectReason = notes; // Reusing field for session notes

    // Finalize prices if possible (Assuming task or service has logic for this)
    // For now, keep as previous defaults or logic
    active.snapshotPrice = active.snapshotPrice || 100; // Placeholder
    active.snapshotBillablePrice = active.snapshotPrice * 1.5;

    return this.timesheetRepository.save(active);
  }

  async findActive(userId: string): Promise<Timesheet | null> {
    return this.timesheetRepository.findOne({
      where: { userId, approvalStatus: 'IN_PROGRESS' },
      relations: ['task']
    });
  }

  async findByUser(userId: string): Promise<Timesheet[]> {
    return this.timesheetRepository.find({
      where: { userId },
      relations: ['task'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Story 14.2: Auto-approve all pending timesheets when a Task is marked DONE (via PKI)
   */
  async approveAllForTask(taskId: string, approverId: string | null = null) {
    const pendings = await this.timesheetRepository.find({
      where: { taskId, approvalStatus: 'PENDING' }
    });

    for (const t of pendings) {
      await this.approveTimesheet(t.id, approverId as any);
    }
  }

  async cancelSession(userId: string): Promise<void> {
    const active = await this.timesheetRepository.findOne({
      where: { userId, approvalStatus: 'IN_PROGRESS' }
    });
    if (!active) throw new NotFoundException('No active work session found.');
    
    // Instead of archiving, we delete as per user request "không lưu"
    await this.timesheetRepository.softDelete(active.id);
  }
}
