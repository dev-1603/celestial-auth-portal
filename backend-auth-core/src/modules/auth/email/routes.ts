import { Router } from 'express';
import { loginWithEmailPassword } from './login.handler';
import { logout } from './logout.handler';

export const emailAuthRouter = Router();

emailAuthRouter.post('/login', loginWithEmailPassword);
emailAuthRouter.post('/logout', logout)
