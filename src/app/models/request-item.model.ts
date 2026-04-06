import { RequestState } from '../enums/request-state.enum';

export class RequestItem {
  projectName: string = '';
  state: RequestState = RequestState.PENDING;
  requestDate: string = '';
}