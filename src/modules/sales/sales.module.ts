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

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Quotation, ContractMilestone]),
    PkiModule,
    ProjectModule,
    SysAuditModule
  ],
  controllers: [SalesController],
  providers: [ContractService],
  exports: [ContractService],
})
export class SalesModule {}

