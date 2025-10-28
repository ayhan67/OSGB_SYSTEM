# Testing Guide for OSGB System

This guide provides instructions and best practices for writing and running tests in the OSGB System.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Test Structure](#test-structure)
3. [Writing Tests](#writing-tests)
4. [Running Tests](#running-tests)
5. [Test Best Practices](#test-best-practices)
6. [Debugging Tests](#debugging-tests)
7. [Coverage Analysis](#coverage-analysis)
8. [Continuous Integration](#continuous-integration)

## Getting Started

### Prerequisites

Before running tests, ensure you have:

1. Node.js installed (version 14 or higher)
2. All dependencies installed:
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd frontend/OSGB.Frontend
   npm install
   ```

### Test Frameworks

- **Backend**: Jest with Supertest
- **Frontend**: Jest with React Testing Library

## Test Structure

### Backend Test Structure

```
backend/
├── __tests__/
│   ├── setup.js              # Global test setup
│   ├── auth.test.js          # Authentication tests
│   ├── expertController.test.js  # Expert controller tests
│   ├── workplaceController.test.js  # Workplace controller tests
│   ├── models.test.js        # Model validation tests
│   ├── middleware.test.js    # Middleware tests
│   └── integration.test.js   # Integration tests
```

### Frontend Test Structure

```
frontend/OSGB.Frontend/
├── __tests__/
│   ├── api.test.ts           # API service tests
│   └── components/
│       └── LoginPage.test.tsx # Component tests
├── src/
│   └── setupTests.ts         # Test setup configuration
```

## Writing Tests

### Backend Test Examples

#### Unit Test Example

```javascript
// Testing a controller function
describe('Expert Controller', () => {
  describe('GET /experts', () => {
    it('should get all experts for the organization', async () => {
      // Arrange
      const mockExperts = [{ id: 1, name: 'Test Expert' }];
      
      // Act
      const response = await request(app)
        .get('/experts')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual(mockExperts);
    });
  });
});
```

#### Integration Test Example

```javascript
// Testing complete flow
describe('Integration Tests', () => {
  it('should create, retrieve, update, and delete an expert', async () => {
    // Create
    const createResponse = await request(app)
      .post('/api/experts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'John',
        lastName: 'Expert',
        phone: '5551234567',
        expertiseClass: 'A',
        assignedMinutes: 11900
      })
      .expect(201);

    const expertId = createResponse.body.id;

    // Retrieve
    await request(app)
      .get(`/api/experts/${expertId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Update
    await request(app)
      .put(`/api/experts/${expertId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lastName: 'Updated Expert' })
      .expect(200);

    // Delete
    await request(app)
      .delete(`/api/experts/${expertId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
```

### Frontend Test Examples

#### Component Test Example

```typescript
// Testing a React component
import { render, screen, fireEvent } from '@testing-library/react';

describe('LoginPage', () => {
  it('should handle login successfully', async () => {
    // Mock API response
    (api.login as jest.Mock).mockResolvedValueOnce({
      token: 'test-token',
      user: { id: 1, username: 'testuser' }
    });

    // Render component
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Simulate user actions
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'testpassword' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Wait for async operations and assert
    await screen.findByText('Dashboard');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
```

#### API Service Test Example

```typescript
// Testing API service functions
describe('API Service', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should login successfully', async () => {
    // Mock fetch response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'test-token' })
    });

    // Call function
    const result = await api.login('testuser', 'testpassword');

    // Assert
    expect(result).toEqual({ token: 'test-token' });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5002/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpassword'
        })
      })
    );
  });
});
```

## Running Tests

### Backend Tests

```bash
# Run all tests
cd backend
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx jest __tests__/auth.test.js

# Run tests matching a pattern
npx jest --testNamePattern="should create expert"
```

### Frontend Tests

```bash
# Run all tests
cd frontend/OSGB.Frontend
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- __tests__/api.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="login"
```

## Test Best Practices

### General Principles

1. **Write Clear Test Names**
   ```javascript
   // Good
   it('should return 404 for non-existent expert', () => { ... });
   
   // Bad
   it('should fail', () => { ... });
   ```

2. **Follow AAA Pattern (Arrange, Act, Assert)**
   ```javascript
   it('should create expert successfully', () => {
     // Arrange
     const expertData = { name: 'Test Expert' };
     
     // Act
     const result = createExpert(expertData);
     
     // Assert
     expect(result).toHaveProperty('name', 'Test Expert');
   });
   ```

3. **Keep Tests Independent**
   ```javascript
   // Each test should be able to run independently
   beforeEach(() => {
     // Reset state before each test
   });
   ```

4. **Use Descriptive Assertions**
   ```javascript
   // Good
   expect(response.status).toBe(200);
   expect(response.body).toHaveProperty('id');
   
   // Bad
   expect(response).toBeDefined();
   ```

### Mocking Best Practices

1. **Mock External Dependencies**
   ```javascript
   // Mock API calls
   jest.mock('../services/api', () => ({
     login: jest.fn()
   }));
   ```

2. **Reset Mocks Between Tests**
   ```javascript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **Use Realistic Mock Data**
   ```javascript
   const mockUser = {
     id: 1,
     username: 'testuser',
     email: 'test@example.com'
   };
   ```

### Test Data Management

1. **Use Factory Functions**
   ```javascript
   const createTestUser = (overrides = {}) => ({
     id: 1,
     username: 'testuser',
     ...overrides
   });
   ```

2. **Clean Up Test Data**
   ```javascript
   afterEach(() => {
     // Clean up after each test
   });
   ```

## Debugging Tests

### Common Debugging Techniques

1. **Console Logging**
   ```javascript
   it('should debug test', () => {
     console.log('Debug information:', testData);
     // Test code here
   });
   ```

2. **Interactive Debugging**
   ```bash
   # Run tests in debug mode
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

3. **Focused Testing**
   ```javascript
   // Run only this test
   it.only('should run this test only', () => { ... });
   
   // Skip this test
   it.skip('should skip this test', () => { ... });
   ```

### Troubleshooting Common Issues

1. **Async Test Issues**
   ```javascript
   // Make sure to return promises or use async/await
   it('should handle async operation', async () => {
     const result = await asyncFunction();
     expect(result).toBe('expected');
   });
   ```

2. **Mock Issues**
   ```javascript
   // Ensure mocks are properly reset
   beforeEach(() => {
     jest.resetAllMocks();
   });
   ```

3. **Database Issues**
   ```javascript
   // Ensure test database is properly set up
   beforeAll(async () => {
     await sequelize.sync({ force: true });
   });
   ```

## Coverage Analysis

### Running Coverage Reports

```bash
# Backend coverage
cd backend
npm run test:coverage

# Frontend coverage
cd frontend/OSGB.Frontend
npm run test:coverage
```

### Coverage Thresholds

Our project aims for:
- **Statements**: 80% coverage
- **Branches**: 70% coverage
- **Functions**: 80% coverage
- **Lines**: 80% coverage

### Coverage Report Locations

- **Backend**: `backend/coverage/`
- **Frontend**: `frontend/OSGB.Frontend/coverage/`

## Continuous Integration

### GitHub Actions Workflow

Tests are automatically run in our CI pipeline:

```yaml
# In .github/workflows/ci-cd.yml
- name: Run backend tests
  run: |
    cd backend
    npm test

- name: Run frontend tests
  run: |
    cd frontend/OSGB.Frontend
    npm test
```

### Test Results

- **Passing Tests**: Green checkmark in CI
- **Failing Tests**: Red X with error details
- **Coverage Reports**: Available in CI artifacts

## Additional Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

### Tools

- **VS Code Jest Extension**: For integrated test running
- **Wallaby.js**: For real-time test feedback
- **CodeCov**: For detailed coverage analysis

### Community

- **Stack Overflow**: For troubleshooting specific issues
- **GitHub Issues**: For reporting bugs in testing tools
- **Discord/Slack**: For real-time help from the community

This guide should help you effectively write, run, and maintain tests for the OSGB System. Remember that good tests are an investment in the long-term quality and maintainability of the application.