import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './entities/contract.entity';
import { Quotation } from './entities/quotation.entity';
import { ContractMilestone } from './entities/contract-milestone.entity';
import { ContractService } from './services/contract.service';
import { PkiModule } from '../pki/pki.module';
import { ProjectModule } from '../project/project.module';
import { SalesController } from './controllers/sales.controller';
import { SysAuditModule } from '../sys-audit/sys-audit.module';
import { QuotationService } from './services/quotation.service';
import { QuotationController } from './controllers/quotation.controller';
import { CustomerSupportModule } from '../customer-support/customer-support.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Quotation, ContractMilestone]),
    forwardRef(() => PkiModule),
    ProjectModule,
    SysAuditModule,
    CustomerSupportModule
  ],
  controllers: [SalesController, QuotationController],
  providers: [ContractService, QuotationService],
  exports: [ContractService, QuotationService],
})
export class SalesModule {}
