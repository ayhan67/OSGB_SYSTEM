const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const API_BASE_URL = 'http://localhost:5002';
const TEST_DURATION = 30000; // 30 seconds
const CONCURRENT_REQUESTS = 10;
const ENDPOINTS = [
  '/api/experts',
  '/api/workplaces',
  '/api/doctors',
  '/api/dsps',
  '/api/auth/me'
];

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        resolve({
          statusCode: res.statusCode,
          responseTime: endTime - startTime,
          dataSize: data.length
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = performance.now();
      reject({
        error: error.message,
        responseTime: endTime - startTime
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject({ error: 'Request timeout' });
    });
  });
}

// Function to run concurrent requests
async function runConcurrentRequests(endpoint, count) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(makeRequest(`${API_BASE_URL}${endpoint}`));
  }
  return Promise.allSettled(promises);
}

// Function to run performance test
async function runPerformanceTest() {
  console.log('Starting performance test...');
  console.log(`Test duration: ${TEST_DURATION}ms`);
  console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Endpoints: ${ENDPOINTS.join(', ')}`);
  console.log('----------------------------------------');
  
  const results = {};
  
  // Test each endpoint
  for (const endpoint of ENDPOINTS) {
    console.log(`Testing endpoint: ${endpoint}`);
    
    const startTime = performance.now();
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalResponseTime = 0;
    let responseDataSize = 0;
    const responseTimes = [];
    
    // Run requests for the test duration
    const testEndTime = startTime + TEST_DURATION;
    
    while (performance.now() < testEndTime) {
      try {
        const responses = await runConcurrentRequests(endpoint, CONCURRENT_REQUESTS);
        totalRequests += responses.length;
        
        for (const response of responses) {
          if (response.status === 'fulfilled') {
            successfulRequests++;
            totalResponseTime += response.value.responseTime;
            responseDataSize += response.value.dataSize;
            responseTimes.push(response.value.responseTime);
          } else {
            failedRequests++;
            console.error(`Request failed: ${response.reason.error}`);
          }
        }
      } catch (error) {
        console.error(`Error during concurrent requests: ${error.message}`);
        failedRequests += CONCURRENT_REQUESTS;
      }
    }
    
    const actualDuration = performance.now() - startTime;
    const avgResponseTime = successfulRequests > 0 ? totalResponseTime / successfulRequests : 0;
    const requestsPerSecond = (successfulRequests / actualDuration) * 1000;
    
    // Calculate percentiles
    responseTimes.sort((a, b) => a - b);
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p90 = responseTimes[Math.floor(responseTimes.length * 0.9)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
    
    results[endpoint] = {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: ((successfulRequests / totalRequests) * 100).toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      requestsPerSecond: requestsPerSecond.toFixed(2),
      totalDataSize: responseDataSize,
      duration: actualDuration.toFixed(2),
      percentiles: {
        p50: p50 ? p50.toFixed(2) : 'N/A',
        p90: p90 ? p90.toFixed(2) : 'N/A',
        p95: p95 ? p95.toFixed(2) : 'N/A',
        p99: p99 ? p99.toFixed(2) : 'N/A'
      }
    };
    
    console.log(`  Completed: ${successfulRequests}/${totalRequests} successful requests`);
    console.log(`  Success rate: ${results[endpoint].successRate}%`);
    console.log(`  Average response time: ${results[endpoint].avgResponseTime}ms`);
    console.log(`  Requests per second: ${results[endpoint].requestsPerSecond}`);
    console.log(`  50th percentile: ${results[endpoint].percentiles.p50}ms`);
    console.log(`  90th percentile: ${results[endpoint].percentiles.p90}ms`);
    console.log(`  95th percentile: ${results[endpoint].percentiles.p95}ms`);
    console.log(`  99th percentile: ${results[endpoint].percentiles.p99}ms`);
    console.log('----------------------------------------');
  }
  
  // Summary
  console.log('\n=== PERFORMANCE TEST SUMMARY ===');
  console.log(`Test duration: ${TEST_DURATION}ms`);
  console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log('');
  
  for (const [endpoint, result] of Object.entries(results)) {
    console.log(`${endpoint}:`);
    console.log(`  Success rate: ${result.successRate}%`);
    console.log(`  Avg response time: ${result.avgResponseTime}ms`);
    console.log(`  Requests/sec: ${result.requestsPerSecond}`);
    console.log(`  95th percentile: ${result.percentiles.p95}ms`);
    console.log('');
  }
  
  return results;
}

// Run the performance test
if (require.main === module) {
  runPerformanceTest()
    .then(() => {
      console.log('Performance test completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Performance test failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTest };