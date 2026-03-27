import { Module } from '@nestjs/common';
import { PkiController } from './controllers/pki.controller';
import { PkiService } from './services/pki.service';

import { SystemModule } from '../system/system.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../sales/entities/contract.entity';
import { Quotation } from '../sales/entities/quotation.entity';
import { ContractMilestone } from '../sales/entities/contract-milestone.entity';

@Module({
  imports: [
    SystemModule,
    TypeOrmModule.forFeature([Contract, Quotation, ContractMilestone])
  ],
  controllers: [PkiController],
  providers: [PkiService],
  exports: [PkiService],
})
export class PkiModule {}
