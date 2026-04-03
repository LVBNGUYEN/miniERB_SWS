import { Controller, Post, Body, Get, Param, UseInterceptors, HttpCode } from '@nestjs/common';
import { TaskRequestService } from '../services/task-request.service';
import { AuditInterceptor } from '../../sys-audit/interceptors/audit.interceptor';

@Controller('task-requests')
@UseInterceptors(AuditInterceptor)
export class TaskRequestController {
  constructor(private readonly taskRequestService: TaskRequestService) {}

  @Post('propose')
  @HttpCode(201)
  async propose(@Body() body: any) {
    return this.taskRequestService.createRequest(body.clientId, body.projectId, body.title, body.description, body.pmId, body.saleId);
  }

  @Post(':id/assign-pm')
  async assignPm(@Param('id') id: string, @Body() body: any) {
    return this.taskRequestService.assignPm(id, body.pmId);
  }

  @Post(':id/estimate')
  async pmEstimate(@Param('id') id: string, @Body() body: any) {
    return this.taskRequestService.pmEstimate(id, body.pmId, body.hours, body.type, body.signature);
  }

  @Post(':id/reject')
  async pmReject(@Param('id') id: string, @Body() body: any) {
    return this.taskRequestService.pmReject(id, body.pmId);
  }

  @Post(':id/price')
  async saleSetPrice(@Param('id') id: string, @Body() body: any) {
    return this.taskRequestService.saleSetPrice(id, body.saleId, body.price);
  }

  @Post(':id/client-sign')
  async clientSign(@Param('id') id: string, @Body() body: any) {
    return this.taskRequestService.clientSign(id, body.signature);
  }

  @Post(':id/ceo-sign')
  async ceoSign(@Param('id') id: string, @Body() body: any) {
    return this.taskRequestService.ceoSign(id, body.ceoId, body.signature);
  }

  @Post(':id/distribute')
  @HttpCode(201)
  async distribute(@Param('id') id: string) {
    return this.taskRequestService.distributeTask(id);
  }

  @Get('list')
  async listAll() {
    return this.taskRequestService.listRequestsByRole('ALL', 'ALL');
  }
}
