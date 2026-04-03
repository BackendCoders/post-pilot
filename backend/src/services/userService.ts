import User from '../models/User';
import createCrudService from './crudService';

export const userService = createCrudService(User);

export default userService;
