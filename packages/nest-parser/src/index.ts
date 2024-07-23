// Sample code, not functioning right now

import {
  Project,
  SourceFile,
  ImportDeclaration,
  MethodDeclaration,
} from "ts-simple-ast";

// Define the root directory of your NestJS project
const projectRoot =
  "/Users/himanshu/codes/projects/noterai/apps/server/backend";

// Function to analyze a single TypeScript file
function analyzeFile(filePath: string) {
  const project = new Project();
  const sourceFile = project.addExistingSourceFile(filePath);

  // Example: Extract API-related information (customize this part)
  const apiEndpoints = extractApiEndpoints(sourceFile);

  console.log(`File: ${filePath}`);
  console.log(`API Endpoints:`);
  apiEndpoints.forEach((endpoint) => {
    console.log(`- ${endpoint}`);
  });

  // Save changes (optional)
  project.saveSync();
}

// Example: Extract API endpoints from a SourceFile
function extractApiEndpoints(sourceFile: SourceFile) {
  const apiEndpoints: string[] = [];

  // You can traverse the AST here to find decorators, classes, methods, etc.
  // For simplicity, let's assume we're looking for @Get() and @Post() decorators
  sourceFile.forEachDescendant((node) => {
    if (node.getKindName() === "MethodDeclaration") {
      const decorators = (node as MethodDeclaration).getDecorators();
      decorators.forEach((decorator) => {
        if (
          decorator.getText().includes("@Get") ||
          decorator.getText().includes("@Post")
        ) {
          // Extract relevant information (e.g., route path, method name, etc.)
          apiEndpoints.push((node as MethodDeclaration).getName());
        }
      });
    }
  });

  return apiEndpoints;
}

// Start the analysis
analyzeFile(
  "/Users/himanshu/codes/projects/noterai/apps/server/backend/src/api/auth/auth.controller.ts"
);
