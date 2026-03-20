import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timesheet } from './entities/timesheet.entity';
import { TimesheetService } from './timesheet.service';
import { TimesheetController } from './timesheet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Timesheet])],
  controllers: [TimesheetController],
  providers: [TimesheetService],
  exports: [TimesheetService],
})
export class TimesheetModule {}
