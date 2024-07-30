import { EndpointConfig, ValidationFunction } from "./config.types";

export const isNotNull: ValidationFunction = (value) => value !== null;
export const isString: ValidationFunction = (value) =>
  typeof value === "string";

export function validateConfig(config: EndpointConfig): boolean {
  // Validate URL
  if (typeof config.url !== "string" || !config.url) {
    throw new Error("Invalid URL");
  }

  // Validate endpoint name
  if (typeof config.name !== "string" || !config.name) {
    throw new Error("Invalid endpoint name");
  }

  // Validate headers
  if (config.header && typeof config.header !== "object") {
    throw new Error("Invalid header configuration");
  }

  // Validate body
  if (
    config.body &&
    !["object", "string", "number"].includes(typeof config.body)
  ) {
    throw new Error("Invalid body configuration");
  }

  // Validate response
  if (config.response) {
    if (config.response.header) {
      // Add your specific header validation logic here
    }

    if (
      config.response.body &&
      typeof config.response.body === "function" &&
      !config.response.body(config.response.body)
    ) {
      throw new Error("Response body validation failed");
    }
  }

  return true;
}
