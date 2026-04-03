import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Project } from '../entities/project.entity';
import { Timesheet } from '../../timesheet/entities/timesheet.entity';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';
import { SysAuditService } from '../../sys-audit/sys-audit.service';
import { TaskStatus } from '../entities/task-status.enum';

import { TimesheetService } from '../../timesheet/timesheet.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Timesheet)
    private readonly timesheetRepository: Repository<Timesheet>,
    private readonly sysAuditService: SysAuditService,
    private readonly timesheetService: TimesheetService,
  ) {}

  async create(createDto: CreateTaskDto, userId: string): Promise<any> {
    const task = this.taskRepository.create({
      ...createDto,
      status: TaskStatus.TODO,
    });
    const saved = await this.taskRepository.save(task);

    await this.sysAuditService.createLog({
      userId,
      action: 'CREATE',
      tableName: 'prj_tasks',
      recordId: saved.id,
      oldValue: null,
      newValue: saved,
    });

    // ── 80% Budget Alert Check ──
    let budgetWarning: string | null = null;
    if (createDto.projectId) {
      const project = await this.projectRepository.findOne({ where: { id: createDto.projectId } });
      if (project && project.totalEstimatedHours > 0) {
        const { sum } = await this.taskRepository
          .createQueryBuilder('t')
          .select('COALESCE(SUM(t.estimated_hours), 0)', 'sum')
          .where('t.project_id = :pid AND t.deleted_at IS NULL', { pid: project.id })
          .getRawOne();

        const allocatedHours = Number(sum || 0);
        const usagePercent = (allocatedHours / Number(project.totalEstimatedHours)) * 100;

        if (usagePercent >= 80 && !project.isAlerted80) {
          project.isAlerted80 = true;
          await this.projectRepository.save(project);

          await this.sysAuditService.createLog({
            userId,
            action: 'BUDGET_ALERT_80',
            tableName: 'prj_projects',
            recordId: project.id,
            oldValue: { isAlerted80: false },
            newValue: { isAlerted80: true, allocatedHours, totalEstimatedHours: project.totalEstimatedHours, usagePercent: usagePercent.toFixed(1) },
          });

          budgetWarning = `Cảnh báo: Đã sử dụng ${usagePercent.toFixed(1)}% ngân sách thời gian dự án (${allocatedHours}h / ${project.totalEstimatedHours}h)`;
        } else if (usagePercent >= 80) {
          budgetWarning = `Lưu ý: Đã sử dụng ${usagePercent.toFixed(1)}% ngân sách thời gian dự án (${allocatedHours}h / ${project.totalEstimatedHours}h)`;
        }
      }
    }

    return { ...saved, budgetWarning };
  }

  async findAll(user: any, projectId?: string): Promise<Task[]> {
    const userId = user.id || user.userId || user.sub;
    const query = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.deletedAt IS NULL');

    if (user.role === 'VENDOR' || user.role === 'DEV') {
      query.andWhere('task.assigneeId = :userId', { userId });
    }

    if (projectId) {
      query.andWhere('task.projectId = :projectId', { projectId });
    }

    query.orderBy('task.createdAt', 'DESC');
    
    return query.getMany();
  }

  async findOne(id: string, user?: any): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignee', 'project'],
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException(`Task with ID "${id}" not found or already deleted`);
    }

    if (user) {
      const userId = user.id || user.userId || user.sub;
      if ((user.role === 'VENDOR' || user.role === 'DEV') && task.assigneeId !== userId) {
        throw new ForbiddenException('Bạn không có quyền xem chi tiết Task này.');
      }
    }

    return task;
  }

  async update(id: string, updateDto: UpdateTaskDto, user: any): Promise<Task> {
    const userId = user.id || user.userId || user.sub;
    const task = await this.findOne(id);
    const oldValue = { ...task };

    if (user.role === 'VENDOR' && task.assigneeId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật Task của người khác.');
    }

    if (task.actualHours > 0) {
      if (updateDto.assigneeId !== undefined && updateDto.assigneeId !== task.assigneeId) {
        throw new BadRequestException('Không thể thay đổi Vendor do Task đã có dữ liệu timesheet.');
      }
      if (updateDto.estimatedHours !== undefined && updateDto.estimatedHours !== task.estimatedHours) {
        throw new BadRequestException('Không thể thay đổi Estimated Hours do Task đã có dữ liệu timesheet.');
      }
    }

    if (user.role === 'VENDOR' || user.role === 'DEV') {
      if (updateDto.status !== undefined) {
        task.status = updateDto.status;
      }
    } else {
      Object.assign(task, updateDto);
    }

    // --- Story 16.5: Auto-approve and Calculate ActualHours on DONE ---
    if (task.status === TaskStatus.DONE && oldValue.status !== TaskStatus.DONE) {
      // 1. Approve all pending timesheets
      await this.timesheetService.approveAllForTask(task.id, userId);

      // 2. Recalculate total actual hours for accuracy
      const { totalHours } = await this.timesheetRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.logged_hours), 0)', 'totalHours')
        .where('t.task_id = :taskId AND t.approval_status = :status', { 
          taskId: task.id, 
          status: 'APPROVED' 
        })
        .getRawOne();
      
      task.actualHours = Number(totalHours);
    }

    const saved = await this.taskRepository.save(task);

    await this.sysAuditService.createLog({
      userId,
      action: 'UPDATE',
      tableName: 'prj_tasks',
      recordId: saved.id,
      oldValue,
      newValue: saved,
    });

    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id);
    const oldValue = { ...task };
    
    // Check if task has any timesheets. If yes, don't allow delete for data integrity
    const timesheetCount = await this.timesheetRepository.count({ where: { taskId: id } });
    if (timesheetCount > 0) {
      throw new ForbiddenException('Task này đã có dữ liệu chấm công (Timesheet), không thể xóa để bảo toàn dữ liệu lịch sử.');
    }
    
    await this.taskRepository.softDelete(id);

    await this.sysAuditService.createLog({
      userId,
      action: 'DELETE',
      tableName: 'prj_tasks',
      recordId: id,
      oldValue,
      newValue: null,
    });
  }
}
