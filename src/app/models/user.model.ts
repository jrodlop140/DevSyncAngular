import { DomainEntity } from './domain-entity.model';

export class User extends DomainEntity {
  name: string = '';
  email: string = '';
  photo: string = '';
  skills: string[] = [];
  projects: Record<string, boolean> = {};
  createdAt: number = 0;
}