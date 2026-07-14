export const EXPIRY_TIME_IN_MINS = {
  ACCESS_TOKEN: process.env.JWT_ACCESS_TOKEN_EXPIRY || 15,
  REFRESH_TOKEN: process.env.JWT_REFRESH_TOKEN_EXPIRY || 60,
  USER_TOKEN: process.env.JWT_USER_TOKEN_EXPIRY || 1440,
};

export const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_key';
