import { E2ETestConfig, LoadTest, StressTest } from "./config.types";
import { runTests, TestResult } from "./testEndpoint";

// Example E2E Test Configuration
const e2eTestConfig: E2ETestConfig = {
  name: "Sample E2E Test",
  steps: [
    {
      name: "Test Endpoint 1",
      method: "GET",
      url: "https://example.com/",
      response: {
        status: 200,
        body: {},
      },
    },
  ],
};

// Example Load Test Configuration
const loadTestConfig: LoadTest = {
  requests: 100,
  concurrency: 10,
  endpoint: {
    name: "Load Test Endpoint",
    method: "GET",
    url: "https://example.com/",
    response: {
      status: 200,
      body: {},
    },
  },
};

// Example Stress Test Configuration
const stressTestConfig: StressTest = {
  duration: "1m",
  requests: 10,
  concurrency: 2,
  endpoint: {
    name: "Stress Test Endpoint",
    method: "POST",
    url: "https://example.com/",
    response: {
      status: 200,
      body: {},
    },
  },
};

async function runAllTests() {
  // const e2eResults: TestResult[] = await runTests(e2eTestConfig);
  // console.log("E2E Test Results:", e2eResults);
  // const loadTestResults: TestResult[] = await runTests(loadTestConfig);
  // console.log("Load Test Results:", loadTestResults);
  const stressTestResults: TestResult[] = await runTests(stressTestConfig);
  console.log("Stress Test Results:", stressTestResults);
}

runAllTests();
