import { describe, it, expect, beforeEach } from "vitest";
import { createContext } from "unctx";
import {
  InfoObjectSchema,
  SourceDescriptionObjectSchema,
  WorkflowObjectSchema,
  StepObjectSchema,
  ArazzoSpecificationObjectSchema,
} from "../src/schemas";

// Create a context for testing
const testContext = createContext();

// Mock context for the test suite
const mockContext = {
  arazzo: "1.0.0", // Add the required 'arazzo' field
  info: {
    title: "Test Workflow",
    version: "1.0.0",
    summary: "A test summary",
    description: "A detailed description of the workflow.",
  },
  sourceDescriptions: [
    {
      name: "testSource",
      url: "https://example.com/openapi.yaml",
      type: "openapi",
    },
  ],
  workflows: [
    {
      workflowId: "testWorkflow",
      summary: "A test workflow",
      description: "This workflow tests the validation of the workflow object.",
      steps: [
        {
          stepId: "testStep",
          description: "A minimal step description",
          operationId: "testOperation", // Adjust this field based on schema requirements
        },
      ],
    },
  ],
};

describe("Arazzo Schema Validation with unctx - Debugging", () => {
  beforeEach(() => {
    testContext.call(mockContext, () => {});
  });

  it("should validate Info Object from context", () => {
    testContext.call(mockContext, () => {
      const infoObject = testContext.use()?.info;

      const result = InfoObjectSchema.safeParse(infoObject);

      console.log("InfoObject Validation Result:", result.success, result.error?.issues);

      expect(result.success).toBe(true);
    });
  });

  it("should validate Source Description Object from context", () => {
    testContext.call(mockContext, () => {
      const sourceDescription = testContext.use()?.sourceDescriptions[0];

      const result = SourceDescriptionObjectSchema.safeParse(sourceDescription);

      console.log("SourceDescription Validation Result:", result.success, result.error?.issues);

      expect(result.success).toBe(true);
    });
  });

  it("should validate Workflow Object from context", () => {
    testContext.call(mockContext, () => {
      const workflowObject = testContext.use()?.workflows[0];

      const result = WorkflowObjectSchema.safeParse(workflowObject);

      console.log("WorkflowObject Validation Result:", result.success, result.error?.issues);

      expect(result.success).toBe(true);
    });
  });

  it("should validate Step Object from context", () => {
    testContext.call(mockContext, () => {
      const stepObject = testContext.use()?.workflows[0]?.steps[0];

      const result = StepObjectSchema.safeParse(stepObject);

      console.log("StepObject Validation Result:", result.success, result.error?.issues);

      expect(result.success).toBe(true);
    });
  });

  it("should validate Arazzo Specification Object from context", () => {
    testContext.call(mockContext, () => {
      const arazzoSpec = testContext.use();

      const result = ArazzoSpecificationObjectSchema.safeParse(arazzoSpec);

      console.log("ArazzoSpecification Validation Result:", result.success, result.error?.issues);

      expect(result.success).toBe(true);
    });
  });
});
