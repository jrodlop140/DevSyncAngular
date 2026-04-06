import { DomainEntity } from './domain-entity.model';
import { RequestState } from '../enums/request-state.enum';

export class Request extends DomainEntity {
  developerId: string = '';
  projectId: string = '';
  state: RequestState = RequestState.PENDING;
  requestDate: string = '';
  createdAt: number = 0;
}