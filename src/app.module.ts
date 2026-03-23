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
import { SysAuditModule } from './modules/sys-audit/sys-audit.module';
import { SysAlertModule } from './modules/sys-alert/sys-alert.module';
import { CustomerSupportModule } from './modules/customer-support/customer-support.module';
import { AiEngineModule } from './modules/ai-engine/ai-engine.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'modules', 'uiux'),
      serveRoot: '/uiux',
    }),
    IamModule,
    ProjectModule,
    VendorModule,
    FinanceModule,
    SalesModule,
    PkiModule,
    TimesheetModule,
    SystemModule,
    SysAuditModule,
    SysAlertModule,
    CustomerSupportModule,
    AiEngineModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
