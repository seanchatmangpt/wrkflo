import { describe, it, expect } from "vitest";
import yaml from "yaml";
import {
  InfoObjectSchema,
  SourceDescriptionObjectSchema,
  WorkflowObjectSchema,
  StepObjectSchema,
  ArazzoSpecificationObjectSchema,
} from "../src/schemas"; // Adjust the path as necessary

describe("Arazzo Schema Validation - Happy Path", () => {
  it("should validate a minimal Info Object", () => {
    const infoObject = {
      title: "Test Workflow",
      version: "1.0.0",
      summary: "A test summary",
      description: "A detailed description of the workflow.",
    };

    const result = InfoObjectSchema.safeParse(infoObject);

    expect(result.success).toBe(true);
    if (!result.success) {
      console.error(result.error.errors);
    }
  });

  it("should validate a minimal Source Description Object", () => {
    const sourceDescription = {
      name: "testSource",
      url: "https://example.com/openapi.yaml",
      type: "openapi",
    };

    const result = SourceDescriptionObjectSchema.safeParse(sourceDescription);

    expect(result.success).toBe(true);
    if (!result.success) {
      console.error(result.error.errors);
    }
  });

  it("should validate a minimal Workflow Object", () => {
    const workflowObject = {
      workflowId: "testWorkflow",
      summary: "A test workflow",
      description: "This workflow tests the validation of the workflow object.",
      steps: [
        {
          stepId: "testStep",
          description: "A minimal step",
          operationId: "testOperation",
        },
      ],
    };

    const result = WorkflowObjectSchema.safeParse(workflowObject);

    expect(result.success).toBe(true);
    if (!result.success) {
      console.error(result.error.errors);
    }
  });

  it("should validate a minimal Step Object", () => {
    const stepObject = {
      stepId: "testStep",
      description: "A minimal step description",
      operationId: "testOperation",
    };

    const result = StepObjectSchema.safeParse(stepObject);

    expect(result.success).toBe(true);
    if (!result.success) {
      console.error(result.error.errors);
    }
  });

  it("should validate a minimal Arazzo Specification Object", () => {
    const arazzoSpec = {
      arazzo: "1.0.0",
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
              operationId: "testOperation",
            },
          ],
        },
      ],
    };

    const result = ArazzoSpecificationObjectSchema.safeParse(arazzoSpec);

    expect(result.success).toBe(true);
    if (!result.success) {
      console.error(result.error.errors);
    }
  });
});
