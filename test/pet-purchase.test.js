import { describe, it, expect, beforeEach } from "vitest";
import yaml from "yaml";
import { ArazzoSpecificationObjectSchema } from "../src/schemas";
import { logStep } from "../src/utils/log-step.js"; // Adjust the import path as necessary

const petPurchaseYAML = `
arazzo: 1.0.0
info:
    title: A pet purchasing workflow
    summary: This workflow showcases how to purchase a pet through a sequence of API calls
    description: |
        This workflow walks you through the steps of \`searching\` for, \`selecting\`, and \`purchasing\` an available pet.
    version: 1.0.1
sourceDescriptions:
- name: petStoreDescription
  url: https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml
  type: openapi

workflows:
- workflowId: loginUserRetrievePet
  summary: Login User and then retrieve pets
  description: This procedure lays out the steps to login a user and then retrieve pets
  inputs:
      type: object
      properties:
          username:
              type: string
          password:
              type: string
  steps:
  - stepId: loginStep
    description: This step demonstrates the user login step
    operationId: petStoreDescription.loginUser
    parameters:
      - name: username
        in: query
        value: $inputs.username
      - name: password
        in: query
        value: $inputs.password
    successCriteria:
      - condition: $statusCode == 200
    outputs:
      tokenExpires: $response.header.X-Expires-After
      rateLimit: $response.header.X-Rate-Limit
      sessionToken: $response.body
  - stepId: getPetStep
    description: retrieve a pet by status from the GET pets endpoint
    operationPath: $sourceDescriptions.petStoreDescription#/paths/~1pet~1findByStatus/get
    parameters:
      - name: status
        in: query
        value: 'available'
      - name: Authorization
        in: header
        value: $steps.loginStep.outputs.sessionToken
    successCriteria:
      - condition: $statusCode == 200
    outputs:
      availablePets: $response.body
  outputs:
      available: $steps.getPetStep.availablePets
`;

let parsedObject;

describe("Pet Purchase Workflow Validation", () => {
  beforeEach(() => {
    // Parse and validate the YAML before each test
    parsedObject = yaml.parse(petPurchaseYAML);

    const validation = ArazzoSpecificationObjectSchema.safeParse(parsedObject);

    if (!validation.success) {
      console.error(validation.error.errors);
      throw new Error("Invalid YAML schema");
    }
  });

  it("should validate that the parsed object contains the correct top-level keys", () => {
    expect(parsedObject).toHaveProperty("arazzo", "1.0.0");
    expect(parsedObject).toHaveProperty("info");
    expect(parsedObject).toHaveProperty("sourceDescriptions");
    expect(parsedObject).toHaveProperty("workflows");
  });

  it("should validate the info object", () => {
    const { info } = parsedObject;

    expect(info).toHaveProperty("title", "A pet purchasing workflow");
    expect(info).toHaveProperty("version", "1.0.1");
    expect(info).toHaveProperty(
      "summary",
      "This workflow showcases how to purchase a pet through a sequence of API calls"
    );
  });

  it("should validate the first workflow object", () => {
    const workflow = parsedObject.workflows[0];

    expect(workflow).toHaveProperty("workflowId", "loginUserRetrievePet");
    expect(workflow).toHaveProperty("steps");
    expect(workflow.steps).toHaveLength(2);
  });

  it("should validate the first step of the workflow", () => {
    const step = parsedObject.workflows[0].steps[0];

    expect(step).toHaveProperty("stepId", "loginStep");
    expect(step).toHaveProperty("operationId", "petStoreDescription.loginUser");
    expect(step).toHaveProperty("parameters");
    expect(step.parameters).toHaveLength(2);
  });

  it("should validate all steps in the first workflow", () => {
  const workflow = parsedObject.workflows[0];

  // Loop through all steps and validate
  for (const step of workflow.steps) {
    const loggedStep = logStep(workflow, step.stepId); // Log and get the step

    // Basic step validations
    expect(loggedStep).toHaveProperty("stepId");
    expect(loggedStep).toHaveProperty("description");
    expect(loggedStep).toHaveProperty("parameters");

    // Ensure step-specific properties exist based on the type of step
    if (loggedStep.operationId) {
      expect(loggedStep).toHaveProperty("operationId");
    } else if (loggedStep.operationPath) {
      expect(loggedStep).toHaveProperty("operationPath");
    } else if (loggedStep.workflowId) {
      expect(loggedStep).toHaveProperty("workflowId");
    } else {
      throw new Error(`Step "${loggedStep.stepId}" has no operationId, operationPath, or workflowId`);
    }
  }
});

});
