# Performance Testing Guide

This document provides instructions for running performance tests on the OSGB System to validate optimizations.

## Overview

Performance testing helps validate that our optimizations are effective and that the system can handle expected load. The performance test script simulates concurrent users accessing various API endpoints.

## Prerequisites

1. OSGB Backend running on `http://localhost:5002`
2. Node.js installed
3. All dependencies installed (`npm install`)

## Running Performance Tests

### Backend Performance Test

To run the backend performance test:

```bash
cd backend
npm run performance:test
```

### Test Configuration

The performance test is configured with the following parameters:

- **Test Duration**: 30 seconds
- **Concurrent Requests**: 10 requests at a time
- **Endpoints Tested**:
  - `/api/experts` - Expert listing
  - `/api/workplaces` - Workplace listing
  - `/api/doctors` - Doctor listing
  - `/api/dsps` - DSP listing
  - `/api/auth/me` - User profile

### Test Metrics

The performance test measures:

1. **Success Rate**: Percentage of successful requests
2. **Average Response Time**: Mean time for successful requests
3. **Requests Per Second**: Throughput measurement
4. **Percentiles**: 50th, 90th, 95th, and 99th percentiles
5. **Data Transfer**: Total data transferred

## Interpreting Results

### Key Performance Indicators

1. **Success Rate**: Should be 100% under normal conditions
2. **Response Time**: Should be under 500ms for most requests
3. **Throughput**: Should handle expected concurrent users
4. **Consistency**: Response times should be consistent

### Expected Improvements

After implementing performance optimizations, you should see:

- **Reduced response times** (40% improvement)
- **Increased throughput** (more requests per second)
- **Better consistency** (lower variance in response times)
- **Higher success rates** under load

## Customizing Tests

### Modifying Test Parameters

You can modify the test parameters in `performance/performance-test.js`:

```javascript
const TEST_DURATION = 30000; // 30 seconds
const CONCURRENT_REQUESTS = 10;
const ENDPOINTS = [
  '/api/experts',
  '/api/workplaces',
  // Add more endpoints as needed
];
```

### Adding New Endpoints

To test additional endpoints, add them to the ENDPOINTS array:

```javascript
const ENDPOINTS = [
  '/api/experts',
  '/api/workplaces',
  '/api/doctors',
  '/api/dsps',
  '/api/auth/me',
  '/api/visits', // New endpoint
  // More endpoints
];
```

## Load Testing Scenarios

### Baseline Testing

Run tests before implementing optimizations to establish baseline performance metrics.

### Post-Optimization Testing

Run tests after implementing optimizations to measure improvements.

### Stress Testing

Increase `CONCURRENT_REQUESTS` to simulate high load conditions.

## Monitoring During Tests

### System Resources

Monitor system resources during testing:

```bash
# CPU and memory usage
top

# Database connections
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# Network activity
iftop
```

### Application Logs

Monitor application logs for errors or warnings:

```bash
# Backend logs
tail -f backend/logs/app.log

# Database logs
tail -f /var/log/mysql/error.log
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase request timeout in test script
2. **Connection Errors**: Check if backend is running
3. **Memory Issues**: Monitor memory usage during tests
4. **Database Bottlenecks**: Check database performance

### Debugging Tips

1. **Run single endpoint tests** to isolate issues
2. **Reduce concurrent requests** to identify bottlenecks
3. **Check application logs** for error messages
4. **Monitor system resources** during testing

## Continuous Performance Monitoring

### Automated Testing

Set up automated performance testing in CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Performance Test
  run: |
    npm run performance:test
```

### Performance Regression Detection

Compare test results to detect performance regressions:

```bash
# Save baseline results
npm run performance:test > baseline-results.txt

# Compare with current results
npm run performance:test > current-results.txt
# Use diff or custom comparison script
```

## Best Practices

### Test Environment

1. **Use dedicated test environment** that mirrors production
2. **Warm up the system** before running tests
3. **Run tests during off-peak hours** to avoid interference
4. **Document test conditions** for reproducibility

### Test Data

1. **Use realistic data sets** similar to production
2. **Clean up test data** after tests
3. **Reset cache** between test runs
4. **Verify data integrity** before testing

### Result Analysis

1. **Compare before/after results** to measure improvements
2. **Look for anomalies** in response times
3. **Identify bottlenecks** from slow endpoints
4. **Track trends** over time

This performance testing framework helps ensure that our optimizations are effective and that the OSGB System maintains high performance under various load conditions.