import { EndpointConfig, ValidationFunction } from "./config.types";

export const isNotNull: ValidationFunction = (value) => value !== null;
export const isString: ValidationFunction = (value) =>
  typeof value === "string";
export const isObject: ValidationFunction = (value) =>
  typeof value === "object" && value !== null;
export const isHttpMethod: ValidationFunction = (value) =>
  ["GET", "POST", "PUT", "DELETE"].includes(value.toUpperCase());

export function validateConfig(config: EndpointConfig): boolean {
  // Validate URL
  if (typeof config.url !== "string" || !config.url) {
    throw new Error("Invalid URL");
  }

  // Validate endpoint name
  if (typeof config.name !== "string" || !config.name) {
    throw new Error("Invalid endpoint name");
  }

    // Validate method
    if (!["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "CONNECT", "PATCH", "TRACE"].includes(config.method.toUpperCase())) {
      throw new Error("Invalid HTTP method");
    }

  // Validate headers
  if (config.header && typeof config.header !== "object") {
    throw new Error("Header configuration must be an object with string values");
  }

  // Validate body
  if (
    config.body &&
    !["object", "string", "number"].includes(typeof config.body)
  ) {
    throw new Error("Body must be an object, string, or number");
  }

  // Validate response
  if (config.response) {
    if (config.response.status < 100 || config.response.status > 599) {
      throw new Error("Response status must be a valid HTTP status code");
    }

    if (config.response.header) {
      // Add your specific header validation logic here
      if (typeof config.response.header !== "object") {
        throw new Error("Response header configuration must be an object with string values");
      }
      for (const key in config.response.header) {
        if (typeof config.response.header[key] !== "string") {
          throw new Error(`Response header value for ${key} must be a string`);
        }
      }

      if (
        config.response.body &&
        typeof config.response.body === "function" &&
        !config.response.body(config.response.body)
      ) {
        throw new Error("Response body validation failed");
      }
    }

    if (config.response.cookies) {
      if (typeof config.response.cookies !== "object") {
        throw new Error("Response cookies configuration must be an object with string values");
      }
      for (const key in config.response.cookies) {
        if (typeof config.response.cookies[key] !== "string") {
          throw new Error(`Response cookie value for ${key} must be a string`);
        }
      }
    }
  

    return true;
  }

  return true; 

}
