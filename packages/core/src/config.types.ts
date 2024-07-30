export type ValidationFunction = (value: any) => boolean;

export interface EndpointConfig {
  name: string; // Name of the endpoint
  method: string; // HTTP method
  url: string; // URL of the endpoint
  header?: Record<string, string> | undefined; // Headers of the endpoint
  body?: Record<string, any> | undefined; // Body of the endpoint
  params?: Record<string, string> | undefined; // Parameters of the endpoint
  response: {
    status: number; // Status of the response
    body: Record<string, any> | undefined; // Body of the response
    header?: Record<string, string> | undefined; // Headers of the response
    cookies?: Record<string, string> | undefined; // Cookies of the response
  };
}

export type E2ETestConfig = {
  name: string; // Name of the test
  steps: EndpointConfig[]; // Endpoints covered
};

export interface LoadTest {
  requests: number; // Number of requests
  concurrency: number; // Number of concurrent requests
  endpoint: EndpointConfig; // Endpoint to test
}

export interface StressTest {
  duration: string; // Duration of the test
  requests: number; // Number of requests
  concurrency: number; // Number of concurrent requests
  endpoint: EndpointConfig; // Endpoint to test
}
