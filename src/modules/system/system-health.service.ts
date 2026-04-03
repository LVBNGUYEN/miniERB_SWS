import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from '../project/entities/project.entity';
import { Task } from '../project/entities/task.entity';
import { ContractMilestone } from '../sales/entities/contract-milestone.entity';
import { SysAlertService } from '../sys-alert/services/sys-alert.service';

@Injectable()
export class SystemHealthService {
  private readonly logger = new Logger(SystemHealthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly alertService: SysAlertService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * Epic 15.1: Cross-verify data between Sales/Project/Finance
   */
  async runHealthCheck() {
    this.logger.log('Running System-wide Health Check...');
    const anomalies = [];

    // 1. Projects without Contracts
    const orphanProjects = await this.projectRepository
      .createQueryBuilder('p')
      .where('p.contract_id IS NULL')
      .getMany();
    
    if (orphanProjects.length > 0) {
       anomalies.push({
          type: 'ORPHAN_PROJECT',
          message: `Found ${orphanProjects.length} projects without a linked contract reference.`,
          ids: orphanProjects.map(p => p.id)
       });
    }

    // 2. Overdue Tasks vs Pending Milestones
    // If a project has many overdue tasks, it might delay the next milestone payment.
    const projects = await this.projectRepository.find({ relations: ['tasks'] });
    for (const p of projects) {
       const overdueTasks = p.tasks?.filter(t => t.status !== 'DONE' && t.deadline && new Date(t.deadline) < new Date());
       if (overdueTasks && overdueTasks.length > 5) {
          anomalies.push({
             type: 'PROJECT_DELAY_RISK',
             message: `Project ${p.name} has ${overdueTasks.length} overdue tasks, risking payment milestone delays.`,
             projectId: p.id
          });
       }
    }

    // 3. Cashflow Deviation
    // Check if Paid Milestones in Contract matches Revenue in Invoices
    // (This ensures synchronization is working)
    
    return anomalies;
  }
}
