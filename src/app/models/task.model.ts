import { DomainEntity } from './domain-entity.model';
import { TaskStatus } from '../enums/task-status.enum';

export class Task extends DomainEntity {
  title: string = '';
  description: string = '';
  status: TaskStatus = TaskStatus.PENDING;
  projectId: string = '';
  assignedDeveloper: string = '';
  creationDate: string = '';
  createdAt: number = 0;
}