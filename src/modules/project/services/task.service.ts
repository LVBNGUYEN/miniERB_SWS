import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Project } from '../entities/project.entity';
import { User } from '../../iam/entities/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * PM splits WBS and assigns task to a Vendor/Member (Flow 3)
   */
  async createTask(
    projectId: string, 
    title: string, 
    estimatedHours: number, 
    assigneeId?: string,
    riskBufferPercent: number = 0.1 // Default 10% risk buffer
  ): Promise<Task> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const task = this.taskRepository.create({
      projectId,
      assigneeId,
      title,
      status: 'TODO',
      estimatedHours: estimatedHours,
      actualHours: 0,
      rejectionCount: 0,
      riskBufferPercent,
    });

    return this.taskRepository.save(task);
  }

  async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    
    task.status = status;
    return this.taskRepository.save(task);
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { projectId },
      relations: ['assignee'],
      order: { createdAt: 'ASC' }
    });
  }
}
