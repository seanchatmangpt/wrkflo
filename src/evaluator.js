import { JSONPath } from "jsonpath-plus";
import xpath from "xpath";
import { DOMParser } from "xmldom";
import Jexl from "jexl";


// function normalizeExpression(expression, type) {
//   if (type === "simple" && expression.startsWith("$")) {
//     return expression.replace(/^\$/, "");
//   }
//   return expression; // For other types, return as-is
// }


/**
 * Evaluates a runtime expression based on the provided type and context.
 *
 * @param {string} expression - The expression to evaluate.
 * @param {Object} context - The context object for evaluation.
 * @param {string} type - The type of the expression ('simple', 'jsonpath', 'xpath', 'regex').
 * @param {Object} additional - Additional context, such as XML for XPath.
 * @returns {*} - The result of the evaluated expression.
 */
export async function evaluateExpression(expression, context = {}, type = "simple", additional = {}) {
  console.log(`[Debug] Evaluating Expression: ${expression}`);
  console.log(`[Debug] Evaluation Type: ${type}`);
  console.log(`[Debug] Context:`, context);

  try {
    switch (type.toLowerCase()) {
      case "simple":
        return await evaluateSimple(expression, context);
      case "jsonpath":
        return evaluateJsonPath(expression, context);
      case "xpath":
        return evaluateXPath(expression, additional.xmlContext);
      case "regex":
        return evaluateRegex(expression, context.toString());
      default:
        throw new Error(`Unsupported expression type: ${type}`);
    }
  } catch (error) {
    console.error(`[Error] Evaluation failed for type "${type}": ${error.message}`);
    throw error;
  }
}

/**
 * Resolves a runtime expression or embedded expressions within a string.
 * @param {string} input - The string to resolve. May include embedded expressions.
 * @param {object} context - The context containing request, response, inputs, steps, etc.
 * @returns {string|any} - The resolved value (string if embedded, otherwise any type).
 */
function resolveDynamicExpression(input, context) {
    if (typeof input !== "string" || input.trim() === "") {
        throw new Error("Input must be a non-empty string.");
    }

    // Check if the input contains embedded expressions (e.g., "Hello, { $inputs.username }!")
    if (input.includes("{") && input.includes("}")) {
        // Resolve embedded expressions
        return input.replace(/\{(.*?)\}/g, (_, expression) => resolveExpression(expression.trim(), context) || "");
    }

    // If not embedded, check if it's a valid standalone runtime expression
    if (input.startsWith("$")) {
        return resolveExpression(input, context);
    }

    // If neither, return the plain string as-is
    return input;
}

/**
 * Resolves a single runtime expression from a context object.
 * @param {string} expression - The runtime expression to resolve.
 * @param {object} context - The context containing request, response, inputs, steps, etc.
 * @returns {any} - The resolved value from the context or undefined if not found.
 */
function resolveExpression(expression, context) {
    const trimmedExpression = expression.trim().replace(/^{|}$/g, ""); // Remove { } if mistakenly added

    // Parse the first part of the expression to find the root context key
    const [prefix, ...pathParts] = trimmedExpression.split(".");
    const rootKey = prefix.replace("$", ""); // Remove $ to match context keys

    const root = context[rootKey];
    if (!root) {
        // Dynamically look for top-level expressions
        if (context.hasOwnProperty(rootKey)) {
            return context[rootKey];
        }
        throw new Error(`Unknown expression prefix: ${prefix}`);
    }

    // Resolve nested paths if root exists
    try {
        return pathParts.reduce((current, key) => {
            if (key.includes("#/")) {
                const [baseKey, pointerPath] = key.split("#/");
                current = current[baseKey];
                const pointerParts = pointerPath.split("/");
                return pointerParts.reduce((nested, pointerKey) => nested?.[pointerKey], current);
            }
            return current?.[key];
        }, root);
    } catch {
        return undefined;
    }
}



/**
 * Evaluates a 'simple' expression using Jexl.
 *
 * @param {string} expression - The expression to evaluate.
 * @param {Object} context - The context object for evaluation.
 * @returns {*} - The result of the evaluated expression.
 */
async function evaluateSimple(expression, context) {
  const resolvedExpression = resolveDynamicExpression(expression, context);

  try {
    console.log(`[Debug] Evaluating Simple Expression: ${expression}`);

    const result = await Jexl.eval(resolvedExpression, context);
    console.log(`[Debug] Simple Evaluation Result:`, result);
    return result;
  } catch (error) {
    console.error(`[Error] Simple evaluation failed: ${error.message}`);
    return resolvedExpression
  }
}

/**
 * Evaluates a JSONPath expression.
 *
 * @param {string} expression - The JSONPath expression.
 * @param {Object} context - The JSON object to apply the expression to.
 * @returns {*} - The result of the evaluated JSONPath expression.
 */
function evaluateJsonPath(expression, context) {
  try {
    console.log(`[Debug] Evaluating JSONPath Expression: ${expression}`);
    const result = JSONPath({ path: expression, json: context });
    console.log(`[Debug] JSONPath Evaluation Result:`, result);
    return result;
  } catch (error) {
    console.error(`[Error] JSONPath evaluation failed: ${error.message}`);
    throw new Error(`JSONPath evaluation failed: ${error.message}`);
  }
}

/**
 * Evaluates an XPath expression.
 *
 * @param {string} expression - The XPath expression.
 * @param {string} xml - The XML context as a string.
 * @returns {Array<string>} - The result of the evaluated XPath expression.
 */
function evaluateXPath(expression, xml) {
  if (!xml) {
    throw new Error("XML context is required for XPath evaluation.");
  }
  try {
    console.log(`[Debug] Evaluating XPath Expression: ${expression}`);
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const nodes = xpath.select(expression, doc);
    const result = nodes.map((node) => (node.nodeValue || node.textContent || node.toString()));
    console.log(`[Debug] XPath Evaluation Result:`, result);
    return result;
  } catch (error) {
    console.error(`[Error] XPath evaluation failed: ${error.message}`);
    throw new Error(`XPath evaluation failed: ${error.message}`);
  }
}

/**
 * Evaluates a Regex expression.
 *
 * @param {string} expression - The regex pattern.
 * @param {string} target - The string to match against.
 * @returns {boolean} - Whether the regex matched.
 */
function evaluateRegex(expression, target = "") {
  try {
    console.log(`[Debug] Evaluating Regex Expression: ${expression}`);
    console.log(`[Debug] Target String for Regex: ${target}`);
    return new RegExp(expression).test(target);
  } catch (error) {
    console.error(`[Error] Regex evaluation failed: ${error.message}`);
    throw new Error(`Regex evaluation failed: ${error.message}`);
  }
}
