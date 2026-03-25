import { Controller, Post, Body, Get, Param, UseInterceptors } from '@nestjs/common';
import { TaskRequestService } from '../services/task-request.service';
import { AuditInterceptor } from '../../sys-audit/interceptors/audit.interceptor';

@Controller('task-requests')
@UseInterceptors(AuditInterceptor)
export class TaskRequestController {
  constructor(private readonly taskRequestService: TaskRequestService) {}

  @Post('propose')
  async propose(@Body() body: any) {
    return this.taskRequestService.createRequest(body.clientId, body.projectId, body.title, body.description);
  }

  @Post(':id/estimate')
  async pmEstimate(@Param('id') id: string, @Body() body: any) {
    return this.taskRequestService.pmEstimate(id, body.pmId, body.hours, body.signature);
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
  async distribute(@Param('id') id: string) {
    return this.taskRequestService.distributeTask(id);
  }

  @Get('list')
  async listAll() {
    return this.taskRequestService.listRequestsByRole('ALL', 'ALL');
  }
}
