import env from '../config/env.js';
import { disconnectUserSockets } from '../sockets/index.js';
import {
  authTokenLifetimeMs,
  getAuthenticatedUser,
  login,
  registerCandidate,
  registerEmployer,
} from '../services/auth.service.js';

const COOKIE_NAME = 'jobmatch_session';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'strict',
  path: '/api',
};

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: authTokenLifetimeMs,
  });
}

export async function candidateRegister(req, res, next) {
  try {
    const result = await registerCandidate(req.validatedBody);

    setSessionCookie(res, result.token);

    res.status(201).json({
      user: result.user,
      profileId: result.profileId,
    });
  } catch (error) {
    next(error);
  }
}

export async function employerRegister(req, res, next) {
  try {
    const result = await registerEmployer(req.validatedBody);

    setSessionCookie(res, result.token);

    res.status(201).json({
      user: result.user,
      profileId: result.profileId,
    });
  } catch (error) {
    next(error);
  }
}

function roleLogin(role) {
  return async (req, res, next) => {
    try {
      const result = await login({
        ...req.validatedBody,
        expectedRole: role,
      });

      setSessionCookie(res, result.token);

      res.status(200).json({
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const candidateLogin = roleLogin('candidate');
export const employerLogin = roleLogin('employer');
export const adminLogin = roleLogin('admin');

export function logout(req, res) {
  disconnectUserSockets(req.auth.id);

  res.clearCookie(COOKIE_NAME, cookieOptions);

  res.status(200).json({
    message: 'Logged out.',
  });
}

export async function currentUser(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req.auth.id);

    if (!user) {
      res.clearCookie(COOKIE_NAME, cookieOptions);

      res.status(401).json({
        error: {
          message: 'Authentication required.',
        },
      });

      return;
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
}

export function protectedAdminAccess(req, res) {
  res.status(200).json({
    message: 'Admin access granted.',
    user: req.auth,
  });
}