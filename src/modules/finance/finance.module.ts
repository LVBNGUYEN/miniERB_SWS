import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../project/project.module';
import { VendorModule } from '../vendor/vendor.module';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { VendorDebt } from './entities/vendor-debt.entity';

@Module({
  imports: [
    ProjectModule,
    VendorModule,
    TypeOrmModule.forFeature([Invoice, Payment, VendorDebt]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class FinanceModule {}
