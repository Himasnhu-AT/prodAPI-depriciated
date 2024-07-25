import {
  EndpointConfig,
  E2ETestConfig,
  LoadTest,
  StressTest,
} from "./config.types";

interface TestResult {
  success: boolean;
  status?: number;
  responseTime?: number;
  error?: any;
  response?: any;
}

async function testEndpoint(
  endpointConfig: EndpointConfig
): Promise<TestResult> {
  const requestConfig: RequestInit = {
    method: endpointConfig.method,
    headers: endpointConfig.header,
    body: endpointConfig.body ? JSON.stringify(endpointConfig.body) : undefined,
  };

  const url = new URL(endpointConfig.url);
  if (endpointConfig.params) {
    Object.keys(endpointConfig.params).forEach((key) =>
      url.searchParams.append(key, endpointConfig.params![key])
    );
  }

  const start = Date.now();
  const response = await fetch(url.toString(), requestConfig);
  console.warn("Response:", response);
  try {
    const responseTime = Date.now() - start;
    const success = response.status === endpointConfig.response.status;
    const responseBody = await response.json();

    return {
      success,
      status: response.status,
      responseTime,
      response: responseBody,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}

async function runE2ETests(testConfig: E2ETestConfig): Promise<TestResult[]> {
  console.log("Running E2E Tests:", testConfig.name);
  const results: TestResult[] = [];
  for (const step of testConfig.steps) {
    const result = await testEndpoint(step);
    console.log("Step:", step.name, "Result:", result);
    results.push(result);
  }
  return results;
}

async function runLoadTest(loadTest: LoadTest): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const promises: Promise<TestResult>[] = [];
  for (let i = 0; i < loadTest.requests; i++) {
    if (i % loadTest.concurrency === 0) {
      await Promise.all(promises);
      promises.length = 0;
    }
    promises.push(testEndpoint(loadTest.endpoint));
  }
  results.push(...(await Promise.all(promises)));
  return results;
}

async function runStressTest(stressTest: StressTest): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const promises: Promise<TestResult>[] = [];
  const endTime = Date.now() + parseDuration(stressTest.duration);

  while (Date.now() < endTime) {
    for (let i = 0; i < stressTest.requests; i++) {
      if (i % stressTest.concurrency === 0) {
        await Promise.all(promises);
        promises.length = 0;
      }
      promises.push(testEndpoint(stressTest.endpoint));
    }
    results.push(...(await Promise.all(promises)));
  }

  return results;
}

function parseDuration(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new Error("Invalid duration format");

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error("Invalid duration unit");
  }
}

async function runTests(
  config: E2ETestConfig | LoadTest | StressTest
): Promise<TestResult[]> {
  if ("steps" in config) {
    return await runE2ETests(config);
  } else if ("requests" in config && "concurrency" in config) {
    if ("duration" in config) {
      return await runStressTest(config);
    } else {
      return await runLoadTest(config);
    }
  }
  throw new Error("Invalid configuration");
}

export { runTests, TestResult };
