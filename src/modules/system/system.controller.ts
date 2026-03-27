import { Controller, Post, Body, Get, UseGuards, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { CurrentUser } from '../iam/decorators/current-user.decorator';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post('branches')
  async createBranch(@Body() createBranchDto: CreateBranchDto) {
    return this.systemService.createBranch(createBranchDto);
  }

  @Get('branches')
  async getAllBranches() {
    return this.systemService.getAllBranches();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông báo cho người dùng hiện tại' })
  @Get('notifications')
  async getMyNotifications(@CurrentUser() user: any) {
    return this.systemService.getUserNotifications(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đánh dấu thông báo là đã đọc' })
  @Patch('notifications/:id/read')
  async readNotification(@Param('id') id: string) {
    return this.systemService.markNotificationRead(id);
  }
}
