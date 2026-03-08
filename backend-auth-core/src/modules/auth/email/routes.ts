import { Router } from 'express';
import { loginWithEmailPassword } from './login.handler';
import { logout } from './logout.handler';
import { getMe } from './me.handler';
import { refreshToken } from './refresh.handler';
import { authenticate } from '../../../middleware/authenticate';

export const emailAuthRouter = Router();

emailAuthRouter.post('/login', loginWithEmailPassword);
emailAuthRouter.post('/logout', logout);
emailAuthRouter.post('/refresh', refreshToken);
emailAuthRouter.get('/me', authenticate, getMe);
