import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { Notification } from './entities/notification.entity';

import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [TypeOrmModule.forFeature([Branch, Notification])],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [TypeOrmModule, SystemService],
})
export class SystemModule {}
