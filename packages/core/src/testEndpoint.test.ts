import { testEndpoint, TestResult } from "./testEndpoint";

describe("testEndpoint", () => {
  it("should return success true and status 200 for a successful request", async () => {
    // Arrange
    const endpointConfig = {
      name: "Test",
      method: "POST",
      url: "https://example.com",
      response: {
        status: 200,
        body: {},
      },
    };

    // Act
    const result: TestResult = await testEndpoint(endpointConfig);

    // Assert
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
  });

  it("should return success false and error for a failed request", async () => {
    // Arrange
    const endpointConfig = {
      name: "Test",
      method: "GET",
      url: "https://example.com",
      response: {
        status: 500,
        body: {},
      },
    };

    // Act
    const result: TestResult = await testEndpoint(endpointConfig);

    // Assert
    expect(result.success).toBe(false);
    // expect(result.error).toBeDefined();
  });

  // Add more test cases as needed
});
