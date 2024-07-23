import * as fs from "fs";
import * as path from "path";

const projectRoot = ""; //? NestJS root project, src folder...

function traverseDirectory(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      traverseDirectory(filePath);
    } else if (stats.isFile() && filePath.endsWith(".ts")) {
      analyzeFile(filePath);
    }
  }
}

function analyzeFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");

  const apiEndpoints = extractApiEndpoints(content);

  if (apiEndpoints.length > 0) {
    console.log(`File: ${filePath}`);
    console.log(`API Endpoints: ${JSON.stringify(apiEndpoints)}`);
  }
}

function extractApiEndpoints(content: string) {
  const apiEndpoints: string[] = [];

  const regex = /@(Get|Post|Put|Patch|Delete)\(["']([^"']+)["']\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const [, method, endpoint] = match;
    apiEndpoints.push(`${method.toUpperCase()}: ${endpoint}`);
  }

  return apiEndpoints;
}

traverseDirectory(projectRoot);
