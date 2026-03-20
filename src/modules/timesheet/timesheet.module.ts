import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timesheet } from './entities/timesheet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Timesheet])],
  providers: [],
  exports: [TypeOrmModule],
})
export class TimesheetModule {}
