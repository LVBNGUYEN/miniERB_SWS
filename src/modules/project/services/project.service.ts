import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
      pmId: quotation.pmId, // Auto-assign PM from quotation
      clientId: quotation.clientId, // Map Client from quotation
      branchId: quotation.branchId, // Map Branch from quotation
      name: `PRJ: ${quotation.title}`,
      description: quotation.description || `Project initiated from quotation ${quotation.id}`,
      totalEstimatedBudget: quotation.totalAmount,
      totalEstimatedHours: Number(quotation.totalEstimatedHours || 0),
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
  async closeProject(projectId: string, qcPassed: boolean = true, user?: any): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    if (user && user.role !== 'CEO' && user.role !== 'GLOBAL_ADMIN' && project.pmId !== user.id) {
       throw new ForbiddenException('Bạn không có quyền đóng dự án này vì không phải là chủ nhiệm (PM).');
    }

    if (!qcPassed) {
      throw new BadRequestException('Project cannot be closed without Quality Control (QA) approval.');
    }

    project.status = ProjectStatus.COMPLETED;
    return this.projectRepository.save(project);
  }

  async findProjectDetails(projectId: string, user: any) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['pm', 'tasks', 'tasks.assignee'],
    });

    if (!project) throw new NotFoundException('Project not found');

    // Zero Trust: Always verify user permission to see details
    if (user.role === 'CLIENT' && project.clientId !== user.id) {
       throw new ForbiddenException('Bạn không phải là chủ sở hữu của dự án này.');
    }

    if (user.role === 'VENDOR' && !project.tasks?.some(t => t.assigneeId === user.id)) {
       throw new ForbiddenException('Bạn không tham gia trực tiếp vào các Task của dự án này.');
    }

    return project;
  }

  async findOne(id: string, user: any): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['pm', 'client', 'tasks', 'tasks.assignee'],
    });

    if (!project) throw new NotFoundException('Project not found');

    // Ownership validation
    if (user.role === 'CLIENT' && project.clientId !== user.id) {
       throw new ForbiddenException('Access Denied (Client mismatch).');
    }
    
    // PM can see if they are the designated PM
    if (user.role === 'PM' && project.pmId !== user.id) {
      // CEO or Admin can still see everything
       throw new ForbiddenException('Access Denied (PM mismatch).');
    }
    
    return project;
  }

  async create(createDto: CreateProjectDto, userId: string): Promise<Project> {
    const project = this.projectRepository.create(createDto);
    if (!project.pmId) {
      project.pmId = userId; // Auto assign creator as PM if not specified
    }
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
    const query = this.projectRepository.createQueryBuilder('p')
      .leftJoin('p.quotation', 'q')
      .leftJoin('p.pm', 'pm')
      .leftJoin('p.client', 'client')
      .leftJoin('prj_tasks', 't', 't.project_id = p.id AND t.deleted_at IS NULL')
      .leftJoin('sls_contract_milestones', 'm', 'm.contract_id = p.contract_id AND m.status = :paids', { paids: 'PAID' })
      .leftJoin('prj_timesheets', 'ts', 'ts.task_id = t.id AND ts.approval_status = :approved', { approved: 'APPROVED' })
      .select('p.id', 'p_id')
      .addSelect('p.name', 'p_name')
      .addSelect('p.description', 'p_description')
      .addSelect('p.status', 'p_status')
      .addSelect('p.createdAt', 'p_createdAt')
      .addSelect('p.totalEstimatedBudget', 'p_totalEstimatedBudget')
      .addSelect('p.totalEstimatedHours', 'p_totalEstimatedHours')
      .addSelect('p.totalActualHours', 'p_totalActualHours')
      .addSelect('p.contractId', 'p_contractId')
      .addSelect('q.id', 'q_id')
      .addSelect('pm.id', 'pm_id')
      .addSelect('pm.fullName', 'pm_fullName')
      .addSelect('client.id', 'client_id')
      .addSelect('client.fullName', 'client_fullName')
      .addSelect('COALESCE(SUM(t.estimated_hours), 0)', 'allocatedHours')
      .addSelect('COUNT(DISTINCT t.id)', 'taskCount')
      .addSelect('COALESCE(SUM(m.amount), 0)', 'totalActualRevenue')
      .addSelect('COALESCE(SUM(ts.logged_hours * ts.snapshot_price), 0)', 'totalActualCost')
      .groupBy('p.id')
      .addGroupBy('q.id')
      .addGroupBy('pm.id')
      .addGroupBy('client.id')
      .orderBy('p.createdAt', 'DESC');
    
    if (user.role === 'CLIENT') {
      query.andWhere('p.clientId = :clientId', { clientId: user.id });
    }
    
    const raws = await query.getRawMany();

    return raws.map(r => ({
      id: r.p_id,
      name: r.p_name,
      description: r.p_description,
      status: r.p_status,
      createdAt: r.p_createdAt,
      contractId: r.p_contractId,
      totalEstimatedBudget: Number(r.p_totalEstimatedBudget || 0),
      totalActualRevenue: Number(r.totalActualRevenue || 0),
      totalActualCost: Number(r.totalActualCost || 0),
      totalEstimatedHours: Number(r.p_totalEstimatedHours || 0),
      totalActualHours: Number(r.p_totalActualHours || 0),
      allocatedHours: Number(r.allocatedHours || 0),
      taskCount: Number(r.taskCount || 0),
      pm: { id: r.pm_id, fullName: r.pm_fullName },
      client: { id: r.client_id, fullName: r.client_fullName },
    }));
  }
  
  async update(id: string, updateDto: UpdateProjectDto, user: any): Promise<Project> {
    const project = await this.findOne(id, user);
    
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
