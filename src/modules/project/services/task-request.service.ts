import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskRequest, TaskRequestStatus } from '../entities/task-request.entity';
import { Task } from '../entities/task.entity';
import { Project } from '../entities/project.entity';
import { TaskStatus } from '../entities/task-status.enum';
import { ProjectStatus } from '../entities/project-status.enum';

@Injectable()
export class TaskRequestService {
  constructor(
    @InjectRepository(TaskRequest)
    private readonly taskRequestRepo: Repository<TaskRequest>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async createRequest(clientId: string, projectId: string, title: string, description: string, pmId?: string, saleId?: string): Promise<TaskRequest> {
    const request = this.taskRequestRepo.create({
      clientId,
      projectId,
      title,
      description,
      pmId,
      saleId,
      status: TaskRequestStatus.PROPOSED,
    });
    return this.taskRequestRepo.save(request);
  }

  async pmEstimate(requestId: string, pmId: string, hours: number, type: string, signature: string): Promise<TaskRequest> {
    const request = await this.taskRequestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    
    request.pmId = pmId;
    request.estimatedHours = hours;
    request.type = type || 'FEATURE';
    request.signatures = { 
      ...request.signatures, 
      pmSignature: signature, 
      pmSignedAt: new Date() 
    };
    request.status = TaskRequestStatus.ESTIMATED;
    
    return this.taskRequestRepo.save(request);
  }

  async pmReject(requestId: string, pmId: string): Promise<TaskRequest> {
    const request = await this.taskRequestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    
    request.status = TaskRequestStatus.REJECTED;
    return this.taskRequestRepo.save(request);
  }

  async saleSetPrice(requestId: string, saleId: string, price: number): Promise<TaskRequest> {
    const request = await this.taskRequestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    
    request.saleId = saleId;
    request.finalPrice = price;
    request.status = TaskRequestStatus.PRICED;
    
    return this.taskRequestRepo.save(request);
  }

  async clientSign(requestId: string, signature: string): Promise<TaskRequest> {
    const request = await this.taskRequestRepo.findOne({ where: { id: requestId } });
    if (!request || request.status !== TaskRequestStatus.PRICED) {
      throw new BadRequestException('Invalid status for client signature');
    }
    
    request.signatures = { 
      ...request.signatures, 
      clientSignature: signature, 
      clientSignedAt: new Date() 
    };
    request.status = TaskRequestStatus.CLIENT_SIGNED;
    
    return this.taskRequestRepo.save(request);
  }

  async ceoSign(requestId: string, ceoId: string, signature: string): Promise<TaskRequest> {
    const request = await this.taskRequestRepo.findOne({ where: { id: requestId } });
    if (!request || request.status !== TaskRequestStatus.CLIENT_SIGNED) {
      throw new BadRequestException('Invalid status for CEO signature');
    }
    
    request.signatures = { 
      ...request.signatures, 
      ceoSignature: signature, 
      ceoSignedAt: new Date() 
    };
    request.status = TaskRequestStatus.CEO_SIGNED;
    
    return this.taskRequestRepo.save(request);
  }

  async distributeTask(requestId: string): Promise<Task> {
    const queryRunner = this.taskRequestRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await queryRunner.manager.findOne(TaskRequest, { where: { id: requestId } });
      if (!request) throw new NotFoundException('Yêu cầu không tồn tại');
      if (request.status !== TaskRequestStatus.CEO_SIGNED) {
        throw new BadRequestException('Yêu cầu chưa được CEO phê duyệt cuối cùng');
      }

      let projectId = request.projectId;

      // Logic for 5.2: Automatic Project Initialization
      if (!projectId) {
        const newProject = queryRunner.manager.create(Project, {
          name: `DỰ ÁN: ${request.title}`,
          description: request.description,
          clientId: request.clientId,
          pmId: request.pmId,
          totalEstimatedBudget: Number(request.finalPrice) || 0,
          totalEstimatedHours: Number(request.estimatedHours) || 0,
          status: ProjectStatus.IN_PROGRESS,
        });
        const savedProject = await queryRunner.manager.save(Project, newProject);
        projectId = savedProject.id;
        request.projectId = projectId;
      }

      const task = queryRunner.manager.create(Task, {
        projectId,
        title: request.title,
        description: request.description,
        estimatedHours: Number(request.estimatedHours) || 0,
        status: TaskStatus.TODO,
        assigneeId: request.pmId, // Giao cho PM mặc định khi phân bổ
      });

      const savedTask = await queryRunner.manager.save(Task, task);

      request.status = TaskRequestStatus.DISTRIBUTED;
      await queryRunner.manager.save(TaskRequest, request);

      await queryRunner.commitTransaction();
      return savedTask;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async assignPm(requestId: string, pmId: string): Promise<TaskRequest> {
    const request = await this.taskRequestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    request.pmId = pmId;
    return this.taskRequestRepo.save(request);
  }

  async listRequestsByRole(role: string, userId: string): Promise<TaskRequest[]> {
     // Simplifying logic for brevity, in reality we'd filter by role/branch
     return this.taskRequestRepo.find({ order: { createdAt: 'DESC' } });
  }
}
