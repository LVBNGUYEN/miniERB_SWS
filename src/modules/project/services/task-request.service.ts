import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskRequest, TaskRequestStatus } from '../entities/task-request.entity';
import { Task } from '../entities/task.entity';
import { TaskStatus } from '../entities/task-status.enum';

@Injectable()
export class TaskRequestService {
  constructor(
    @InjectRepository(TaskRequest)
    private readonly taskRequestRepo: Repository<TaskRequest>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async createRequest(clientId: string, projectId: string, title: string, description: string): Promise<TaskRequest> {
    const request = this.taskRequestRepo.create({
      clientId,
      projectId,
      title,
      description,
      status: TaskRequestStatus.PROPOSED,
    });
    return this.taskRequestRepo.save(request);
  }

  async pmEstimate(requestId: string, pmId: string, hours: number, signature: string): Promise<TaskRequest> {
    const request = await this.taskRequestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    
    request.pmId = pmId;
    request.estimatedHours = hours;
    request.signatures = { 
      ...request.signatures, 
      pmSignature: signature, 
      pmSignedAt: new Date() 
    };
    request.status = TaskRequestStatus.ESTIMATED;
    
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
    const request = await this.taskRequestRepo.findOne({ where: { id: requestId } });
    if (!request || request.status !== TaskRequestStatus.CEO_SIGNED) {
      throw new Error('Not approved by CEO yet');
    }

    const task = this.taskRepo.create({
      projectId: request.projectId,
      title: request.title,
      estimatedHours: request.estimatedHours,
      status: TaskStatus.TODO,
    });

    request.status = TaskRequestStatus.DISTRIBUTED;
    await this.taskRequestRepo.save(request);

    return this.taskRepo.save(task);
  }

  async listRequestsByRole(role: string, userId: string): Promise<TaskRequest[]> {
     // Simplifying logic for brevity, in reality we'd filter by role/branch
     return this.taskRequestRepo.find({ order: { createdAt: 'DESC' } });
  }
}
