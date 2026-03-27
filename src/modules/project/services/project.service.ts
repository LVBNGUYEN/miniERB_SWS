import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Quotation } from '../../sales/entities/quotation.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * Auto-Initialize Project from a signed contract and quotation (Flow 2)
   */
  async initializeProjectFromContract(
    contractId: string, 
    quotation: Quotation, 
    manager?: EntityManager
  ): Promise<Project> {
    const repo = manager ? manager : this.projectRepository.manager;

    const project = repo.create(Project, {
      contractId,
      quotationId: quotation.id,
      branchId: quotation.branchId,
      pmId: quotation.pmId, // Auto-assign PM from quotation
      name: `PRJ: ${quotation.title}`,
      status: 'INITIATED',
      isAlerted80: false,
    });

    return repo.save(Project, project);
  }

  /**
   * Flow 5: UAT & Close Project
   * Completes the project, ensuring Quality Assurance review has passed.
   * Locks all editing capabilities (Business logic dictates COMPLETED projects are immutable).
   */
  async closeProject(projectId: string, qcPassed: boolean = true): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    if (!qcPassed) {
      throw new Error('Project cannot be closed without Quality Control (QA) approval.');
    }

    project.status = 'COMPLETED';
    return this.projectRepository.save(project);
  }

  async findProjectDetails(projectId: string) {
    return this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['pm', 'tasks', 'tasks.assignee'],
    });
  }

  async create(data: any): Promise<Project> {
    const project = this.projectRepository.create(data as Partial<Project>);
    if (!project.status) project.status = 'ACTIVE';
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<any[]> {
    const projects = await this.projectRepository.find({
      relations: ['tasks', 'quotation'],
      order: { createdAt: 'DESC' }
    });

    return projects.map(p => ({
      ...p,
      totalEstimatedHours: p.tasks?.reduce((sum, t) => sum + Number(t.estimatedHours || 0), 0) || 0,
      taskCount: p.tasks?.length || 0,
      totalAmount: p.quotation?.totalAmount || 0, // Dữ liệu thật từ database
    }));
  }
}
