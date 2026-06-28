import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';
import { BaseEntity, SoftDeleteEntity } from './base.entity';
import { TicketStatus, TicketPriority } from '../shared/enums';
import { Employee } from './employee.entity';

@Entity('helpdesk_categories')
export class HelpdeskCategory extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany('HelpdeskTicket', 'category')
  tickets?: Relation<HelpdeskTicket[]>;
}

@Entity('helpdesk_tickets')
export class HelpdeskTicket extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'ticket_number', type: 'varchar', length: 30, unique: true })
  ticketNumber!: string;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string | null;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 20, default: TicketPriority.MEDIUM })
  priority!: TicketPriority;

  @Column({ type: 'varchar', length: 20, default: TicketStatus.OPEN })
  status!: TicketStatus;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo?: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date | null;

  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @ManyToOne('HelpdeskCategory', 'tickets', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Relation<HelpdeskCategory>;

  @OneToMany('HelpdeskComment', 'ticket')
  comments?: Relation<HelpdeskComment[]>;
}

@Entity('helpdesk_comments')
export class HelpdeskComment extends BaseEntity {
  @Index()
  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'text' })
  comment!: string;

  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal!: boolean;

  @ManyToOne('HelpdeskTicket', 'comments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: Relation<HelpdeskTicket>;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}
