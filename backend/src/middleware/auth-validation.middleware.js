const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function requiredString(body, key, { min = 1, max = 200 } = {}) {
  const value = body[key];
  if (typeof value !== 'string') throw badRequest(`${key} must be a string.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw badRequest(`${key} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

function validateEmail(body) {
  const email = requiredString(body, 'email', { max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw badRequest('A valid email address is required.');
  return email;
}

function validatePassword(body) {
  const password = body.password;
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw badRequest('Password must be at least 8 characters and no more than 72 UTF-8 bytes.');
  }
  return password;
}

function rejectUnknownFields(body, allowedFields) {
  const unknown = Object.keys(body).filter((key) => !allowedFields.includes(key));
  if (unknown.length) {
    throw badRequest(`Unexpected field: ${unknown[0]}.`);
  }
}

export function validateCandidateRegistration(req, res, done) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw badRequest('A JSON object request body is required.');
    }
    rejectUnknownFields(req.body, ['email', 'password', 'firstName', 'lastName']);
    req.validatedBody = {
      email: validateEmail(req.body),
      password: validatePassword(req.body),
      firstName: requiredString(req.body, 'firstName', { max: 80 }),
      lastName: requiredString(req.body, 'lastName', { max: 80 }),
    };
    done();
  } catch (error) {
    done(error);
  }
}

export function validateEmployerRegistration(req, res, done) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw badRequest('A JSON object request body is required.');
    }
    rejectUnknownFields(req.body, [
      'email',
      'password',
      'firstName',
      'lastName',
      'companyName',
      'companyWebsite',
      'industry',
      'jobTitle',
    ]);
    const companyWebsite = req.body.companyWebsite
      ? requiredString(req.body, 'companyWebsite', { max: 2048 })
      : undefined;
    if (companyWebsite) {
      let parsedUrl;
      try {
        parsedUrl = new URL(companyWebsite);
      } catch {
        throw badRequest('companyWebsite must be a valid HTTP or HTTPS URL.');
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw badRequest('companyWebsite must be a valid HTTP or HTTPS URL.');
      }
    }
    req.validatedBody = {
      email: validateEmail(req.body),
      password: validatePassword(req.body),
      firstName: requiredString(req.body, 'firstName', { max: 80 }),
      lastName: requiredString(req.body, 'lastName', { max: 80 }),
      companyName: requiredString(req.body, 'companyName', { max: 200 }),
      companyWebsite,
      industry: req.body.industry
        ? requiredString(req.body, 'industry', { max: 120 })
        : undefined,
      jobTitle: req.body.jobTitle
        ? requiredString(req.body, 'jobTitle', { max: 160 })
        : undefined,
    };
    done();
  } catch (error) {
    done(error);
  }
}

export function validateLogin(req, res, done) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw badRequest('A JSON object request body is required.');
    }
    rejectUnknownFields(req.body, ['email', 'password']);
    req.validatedBody = {
      email: validateEmail(req.body),
      password: validatePassword(req.body),
    };
    done();
  } catch (error) {
    done(error);
  }
}
