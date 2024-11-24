import { JSONPath } from "jsonpath-plus";
import Jexl from "jexl";

/**
 * Evaluate a given expression in the context of the provided data.
 * Supports embedded expressions, JSON Pointer paths, and Jexl expressions.
 */
export const evaluateExpression = async (expression, context) => {
    console.log("Evaluating expression:", expression);

    // First, handle embedded expressions using Jexl
    const expressionWithResolvedPlaceholders = expression.replace(/\${([^}]+)}/g, (_, path) => {
        try {
            // Evaluate embedded expressions using Jexl
            return Jexl.evalSync(path, context);
        } catch (err) {
            console.error(`Error resolving embedded expression: ${path}`, err);
            return `{${path}}`; // Return unresolved placeholders if any error occurs
        }
    });

    // Evaluate the final expression after resolving placeholders with Jexl
    try {
        return await Jexl.eval(expressionWithResolvedPlaceholders, context);
    } catch (err) {
        console.error(`Error evaluating final expression: ${expressionWithResolvedPlaceholders}`, err);
        return expressionWithResolvedPlaceholders; // Return the unresolved expression if it fails
    }
};

/**
 * Resolve JSON Pointer paths (e.g., $response.body#/pets/0/id).
 */
const resolveJsonPointer = (path, context) => {
    // Using jsonpath-plus to resolve JSON Pointer paths
    const results = JSONPath({ path, json: context });
    return results.length > 0 ? results[0] : undefined;
};

/**
 * Evaluate a condition using JSONPath or Jexl.
 */
export const evaluateCondition = async (condition, context) => {
    // Handle JSONPath query
    if (condition.includes("::")) {
        const [jsonpath, contextPath] = condition.split("::");
        const resolvedContext = await evaluateExpression(contextPath, context);
        return evaluateJsonPath(jsonpath, resolvedContext);
    }

    // Handle Jexl condition (simple or complex)
    return await Jexl.eval(condition, context);
};

/**
 * Evaluate a JSONPath query on the resolved context.
 */
const evaluateJsonPath = (jsonpath, context) => {
    const results = JSONPath({ path: jsonpath, json: context });
    return results.length > 0;
};
