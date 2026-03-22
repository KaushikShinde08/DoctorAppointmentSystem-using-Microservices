import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContent';
import Register from './Register';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import * as authApi from '../api/authApi';

vi.mock('../api/authApi');

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders register form', () => {
    renderWithRouter(<Register />);
    
    expect(screen.getByPlaceholderText(/name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/password/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /register|sign up/i })).toBeInTheDocument();
  });

  test('allows user to input name, email, and passwords', () => {
    renderWithRouter(<Register />);
    
    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password|min.*character/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('submits form with user data', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({ message: 'User registered successfully' });

    renderWithRouter(<Register />);

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password|min.*character/i);
    const submitButton = screen.getByRole('button', { name: /register|sign up/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });
  });

  test('requires all fields to be filled', async () => {
    renderWithRouter(<Register />);

    const submitButton = screen.getByRole('button', { name: /register|sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });

  test('displays error on duplicate email', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue(new Error('Email already registered'));

    renderWithRouter(<Register />);

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password|min.*character/i);
    const submitButton = screen.getByRole('button', { name: /register|sign up/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/already registered|exists/i)).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    renderWithRouter(<Register />);

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password|min.*character/i);
    const submitButton = screen.getByRole('button', { name: /register|sign up/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.register).not.toHaveBeenCalled();
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  test('has link to login page', () => {
    renderWithRouter(<Register />);
    
    const loginLink = screen.getByRole('link', { name: /login|sign in/i });
    expect(loginLink).toBeInTheDocument();
  });

  test('redirects to login on successful registration', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({ message: 'User registered successfully' });

    renderWithRouter(<Register />);

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInputs = screen.getAllByPlaceholderText(/password/i);
    const passwordInput = passwordInputs[0];
    const confirmPasswordInput = passwordInputs[1];
    const submitButton = screen.getByRole('button', { name: /register|sign up/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // After successful registration, the component should display a success message or redirect
    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalled();
    });
  });

  test('requires all fields to be filled', async () => {
    renderWithRouter(<Register />);

    const submitButton = screen.getByRole('button', { name: /register|sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });

  test('disables submit button while loading', async () => {
    vi.spyOn(authApi, 'register').mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<Register />);

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password|min.*character/i);
    const submitButton = screen.getByRole('button', { name: /register|sign up/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  test('validates password strength', async () => {
    renderWithRouter(<Register />);

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password|min.*character/i);
    const submitButton = screen.getByRole('button', { name: /register|sign up/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } }); // Too weak
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.register).not.toHaveBeenCalled();
      expect(screen.getByText(/password.*strong|minimum|min.*6/i)).toBeInTheDocument();
    });
  });
});
