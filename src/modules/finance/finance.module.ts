import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from '../project/project.module';
import { VendorModule } from '../vendor/vendor.module';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { VendorDebt } from './entities/vendor-debt.entity';
import { Project } from '../project/entities/project.entity';
import { Timesheet } from '../timesheet/entities/timesheet.entity';

// Services
import { InvoiceService } from './services/invoice.service';
import { PaymentService } from './services/payment.service';
import { PnLService } from './services/pnl.service';
import { FinanceCronService } from './services/finance-cron.service';

// Controllers
import { FinanceController } from './controllers/finance.controller';

// Strategies
import { FixedPricePnLStrategy } from './strategies/pnl/fixed-price.strategy';
import { TimeAndMaterialPnLStrategy } from './strategies/pnl/time-material.strategy';

@Module({
  imports: [
    ProjectModule,
    VendorModule,
    TypeOrmModule.forFeature([Invoice, Payment, VendorDebt, Project, Timesheet]),
  ],
  controllers: [FinanceController],
  providers: [
    InvoiceService, 
    PaymentService, 
    PnLService,
    FixedPricePnLStrategy,
    TimeAndMaterialPnLStrategy,
    FinanceCronService,
  ],
  exports: [InvoiceService, PaymentService, PnLService],
})
export class FinanceModule {}
