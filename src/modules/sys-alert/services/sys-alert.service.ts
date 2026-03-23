import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SysAlert } from '../entities/sys-alert.entity';
import { Project } from '../../project/entities/project.entity';
import { Timesheet } from '../../timesheet/entities/timesheet.entity';

@Injectable()
export class SysAlertService {
  constructor(
    @InjectRepository(SysAlert)
    private readonly alertRepository: Repository<SysAlert>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dataSource: DataSource,
  ) {}

  async sendManualAlert(projectId: string, message?: string): Promise<SysAlert> {
    const project = await this.projectRepository.findOne({ 
      where: { id: projectId },
      relations: ['pm'] 
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.alertRepository.save({
      projectId,
      userId: project.pmId,
      type: 'MANUAL_BUDGET_WARNING',
      message: message || `Cảnh báo: Ngân sách dự án "${project.name}" đã vượt ngưỡng cho phép. Đề nghị kiểm tra lại WBS và tiến trình.`,
    });
  }

  async checkProjectBudget(projectId: string): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['quotation', 'pm'],
    });

    if (!project || !project.quotation || project.isAlerted80) {
      return false;
    }

    // Sum actual hours from timesheets for this project
    const { totalActualHours } = await this.dataSource
      .getRepository(Timesheet)
      .createQueryBuilder('tms')
      .innerJoin('prj_tasks', 'task', 'task.id = tms.task_id')
      .select('SUM(tms.logged_hours)', 'totalActualHours')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('tms.approval_status = :status', { status: 'Approved' })
      .getRawOne();

    const actual = parseFloat(totalActualHours || '0');
    const estimated = parseFloat(project.quotation.totalEstimatedHours.toString());

    if (estimated > 0 && actual / estimated >= 0.8) {
      // Trigger Alert
      await this.alertRepository.save({
        projectId,
        userId: project.pmId,
        type: 'BUDGET_EXCEEDED_80',
        message: `Cảnh báo: Dự án "${project.name}" đã đạt ${Math.round((actual / estimated) * 100)}% ngân sách số giờ dự kiến (${actual}/${estimated}h).`,
      });

      // Update project to prevent double alerting
      await this.projectRepository.update(projectId, { isAlerted80: true });
      return true;
    }

    return false;
  }

  async getAlertsForUser(userId: string) {
    return this.alertRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(id: string) {
    return this.alertRepository.update(id, { isRead: true });
  }
}
