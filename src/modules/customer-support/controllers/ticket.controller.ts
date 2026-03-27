import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import { Role } from '../../iam/entities/role.enum';
import { TicketType } from '../entities/ticket.entity';
import { TicketService } from '../services/ticket.service';

@ApiTags('Customer Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('tickets/:id/evaluate-cr')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Evaluate CR Effort & Auto Generate Quotation (Flow 4)' })
  async evaluateChangeRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estimatedHours') estimatedHours: number,
    @Body('hourlyRate') hourlyRate: number,
  ) {
    return this.ticketService.evaluateChangeRequest(id, estimatedHours, hourlyRate);
  }

  @Patch('tickets/:id/categorize')
  @Roles(Role.CEO, Role.PM, Role.SALE)
  @ApiOperation({ summary: 'Categorize Ticket to BUG or CHANGE_REQUEST' })
  async categorizeTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('type') type: string,
    @Req() req: any,
  ) {
    if (type !== TicketType.BUG && type !== TicketType.CHANGE_REQUEST) {
      throw new BadRequestException('Invalid ticket type. Must be BUG or CHANGE_REQUEST');
    }
    return this.ticketService.categorizeTicket(id, type as TicketType, req.user.id);
  }

  @Post('tickets')
  @Roles(Role.CEO, Role.PM, Role.CLIENT)
  @ApiOperation({ summary: 'Create new Support Ticket' })
  async createTicket(@Body() data: any) {
    return this.ticketService.createTicket(data);
  }

  @Get('tickets/me')
  @Roles(Role.CEO, Role.PM, Role.CLIENT)
  @ApiOperation({ summary: 'Get current user tickets' })
  async getMyTickets() {
    // This is a placeholder for filtering logic; the service should handle the user context
    return this.ticketService.getTicketsByProject(''); // Fix this later with proper user based filter
  }
}
