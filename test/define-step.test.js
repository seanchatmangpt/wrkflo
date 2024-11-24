import { describe, it, expect, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { defineStep } from "../src/define-step";
import { useArazzoContext } from "../src/use-arazzo-context";

// Mock useArazzoContext
vi.mock("../src/use-arazzo-context", () => ({
  useArazzoContext: vi.fn(),
}));

describe("define-step with faker", () => {
  it("should validate a step with operationId", async () => {
    const mockContext = {
      inputs: {
        username: faker.internet.username(),
        password: faker.internet.password(),
      },
    };

    useArazzoContext.mockReturnValue(mockContext);

    const step = defineStep({
      stepId: "login-step",
      description: "Logs in a user",
      operationId: "loginUser",
      parameters: [
        { name: "username", in: "query", value: "$inputs.username" },
        { name: "password", in: "query", value: "$inputs.password" },
      ],
      successCriteria: [{ condition: "$statusCode == 200" }],
      async run() {
        return { statusCode: 200, message: "Login successful" };
      },
    });

    const result = await step(mockContext.inputs);

    expect(result).toEqual({ statusCode: 200, message: "Login successful" });
  });

  it("should validate a step with operationPath", async () => {
    const mockContext = {
      inputs: { userId: faker.string.uuid()},
    };

    useArazzoContext.mockReturnValue(mockContext);

    const step = defineStep({
      stepId: "get-user",
      description: "Retrieves a user by ID",
      operationPath: "/users/{userId}",
      parameters: [{ name: "userId", in: "path", value: "$inputs.userId" }],
      successCriteria: [{ condition: "$statusCode == 200" }],
      async run({ parameters }) {
        expect(parameters).toEqual({ userId: mockContext.inputs.userId });

        return { statusCode: 200, data: { id: mockContext.inputs.userId, name: faker.name.fullName() } };
      },
    });

    const result = await step(mockContext.inputs);

    expect(result).toEqual({
      statusCode: 200,
      data: { id: mockContext.inputs.userId, name: expect.any(String) },
    });
  });

  it("should validate a step with workflowId", async () => {
    const mockContext = {
      inputs: { workflowTrigger: faker.datatype.boolean() },
    };

    useArazzoContext.mockReturnValue(mockContext);

    const step = defineStep({
      stepId: "trigger-workflow",
      description: "Triggers another workflow",
      workflowId: "triggeredWorkflow",
      successCriteria: [{ condition: "$statusCode == 202" }],
      async run() {
        return { statusCode: 202, message: "Workflow triggered successfully" };
      },
    });

    const result = await step(mockContext.inputs);

    expect(result).toEqual({ statusCode: 202, message: "Workflow triggered successfully" });
  });

  it("should throw an error if no operationId, operationPath, or workflowId is provided", () => {
    expect(() => {
      defineStep({
        stepId: "invalid-step",
        description: "This step is invalid",
        // Missing operationId, operationPath, and workflowId
      });
    }).toThrow(
      "Invalid step definition: [{\"code\":\"custom\",\"message\":\"One of operationId, operationPath, or workflowId must be provided\",\"path\":[\"operationId\",\"operationPath\",\"workflowId\"]}]"
    );
  });
});
