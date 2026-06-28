import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SoftDeleteEntity } from './base.entity';
import { WorkLocation } from './department.entity';
import { HolidayType } from './lookup.entity';

@Entity('holidays')
export class Holiday extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index()
  @Column({ name: 'holiday_date', type: 'date' })
  holidayDate!: Date;

  @Index()
  @Column({ name: 'holiday_type_id', type: 'uuid', nullable: true })
  holidayTypeId?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Index()
  @Column({ type: 'int' })
  year!: number;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional!: boolean;

  @Column({ name: 'work_location_id', type: 'uuid', nullable: true })
  workLocationId?: string | null;

  @ManyToOne(() => HolidayType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'holiday_type_id' })
  holidayType?: HolidayType;

  @ManyToOne(() => WorkLocation, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'work_location_id' })
  workLocation?: WorkLocation;
}
