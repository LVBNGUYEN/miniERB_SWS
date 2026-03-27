import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timesheet } from '../entities/timesheet.entity';
import { Task } from '../entities/task.entity';
import { CreateTimesheetDto } from '../dto/timesheet.dto';
import { SysAuditService } from '../../sys-audit/sys-audit.service';
import { TimesheetStatus } from '../entities/timesheet-status.enum';

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(Timesheet)
    private readonly timesheetRepository: Repository<Timesheet>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly sysAuditService: SysAuditService,
  ) {}

  async submitLog(createDto: CreateTimesheetDto, vendorId: string): Promise<Timesheet> {
    const task = await this.taskRepository.findOne({ where: { id: createDto.taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // IDOR Protection: Vendor KHÔNG THỂ tạo Timesheet cho Task của người khác
    if (task.assigneeId !== vendorId) {
      throw new ForbiddenException('Bạn không có quyền log giờ cho Task của người khác.');
    }

    const timesheet = this.timesheetRepository.create({
      ...createDto,
      vendorId,
      status: TimesheetStatus.PENDING,
    });

    const savedTimesheet = await this.timesheetRepository.save(timesheet);

    // Patch 2: Sử dụng Atomic Increment để chặn Race Condition (Lost Update)
    await this.taskRepository.increment(
      { id: task.id }, 
      'actualHours', 
      Number(createDto.hours)
    );

    // Cập nhật lại đối tượng task trong bộ nhớ nếu cần dùng phía sau (ở đây log dùng audit nên không bắt buộc)
    // Nhưng để nhất quán state, ta có thể fetch lại hoặc tự bump
    task.actualHours = Number(task.actualHours || 0) + Number(createDto.hours);

    // Ghi vết thời gian nộp Report của Vendor
    await this.sysAuditService.createLog({
      userId: vendorId,
      action: 'CREATE',
      tableName: 'prj_timesheets',
      recordId: savedTimesheet.id,
      oldValue: null,
      newValue: savedTimesheet,
    });

    // Patch 3: Mock Notification Fire Event
    console.log(`[NOTIFICATION_EMITTER] -> PM của Project [${task.projectId}]: Vendor (${vendorId}) vừa nộp Timesheet ${createDto.hours} giờ cho Task "${task.title}". Vui lòng vào kiểm duyệt (Approve/Reject).`);

    return savedTimesheet;
  }

  async findMyLogs(vendorId: string): Promise<Timesheet[]> {
    return this.timesheetRepository.find({
      where: { vendorId },
      relations: ['task'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }
}
