import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from '../../project/entities/project.entity';
import { Timesheet } from '../../timesheet/entities/timesheet.entity';
import { Invoice } from '../entities/invoice.entity';
import { VendorDebt } from '../entities/vendor-debt.entity';
import { FixedPricePnLStrategy } from '../strategies/pnl/fixed-price.strategy';
import { TimeAndMaterialPnLStrategy } from '../strategies/pnl/time-material.strategy';
import { IPnLCalculationStrategy } from '../strategies/pnl/pnl.strategy.interface';

@Injectable()
export class PnLService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dataSource: DataSource,
    private readonly fixedPriceStrategy: FixedPricePnLStrategy,
    private readonly tmStrategy: TimeAndMaterialPnLStrategy,
  ) {}

  async calculateProjectPNL(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['quotation'],
    });

    if (!project || !project.quotation) {
      throw new NotFoundException('Project or Quotation not found');
    }

    // 1. Get Revenue (Paid Milestones from Contract)
    const revRaw = await this.dataSource
      .query(`
        SELECT COALESCE(SUM(m.amount), 0) as "totalRevenue"
        FROM sls_contract_milestones m
        JOIN sls_contracts c ON c.id = m.contract_id
        JOIN prj_projects p ON p.contract_id = c.id
        WHERE p.id = $1 AND m.status = 'PAID'
      `, [projectId]);
    
    const totalRevenue = Number(revRaw[0]?.totalRevenue || 0);

    // 2. Get Logged Hours (Approved Timesheets)
    const hoursRaw = await this.dataSource
      .getRepository(Timesheet)
      .createQueryBuilder('tms')
      .innerJoin('prj_tasks', 'task', 'task.id = tms.task_id AND task.deleted_at IS NULL')
      .select('COALESCE(SUM(tms.logged_hours), 0)', 'totalHours')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('tms.approval_status = :status', { status: 'APPROVED' }) // Case sensitive match in DB
      .andWhere('tms.deleted_at IS NULL')
      .getRawOne();

    // 3. Get Vendor Costs
    const costsRaw = await this.dataSource
      .getRepository(VendorDebt)
      .createQueryBuilder('debt')
      .innerJoin('tms_timesheets', 'tms', 'tms.id = debt.timesheet_id AND tms.deleted_at IS NULL')
      .innerJoin('prj_tasks', 'task', 'task.id = tms.task_id AND task.deleted_at IS NULL')
      .select('COALESCE(SUM(debt.amount), 0)', 'totalVendorCosts')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('debt.deleted_at IS NULL')
      .getRawOne();

    const revenue = totalRevenue;
    const hours = Number(hoursRaw.totalHours || 0);
    const vendorCosts = Number(costsRaw.totalVendorCosts || 0);
    
    // Abstracted labor internal cost (e.g. 150k/h for internal staff)
    const laborCostPerH = 150000;
    const internalLaborCosts = hours * laborCostPerH;
    
    // Choose Strategy
    let strategy: IPnLCalculationStrategy = this.fixedPriceStrategy;
    if (project.name.toLowerCase().includes('tm')) {
      strategy = this.tmStrategy;
    }

    const pnl = strategy.calculate(
      revenue || Number(project.quotation.totalAmount), 
      hours, 
      1, // Rate multiplier
      vendorCosts,
      laborCostPerH
    );

    return {
      revenue: revenue || Number(project.quotation.totalAmount),
      hours,
      vendorCosts,
      internalCosts: internalLaborCosts,
      totalCosts: vendorCosts + internalLaborCosts,
      profit: pnl,
      margin: (revenue || Number(project.quotation.totalAmount)) > 0 ? pnl / (revenue || Number(project.quotation.totalAmount)) : 0,
    };
  }

  async calculateAllProjectsPNL() {
    const projects = await this.projectRepository.find();
    const results = [];
    for (const p of projects) {
       try {
          const res = await this.calculateProjectPNL(p.id);
          results.push({
             projectId: p.id,
             projectName: p.name,
             ...res
          });
       } catch (e) {
          // Skip projects without quotations/data
       }
    }
    return results;
  }
}
