import { Controller, Get, Patch, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Roles } from '../iam/decorators/roles.decorator';
import { Role } from '../iam/entities/role.enum';
import { SysAlertService } from './services/sys-alert.service';

@ApiTags('Alert')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class SysAlertController {
  constructor(private readonly alertService: SysAlertService) {}

  @Get()
  @ApiOperation({ summary: 'Get alerts for current user (Flow 15)' })
  async getMyAlerts(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.alertService.getAlertsForUser(userId);
  }

  @Post(':projectId/manual-alert')
  @Roles(Role.GLOBAL_ADMIN, Role.SALE)
  @ApiOperation({ summary: 'Send manual budget alert to PM' })
  async sendManualAlert(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('message') message: string
  ) {
    return this.alertService.sendManualAlert(projectId, message);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  async markRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertService.markAsRead(id);
  }
}
