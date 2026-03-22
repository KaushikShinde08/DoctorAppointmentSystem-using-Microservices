import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserFromToken } from './jwt';

describe('getUserFromToken', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
    });
  });

  it('should return null if no token exists', () => {
    localStorage.getItem.mockReturnValue(null);
    const user = getUserFromToken();
    expect(user).toBeNull();
  });

  it('should return payload if valid token exists', () => {
    const payload = { userId: 1, role: 'ADMIN' };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.getItem.mockReturnValue(token);

    const user = getUserFromToken();
    expect(user).toEqual(payload);
  });
});
