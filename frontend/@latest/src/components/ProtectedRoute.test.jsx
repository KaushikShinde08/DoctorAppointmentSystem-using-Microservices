import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContent';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../context/AuthContent', () => ({
  useAuth: vi.fn(() => ({ loading: false, isAuthenticated: false })),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows loading state', () => {
    useAuth.mockReturnValue({ loading: true });
    render(<ProtectedRoute />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('redirects to login if not authenticated', () => {
    useAuth.mockReturnValue({ loading: false, isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders content if authenticated', () => {
    useAuth.mockReturnValue({ loading: false, isAuthenticated: true, user: { role: 'PATIENT' } });
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
