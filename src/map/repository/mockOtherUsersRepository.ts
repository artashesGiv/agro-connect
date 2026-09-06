import { OtherUserMarker } from '../types';
import { otherUsersSeed } from '../mocks/otherUsersSeed';

export class MockOtherUsersRepository {
  async list(): Promise<OtherUserMarker[]> {
    return Promise.resolve([...otherUsersSeed]);
  }
}
