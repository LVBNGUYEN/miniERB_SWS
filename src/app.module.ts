import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamModule } from './modules/iam/iam.module';
import { ProjectModule } from './modules/project/project.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SalesModule } from './modules/sales/sales.module';
import { PkiModule } from './modules/pki/pki.module';
import { TimesheetModule } from './modules/timesheet/timesheet.module';
import { SystemModule } from './modules/system/system.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'erp_user',
      password: 'erp_password',
      database: 'minierp_db',
      autoLoadEntities: true,
      synchronize: true, // Auto-create tables for dev mode only
    }),
    IamModule,
    ProjectModule,
    VendorModule,
    FinanceModule,
    SalesModule,
    PkiModule,
    TimesheetModule,
    SystemModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
