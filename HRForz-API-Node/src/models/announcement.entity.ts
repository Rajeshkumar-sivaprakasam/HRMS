import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SoftDeleteEntity } from './base.entity';
import { Employee } from './employee.entity';
import { Department } from './department.entity';

@Entity('announcements')
export class Announcement extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'target_audience', type: 'varchar', length: 30, default: 'all' })
  targetAudience!: string;

  @Column({ name: 'target_department_id', type: 'uuid', nullable: true })
  targetDepartmentId?: string | null;

  @Column({ name: 'published_by', type: 'uuid', nullable: true })
  publishedBy?: string | null;

  @Column({ name: 'published_at', type: 'date', nullable: true })
  publishedAt?: Date | null;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt?: Date | null;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned!: boolean;

  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'published_by' })
  publisher?: Employee;

  @ManyToOne(() => Department, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_department_id' })
  targetDepartment?: Department;
}
