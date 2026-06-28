import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { SoftDeleteEntity } from './base.entity';
import { Role } from '../shared/enums';
import { Employee } from './employee.entity';

@Entity('users')
export class User extends SoftDeleteEntity {
  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'hashed_password', type: 'varchar', length: 255 })
  hashedPassword!: string;

  @Column({ type: 'varchar', length: 50, default: Role.EMPLOYEE })
  role!: Role;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive!: boolean;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'activation_token', type: 'varchar', length: 255, nullable: true })
  activationToken?: string | null;

  @Column({ name: 'password_reset_token', type: 'varchar', length: 255, nullable: true })
  passwordResetToken?: string | null;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string | null;

  @ManyToOne('Employee', 'user', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Relation<Employee>;
}
