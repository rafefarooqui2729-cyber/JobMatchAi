import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  adminLogin,
  candidateLogin,
  candidateRegister,
  currentUser,
  employerLogin,
  employerRegister,
  logout,
  protectedAdminAccess,
} from '../controllers/auth.controller.js';
import { authenticate, requireSameOrigin } from '../middleware/auth.middleware.js';
import {
  validateCandidateRegistration,
  validateEmployerRegistration,
  validateLogin,
} from '../middleware/auth-validation.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const authRouter = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many authentication attempts. Try again later.' } },
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many registration attempts. Try again later.' } },
});

authRouter.use(requireSameOrigin);
authRouter.post('/candidate/register', registrationLimiter, validateCandidateRegistration, candidateRegister);
authRouter.post('/employer/register', registrationLimiter, validateEmployerRegistration, employerRegister);
authRouter.post('/candidate/login', loginLimiter, validateLogin, candidateLogin);
authRouter.post('/employer/login', loginLimiter, validateLogin, employerLogin);
authRouter.post('/admin/login', loginLimiter, validateLogin, adminLogin);
authRouter.post('/logout', authenticate, logout);
authRouter.get('/me', authenticate, currentUser);
authRouter.get('/admin/access', authenticate, authorize('admin'), protectedAdminAccess);

export default authRouter;
