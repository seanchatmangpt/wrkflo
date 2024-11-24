import { describe, it, expect } from "vitest";
import yaml from "yaml";
import { ArazzoSpecificationObjectSchema } from "../src/schemas"; // Adjust the path as necessary

const minimalArazzoYAML = `
arazzo: "1.0.0"
info:
  title: "Test Workflow"
  version: "1.0.0"
  summary: "A test summary"
  description: "A detailed description of the workflow."
sourceDescriptions:
  - name: "testSource"
    url: "https://example.com/openapi.yaml"
    type: "openapi"
workflows:
  - workflowId: "testWorkflow"
    summary: "A test workflow"
    description: "This workflow tests the validation of the workflow object."
    steps:
      - stepId: "testStep"
        description: "A minimal step description"
        operationId: "testOperation"
`;

describe("Minimal Arazzo Specification Object", () => {
  it("should match the expected minimal Arazzo object", () => {
    const parsedArazzoObject = yaml.parse(minimalArazzoYAML);

    const expectedArazzoObject = {
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

    expect(parsedArazzoObject).toEqual(expectedArazzoObject);
  });

  it("should match the expected minimal Arazzo object", () => {
    const parsedArazzoObject = yaml.parse(minimalArazzoYAML);

    const expectedArazzoObject = {
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

    expect(parsedArazzoObject).toEqual(expectedArazzoObject);
  });

  it("should validate the YAML against the ArazzoSpecificationObjectSchema", () => {
    const parsedArazzoObject = yaml.parse(minimalArazzoYAML);

    const result = ArazzoSpecificationObjectSchema.safeParse(parsedArazzoObject);

    expect(result.success).toBe(true);

    if (!result.success) {
      console.error(result.error.errors); // Log validation errors if any
    }
  });
});
