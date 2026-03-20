import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Project } from './project.entity';

@Entity('prj_baselines')
export class Baseline extends AbstractEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'version_name', length: 50 })
  versionName: string;

  @Column({ name: 'total_estimated_hours', type: 'decimal', precision: 10, scale: 2 })
  totalEstimatedHours: number;

  @Column({ name: 'snapshot_data', type: 'jsonb' })
  snapshotData: any;
}
