import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Project } from '../project/entities/project.entity';
import { Quotation } from '../sales/entities/quotation.entity';
import { TicketService } from './services/ticket.service';
import { TicketController } from './controllers/ticket.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Project, Quotation])],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class CustomerSupportModule {}
