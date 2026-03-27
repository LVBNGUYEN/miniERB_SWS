import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimesheetService } from '../services/timesheet.service';
import { CreateTimesheetDto } from '../dto/timesheet.dto';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import { Role } from '../../iam/entities/role.enum';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('Timesheets')
@Controller('timesheets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Post()
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Vendor nộp báo cáo giờ làm (Timesheet)' })
  async submitLog(@Body() createDto: CreateTimesheetDto, @Req() req: any) {
    return this.timesheetService.submitLog(createDto, req.user.id);
  }

  @Get('my-logs')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Lấy danh sách Timesheet của bản thân (Vendor)' })
  async getMyLogs(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.timesheetService.findMyLogs(userId);
  }

  /**
   * (Placeholder cho Epic 4: QA duyệt)
   * GET / -> Lấy list cần duyệt (PM/CEO/QA)
   * PATCH /:id/status -> Approve / Reject (PM/CEO/QA)
   */
}
