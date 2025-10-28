import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../src/components/LoginPage';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the API functions
jest.mock('../../src/services/api', () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

import * as api from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

// Mock the useAuth hook
const mockAuth = {
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
  user: null,
  organizationId: null,
};

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form by default', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should switch to register form when register button is clicked', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
  });

  it('should handle login successfully', async () => {
    const mockLoginResponse = {
      token: 'test-token',
      user: {
        id: 1,
        username: 'testuser',
        fullName: 'Test User',
        role: 'user',
        organizationId: 1,
      },
    };

    (api.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'testpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Wait for async operations
    await screen.findByText('Login');

    expect(api.login).toHaveBeenCalledWith('testuser', 'testpassword');
    expect(mockAuth.login).toHaveBeenCalledWith(mockLoginResponse.user);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should handle login error', async () => {
    (api.login as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Wait for error message
    const errorMessage = await screen.findByText('Login failed');
    expect(errorMessage).toBeInTheDocument();
  });

  it('should handle registration successfully', async () => {
    // Switch to register form
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    const mockRegisterResponse = {
      token: 'test-token',
      user: {
        id: 2,
        username: 'newuser',
        fullName: 'New User',
        role: 'user',
        organizationId: 1,
      },
    };

    (api.register as jest.Mock).mockResolvedValueOnce(mockRegisterResponse);

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'New User' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    // Wait for async operations
    await screen.findByText('Register');

    expect(api.register).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'newpassword',
      fullName: 'New User',
    });
    expect(mockAuth.login).toHaveBeenCalledWith(mockRegisterResponse.user);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should validate password strength during registration', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Switch to register form
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'weak' }, // Weak password
    });
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'New User' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    // Should show password strength error
    const errorMessage = await screen.findByText(
      'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
    );
    expect(errorMessage).toBeInTheDocument();
  });
});