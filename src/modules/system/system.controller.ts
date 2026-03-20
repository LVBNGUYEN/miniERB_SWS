import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import { Role } from '../iam/entities/role.enum';

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
}
