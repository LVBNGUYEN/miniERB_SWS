import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';
import { SysAuditService } from '../../sys-audit/sys-audit.service';
import { TaskStatus } from '../entities/task-status.enum';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly sysAuditService: SysAuditService,
  ) {}

  async create(createDto: CreateTaskDto, userId: string): Promise<Task> {
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

    return saved;
  }

  async findAll(user: any, projectId?: string): Promise<Task[]> {
    const query = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.project', 'project');

    if (user.role === 'VENDOR') {
      query.andWhere('task.assigneeId = :userId', { userId: user.id });
    }

    if (projectId) {
      query.andWhere('task.projectId = :projectId', { projectId });
    }

    query.orderBy('task.createdAt', 'DESC');
    
    return query.getMany();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignee', 'project'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  async update(id: string, updateDto: UpdateTaskDto, user: any): Promise<Task> {
    const task = await this.findOne(id);
    const oldValue = { ...task };

    // VENDOR IDOR Protection
    if (user.role === 'VENDOR' && task.assigneeId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền cập nhật Task của người khác.');
    }

    // Strict PM Validation: Prevent updates to locked fields if vendor has started working
    if (task.actualHours > 0) {
      if (updateDto.assigneeId !== undefined && updateDto.assigneeId !== task.assigneeId) {
        throw new BadRequestException('Không thể thay đổi Vendor do Task đã có dữ liệu timesheet.');
      }
      if (updateDto.estimatedHours !== undefined && updateDto.estimatedHours !== task.estimatedHours) {
        throw new BadRequestException('Không thể thay đổi Estimated Hours do Task đã có dữ liệu timesheet.');
      }
    }

    // Field-level Protection
    if (user.role === 'VENDOR') {
      if (updateDto.status !== undefined) {
        task.status = updateDto.status;
      }
      // VENDORs cannot change anything else (like estimatedHours or assigneeId)
    } else {
      Object.assign(task, updateDto);
    }

    const saved = await this.taskRepository.save(task);

    await this.sysAuditService.createLog({
      userId: user.id,
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
    
    // Soft Delete constraint handling
    task.deletedAt = new Date();
    await this.taskRepository.save(task);

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
