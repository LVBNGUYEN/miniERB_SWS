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

    // 1. Get Revenue (Approved Invoices)
    const { totalRevenue } = await this.dataSource
      .getRepository(Invoice)
      .createQueryBuilder('inv')
      .select('SUM(inv.total_amount)', 'totalRevenue')
      .where('inv.project_id = :projectId', { projectId })
      .andWhere('inv.status = :status', { status: 'PAID' })
      .getRawOne();

    // 2. Get Logged Hours (Approved Timesheets)
    const { totalHours } = await this.dataSource
      .getRepository(Timesheet)
      .createQueryBuilder('tms')
      .innerJoin('prj_tasks', 'task', 'task.id = tms.task_id')
      .select('SUM(tms.logged_hours)', 'totalHours')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('tms.approval_status = :status', { status: 'Approved' })
      .getRawOne();

    // 3. Get Vendor Costs
    const { totalVendorCosts } = await this.dataSource
      .getRepository(VendorDebt)
      .createQueryBuilder('debt')
      .innerJoin('tms_timesheets', 'tms', 'tms.id = debt.timesheet_id')
      .innerJoin('prj_tasks', 'task', 'task.id = tms.task_id')
      .select('SUM(debt.amount)', 'totalVendorCosts')
      .where('task.project_id = :projectId', { projectId })
      .getRawOne();

    const revenue = parseFloat(totalRevenue || '0');
    const hours = parseFloat(totalHours || '0');
    const vendorCosts = parseFloat(totalVendorCosts || '0');
    
    // Abstracted internal cost (could be more complex per employee)
    const internalHourlyRate = 25; // Default for now
    
    // Choose Strategy (Assume Title contains type for now, or add a field)
    let strategy: IPnLCalculationStrategy = this.fixedPriceStrategy;
    if (project.name.toLowerCase().includes('tm') || project.name.toLowerCase().includes('time')) {
      strategy = this.tmStrategy;
    }

    const pnl = strategy.calculate(
      revenue || project.quotation.totalAmount, 
      hours, 
      50, // Billable Rate / Project Rate
      vendorCosts,
      internalHourlyRate
    );

    return {
      revenue: revenue || project.quotation.totalAmount,
      hours,
      vendorCosts,
      internalCosts: hours * internalHourlyRate,
      profit: pnl,
      margin: pnl / (revenue || project.quotation.totalAmount),
    };
  }
}
