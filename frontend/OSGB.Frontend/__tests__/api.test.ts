// Mock fetch API
global.fetch = jest.fn();

import * as api from '../src/services/api';

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    (fetch as jest.Mock).mockClear();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        token: 'test-token',
        user: {
          id: 1,
          username: 'testuser',
          fullName: 'Test User',
          role: 'user',
          organizationId: 1
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.login('testuser', 'testpassword');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'testpassword'
          })
        })
      );
    });

    it('should handle login errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      });

      await expect(api.login('testuser', 'wrongpassword'))
        .rejects
        .toThrow('Invalid credentials');
    });

    it('should register successfully', async () => {
      const mockResponse = {
        token: 'test-token',
        user: {
          id: 2,
          username: 'newuser',
          fullName: 'New User',
          role: 'user',
          organizationId: 1
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const userData = {
        username: 'newuser',
        password: 'newpassword',
        fullName: 'New User'
      };

      const result = await api.register(userData);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })
      );
    });
  });

  describe('Expert API', () => {
    it('should get all experts', async () => {
      const mockExperts = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          phone: '555 123 45 67',
          expertiseClass: 'A',
          assignedMinutes: 11900
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExperts)
      });

      api.setAuthToken('test-token');
      const result = await api.getAllExperts();

      expect(result).toEqual(mockExperts);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/experts',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('should create an expert', async () => {
      const newExpert = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555 987 65 43',
        expertiseClass: 'B',
        assignedMinutes: 10000
      };

      const mockResponse = {
        id: 2,
        ...newExpert
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      api.setAuthToken('test-token');
      const result = await api.createExpert(newExpert);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/experts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify(newExpert)
        })
      );
    });
  });

  describe('Workplace API', () => {
    it('should get all workplaces', async () => {
      const mockWorkplaces = [
        {
          id: 1,
          name: 'Test Workplace',
          address: '123 Test Street',
          riskLevel: 'low',
          employeeCount: 50
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWorkplaces)
      });

      api.setAuthToken('test-token');
      const result = await api.getAllWorkplaces();

      expect(result).toEqual(mockWorkplaces);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/workplaces',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        })
      );
    });

    it('should create a workplace', async () => {
      const newWorkplace = {
        name: 'New Workplace',
        address: '456 New Street',
        sskRegistrationNo: '1234567890',
        taxOffice: 'New Tax Office',
        taxNumber: '1234567890',
        price: 1000.00,
        riskLevel: 'dangerous',
        employeeCount: 100
      };

      const mockResponse = {
        id: 2,
        ...newWorkplace
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      api.setAuthToken('test-token');
      const result = await api.createWorkplace(newWorkplace);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/workplaces',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify(newWorkplace)
        })
      );
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize string inputs', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = (api as any).sanitizeInput(maliciousInput);
      expect(sanitized).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Hello World');
    });

    it('should sanitize object inputs', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>Test',
        description: 'Normal text'
      };
      const sanitized = (api as any).sanitizeObject(maliciousObject);
      expect(sanitized.name).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Test');
      expect(sanitized.description).toBe('Normal text');
    });
  });
});