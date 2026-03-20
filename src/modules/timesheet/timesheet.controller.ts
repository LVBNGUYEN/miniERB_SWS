import { Controller, Patch, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimesheetService } from './timesheet.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import { Role } from '../iam/entities/role.enum';
import { CurrentUser } from '../iam/decorators/current-user.decorator';

@ApiTags('Timesheet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timesheets')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Patch(':id/approve')
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM)
  @ApiOperation({ summary: 'Approve a timesheet and record vendor debt' })
  async approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.timesheetService.approveTimesheet(id, user.userId);
  }
}
