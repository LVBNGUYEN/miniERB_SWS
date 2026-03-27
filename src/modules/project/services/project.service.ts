import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Quotation } from '../../sales/entities/quotation.entity';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { ProjectStatus } from '../entities/project-status.enum';
import { SysAuditService } from '../../sys-audit/sys-audit.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly sysAuditService: SysAuditService,
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
      status: ProjectStatus.IN_PROGRESS,
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

    project.status = ProjectStatus.COMPLETED;
    return this.projectRepository.save(project);
  }

  async findProjectDetails(projectId: string) {
    return this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['pm', 'tasks', 'tasks.assignee'],
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['pm', 'client', 'tasks', 'tasks.assignee'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(createDto: CreateProjectDto, userId: string): Promise<Project> {
    const project = this.projectRepository.create(createDto);
    project.pmId = userId; // Auto assign creator as PM
    project.status = ProjectStatus.IN_PROGRESS;
    
    const saved = await this.projectRepository.save(project);
    
    await this.sysAuditService.createLog({
      userId,
      action: 'CREATE',
      tableName: 'prj_projects',
      recordId: saved.id,
      newValue: saved,
    });
    
    return saved;
  }

  async findAll(user: any): Promise<any[]> {
    const query: any = { relations: ['tasks', 'quotation', 'pm', 'client'], order: { createdAt: 'DESC' } };
    
    if (user.role === 'CLIENT') {
      query.where = { clientId: user.id };
    }
    
    const projects = await this.projectRepository.find(query);

    return projects.map(p => ({
      ...p,
      totalEstimatedHours: p.tasks?.reduce((sum, t) => sum + Number(t.estimatedHours || 0), 0) || 0,
      taskCount: p.tasks?.length || 0,
    }));
  }
  
  async update(id: string, updateDto: UpdateProjectDto, user: any): Promise<Project> {
    const project = await this.findOne(id);
    
    if (user.role !== 'CEO' && user.role !== 'GLOBAL_ADMIN' && project.pmId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa dự án này vì không phải là chủ nhiệm (PM).');
    }

    const oldValue = { ...project };
    
    Object.assign(project, updateDto);
    const saved = await this.projectRepository.save(project);
    
    await this.sysAuditService.createLog({
      userId: user.id,
      action: 'UPDATE',
      tableName: 'prj_projects',
      recordId: saved.id,
      oldValue,
      newValue: saved,
    });
    
    return saved;
  }
}
