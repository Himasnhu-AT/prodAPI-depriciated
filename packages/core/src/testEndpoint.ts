import {
  EndpointConfig,
  E2ETestConfig,
  LoadTest,
  StressTest,
} from "./config.types";
import { validateConfig } from "./validation";

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
  validateConfig(endpointConfig);

  const requestConfig: RequestInit = {
    method: endpointConfig.method,
    headers: handleUndefined(endpointConfig.header),
    body: endpointConfig.body
      ? JSON.stringify(handleUndefined(endpointConfig.body))
      : undefined,
  };

  const url = new URL(endpointConfig.url);
  if (endpointConfig.params) {
    Object.keys(handleUndefined(endpointConfig.params) || {}).forEach((key) =>
      url.searchParams.append(key, endpointConfig.params![key])
    );
  }

  const start = Date.now();
  try {
    const response = await fetch(url.toString(), requestConfig);
    const responseTime = Date.now() - start;
    const success = response.status === endpointConfig.response.status;
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (error) {
      responseBody = undefined;
    }

    // Apply validation function on the response body
   
    if (
      endpointConfig.response.body &&
      typeof endpointConfig.response.body === "function"
    ) {
      const isValid = endpointConfig.response.body(responseBody);
      if (!isValid) {
        return {
          success: false,
          status: response.status,
          responseTime,
          response: responseBody,
          error: "Response body validation failed",
        };
      }
    }

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

function handleUndefined(value: any) {
  return value !== undefined ? value : {};
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

export {
  runTests,
  TestResult,
  testEndpoint,
  runStressTest,
  runLoadTest,
  runE2ETests,
};
