import { describe, it, expect } from 'vitest';
import { isUUID } from '../isUUID';

describe('isUUID', () => {
  it('should return true for a valid UUID v1', () => {
    expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('should return true for a valid UUID v4', () => {
    expect(isUUID('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')).toBe(true);
  });

  it('should return true for a valid UUID v5', () => {
    expect(isUUID('c106a26a-21bb-5538-8bf2-57095d1976c1')).toBe(true);
  });

  it('should return false for an undefined value', () => {
    expect(isUUID()).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isUUID('')).toBe(false);
  });

  it('should return false for an invalid UUID format (missing hyphens)', () => {
    expect(isUUID('9b1deb4d3b7d4bad9bdd2b0d7b3dcb6d')).toBe(false);
  });

  it('should return false for an invalid UUID format (wrong length)', () => {
    expect(isUUID('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6')).toBe(false);
  });

  it('should return false for an invalid UUID format (invalid characters)', () => {
    expect(isUUID('zb1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')).toBe(false);
  });

  it('should return false for an uppercase UUID (since regex is lowercase only)', () => {
    expect(isUUID('9B1DEB4D-3B7D-4BAD-9BDD-2B0D7B3DCB6D')).toBe(false);
  });
});
