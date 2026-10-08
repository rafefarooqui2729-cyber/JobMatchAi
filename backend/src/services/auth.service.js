import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import env from '../config/env.js';
import CandidateProfile from '../models/candidate-profile.model.js';
import Company from '../models/company.model.js';
import EmployerProfile from '../models/employer-profile.model.js';
import User from '../models/user.model.js';

const SALT_ROUNDS = 12;
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24;

function getJwtSecret() {
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    const error = new Error(
      'Authentication is not configured. Set JWT_SECRET to at least 32 characters.',
    );

    error.statusCode = 500;
    throw error;
  }

  return env.jwtSecret;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

function signAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
    },
    getJwtSecret(),
    {
      subject: user.id,
      expiresIn: TOKEN_LIFETIME_SECONDS,
      issuer: 'jobmatch-ai',
      audience: 'jobmatch-ai-web',
    },
  );
}

async function createUser({ email, password, role }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return User.create({
    email,
    passwordHash,
    role,
  });
}

function throwDuplicateEmail(error) {
  if (error?.code === 11000 && error?.keyPattern?.email) {
    const conflict = new Error(
      'An account with this email already exists.',
    );

    conflict.statusCode = 409;
    throw conflict;
  }

  throw error;
}

export async function registerCandidate(input) {
  let user;
  let profile;

  try {
    user = await createUser({
      ...input,
      role: 'candidate',
    });

    profile = await CandidateProfile.create({
      user: user._id,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    return {
      user: publicUser(user),
      profileId: profile.id,
      token: signAccessToken(user),
    };
  } catch (error) {
    if (user) {
      if (profile) {
        await CandidateProfile.deleteOne({
          _id: profile._id,
        });
      }

      await User.deleteOne({
        _id: user._id,
      });
    }

    throwDuplicateEmail(error);
  }
}

export async function registerEmployer(input) {
  let user;
  let company;

  try {
    user = await createUser({
      ...input,
      role: 'employer',
    });

    const slugBase = input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 190);

    company = await Company.create({
      name: input.companyName,
      slug: `${slugBase || 'company'}-${user.id.slice(-8)}`,
      website: input.companyWebsite || undefined,
      industry: input.industry || undefined,
      createdBy: user._id,
    });

    const profile = await EmployerProfile.create({
      user: user._id,
      company: company._id,
      firstName: input.firstName,
      lastName: input.lastName,
      jobTitle: input.jobTitle || undefined,
      companyRole: 'owner',
    });

    return {
      user: publicUser(user),
      profileId: profile.id,
      token: signAccessToken(user),
    };
  } catch (error) {
    if (user) {
      await EmployerProfile.deleteOne({
        user: user._id,
      });

      if (company) {
        await Company.deleteOne({
          _id: company._id,
        });
      }

      await User.deleteOne({
        _id: user._id,
      });
    }

    throwDuplicateEmail(error);
  }
}

export async function login({
  email,
  password,
  expectedRole,
}) {
  const user = await User.findOne({
    email,
  }).select('+passwordHash');

  const isValid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (
    !isValid ||
    user.role !== expectedRole ||
    user.status !== 'active'
  ) {
    const error = new Error(
      'Invalid email or password.',
    );

    error.statusCode = 401;
    throw error;
  }

  user.lastLoginAt = new Date();

  await user.save();

  return {
    user: publicUser(user),
    token: signAccessToken(user),
  };
}

/**
 * Retrieves the currently authenticated user.
 *
 * This is deliberately restricted to active users.
 * A valid JWT belonging to a suspended/deleted user therefore
 * cannot continue to authenticate API requests.
 */
export async function getAuthenticatedUser(userId) {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }

  const user = await User.findOne({
    _id: userId,
    status: 'active',
  });

  return user
    ? publicUser(user)
    : null;
}

export function verifyAccessToken(token) {
  return jwt.verify(
    token,
    getJwtSecret(),
    {
      issuer: 'jobmatch-ai',
      audience: 'jobmatch-ai-web',
      algorithms: ['HS256'],
    },
  );
}

export const authTokenLifetimeMs =
  TOKEN_LIFETIME_SECONDS * 1000;