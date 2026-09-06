import { LocalFieldsRepository } from './localFieldsRepository';
import { MockOtherUsersRepository } from './mockOtherUsersRepository';
import { FieldsRepository } from './fieldsRepository';

export const fieldsRepository: FieldsRepository = new LocalFieldsRepository();
export const otherUsersRepository = new MockOtherUsersRepository();

export { FieldsRepository };
