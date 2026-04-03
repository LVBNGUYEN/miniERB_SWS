import { Module } from '@nestjs/common';
import { PkiController } from './controllers/pki.controller';
import { PkiService } from './services/pki.service';

import { SystemModule } from '../system/system.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../sales/entities/contract.entity';
import { Quotation } from '../sales/entities/quotation.entity';
import { ContractMilestone } from '../sales/entities/contract-milestone.entity';
import { Task } from '../project/entities/task.entity';

import { ProjectModule } from '../project/project.module';
import { TimesheetModule } from '../timesheet/timesheet.module';
import { FinanceModule } from '../finance/finance.module';
import { SalesModule } from '../sales/sales.module';
import { E2ETestingService } from '../system/e2e-testing.service';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    SystemModule,
    ProjectModule,
    TimesheetModule,
    FinanceModule,
    forwardRef(() => SalesModule),
    TypeOrmModule.forFeature([Contract, Quotation, ContractMilestone, Task])
  ],
  controllers: [PkiController],
  providers: [PkiService, E2ETestingService],
  exports: [PkiService],
})
export class PkiModule {}
