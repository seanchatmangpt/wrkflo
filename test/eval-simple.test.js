import { describe, it, expect } from "vitest";
import { evaluateExpression, evaluateSimple } from "../src/evaluator.js";

describe("evaluateSimple", () => {
  it("should resolve single dynamic expressions", async () => {
    const expression = "Bearer $inputs.token";
    const context = { inputs: { token: "abc123" } };
    const result = await evaluateSimple(expression, context);
    expect(result).toBe("Bearer abc123");
  });

  it("should resolve mixed dynamic expressions", async () => {
    const expression = "Bearer $inputs.tokenPrefix-$inputs.token";
    const context = { inputs: { tokenPrefix: "xyz", token: "123" } };
    const result = await evaluateSimple(expression, context);
    expect(result).toBe("Bearer xyz-123");
  });

  it("should handle fully static expressions", async () => {
    const expression = "StaticString";
    const context = {};
    const result = await evaluateSimple(expression, context);
    expect(result).toBe("StaticString");
  });

  it("should throw an error for unresolved dynamic expressions", async () => {
    const expression = "Bearer $inputs.token";
    const context = { inputs: {} };
    await expect(evaluateSimple(expression, context)).rejects.toThrow(
      "Failed to resolve expression",
    );
  });
});

describe("evaluateExpression", () => {
  it("should resolve dynamic expressions retaining type (array)", async () => {
    const expression = "$response.body.items";
    const context = { response: { body: { items: ["item1", "item2"] } } };
    const result = await evaluateExpression(expression, context, "simple");
    expect(result).toEqual(["item1", "item2"]); // Retain array type
  });

  it("should resolve dynamic expressions retaining type (boolean)", async () => {
    const expression = "$response.body.success";
    const context = { response: { body: { success: true } } };
    const result = await evaluateExpression(expression, context, "simple");
    expect(result).toEqual(true); // Retain boolean type
  });

  it("should resolve mixed expressions with proper type", async () => {
    const expression = "Bearer $inputs.tokenPrefix-$inputs.token";
    const context = { inputs: { tokenPrefix: "xyz", token: "123" } };
    const result = await evaluateExpression(expression, context, "simple");
    expect(result).toEqual("Bearer xyz-123"); // Concatenate mixed static and dynamic
  });

  it("should resolve static expressions", async () => {
    const expression = "StaticValue";
    const context = {};
    const result = await evaluateExpression(expression, context, "simple");
    expect(result).toEqual("StaticValue"); // Static value remains unchanged
  });
});
