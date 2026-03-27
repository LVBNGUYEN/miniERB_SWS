import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { User } from '../../iam/entities/user.entity';
import { Project } from '../../project/entities/project.entity';

export enum TicketType {
  BUG = 'BUG',
  CHANGE_REQUEST = 'CHANGE_REQUEST',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  REVIEWING = 'REVIEWING',
  PENDING_QUOTATION = 'PENDING_QUOTATION',
  EVALUATED = 'EVALUATED',
  RESOLVED = 'RESOLVED',
}

@Entity('csk_tickets')
export class Ticket extends AbstractEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'enum', enum: TicketType, nullable: true })
  ticketType: TicketType;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ name: 'blame_user_id', type: 'uuid', nullable: true })
  blameUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'blame_user_id' })
  blameUser: User;
}
