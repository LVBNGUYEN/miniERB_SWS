import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AiEngineService } from '../services/ai-engine.service';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import { Role } from '../../iam/entities/role.enum';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';

@Controller('ai-engine')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiEngineController {
  constructor(private readonly aiEngineService: AiEngineService) {}

  @Post('chat')
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM, Role.SALE)
  async chat(@Body() body: { query: string }) {
    if (!body.query) {
      throw new UnauthorizedException('Chưa có câu hỏi.');
    }
    return this.aiEngineService.analyze(body.query);
  }
}
