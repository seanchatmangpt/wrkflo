import { describe, it, expect } from "vitest";
import { useArazzoContext, UseArazzoContext } from "../src/use-arazzo-context.js"; // Adjust path as necessary

describe("useArazzoContext Hook", () => {
  const mockContext = {
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

  it("should return the current Arazzo context", () => {
    UseArazzoContext.call(mockContext, () => {
      const ctx = useArazzoContext();

      expect(ctx).toEqual(mockContext); // Ensure the context matches the mock data
    });
  });

  it("should throw an error when context is not available", () => {
    expect(() => {
      useArazzoContext(); // Attempting to use the context without a call
    }).toThrow("Context is not available. Please ensure `ArazzoContext.call()` is used.");
  });
});
