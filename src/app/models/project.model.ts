import { DomainEntity } from './domain-entity.model';
import { ProjectStatus } from '../enums/project-status.enum';

export class Project extends DomainEntity {
  name: string = '';
  description: string = '';
  creator: string = '';
  participants: Record<string, boolean> = {};
  technologies: string[] = [];
  createdAt: number = 0;
  status: ProjectStatus = ProjectStatus.ACTIVE;
}