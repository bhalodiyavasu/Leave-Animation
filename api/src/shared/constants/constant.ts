export const OTP_EXPIRY_TIME_IN_MINS = 10;

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;

export const LeaveStatus = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DELETED: 'Deleted',
};

export const UserRole = {
  ADMIN: 'Admin',
  CUSTOMER: 'Customer',
};
