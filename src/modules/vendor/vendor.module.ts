import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../iam/entities/user.entity';
import { SysAuditModule } from '../sys-audit/sys-audit.module';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SysAuditModule,
  ],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}
