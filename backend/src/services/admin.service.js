import Application from '../models/application.model.js';
import CandidateProfile from '../models/candidate-profile.model.js';
import EmployerProfile from '../models/employer-profile.model.js';
import Job from '../models/job.model.js';
import User from '../models/user.model.js';
import { disconnectUserSockets } from '../sockets/index.js';

function pageResult(page, limit, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getPlatformOverview() {
  const [
    candidateCount,
    employerCount,
    jobCount,
    applicationCount,
    activeJobCount,
    recentApplications,
  ] = await Promise.all([
    CandidateProfile.countDocuments(),
    EmployerProfile.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments(),
    Job.countDocuments({ status: 'published' }),
    Application.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate({ path: 'job', select: 'title company', populate: { path: 'company', select: 'name' } })
      .populate({ path: 'candidate', select: 'firstName lastName' })
      .lean(),
  ]);
  return {
    counts: { candidates: candidateCount, employers: employerCount, jobs: jobCount, applications: applicationCount, activeJobs: activeJobCount },
    recentApplications: recentApplications.filter(({ job }) => job).map((application) => ({
      id: String(application._id),
      status: application.status,
      createdAt: application.createdAt,
      jobTitle: application.job.title,
      company: application.job.company?.name ?? 'Company',
      candidateName: application.candidate
        ? `${application.candidate.firstName} ${application.candidate.lastName}`.trim()
        : 'Candidate',
    })),
  };
}

export async function listPlatformUsers({ page, limit, role, status, search }) {
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) filter.email = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const [users, total] = await Promise.all([
    User.find(filter).select('email role status createdAt lastLoginAt').sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return { users, pagination: pageResult(page, limit, total) };
}

export async function updatePlatformUserStatus(actorId, userId, status) {
  if (String(actorId) === String(userId)) {
    const error = new Error('You cannot suspend your own administrator account.');
    error.statusCode = 409;
    throw error;
  }
  const user = await User.findOneAndUpdate(
    { _id: userId, role: { $ne: 'admin' } },
    { $set: { status } },
    { new: true, runValidators: true, select: 'email role status createdAt lastLoginAt' },
  ).lean();
  if (user && status === 'suspended') disconnectUserSockets(user._id);
  return user;
}

export async function listPlatformJobs({ page, limit, status }) {
  const filter = status ? { status } : {};
  const [jobs, total] = await Promise.all([
    Job.find(filter).select('title status employer company createdAt updatedAt publishedAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate({ path: 'company', select: 'name' })
      .populate({ path: 'employer', select: 'email' })
      .lean(),
    Job.countDocuments(filter),
  ]);
  return {
    jobs: jobs.map(({ _id, title, status: jobStatus, createdAt, updatedAt, publishedAt, company, employer }) => ({
      id: String(_id),
      title,
      status: jobStatus,
      createdAt,
      updatedAt,
      publishedAt,
      company: company?.name ?? 'Company',
      employerEmail: employer?.email ?? null,
    })),
    pagination: pageResult(page, limit, total),
  };
}

export async function moderatePlatformJob(jobId, status) {
  return Job.findByIdAndUpdate(
    jobId,
    { $set: { status } },
    { new: true, runValidators: true, select: 'title status updatedAt' },
  ).lean();
}
