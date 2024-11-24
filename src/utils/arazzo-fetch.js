import { ofetch } from "ofetch";
import { evaluateExpression } from "../evaluator";

/**
 * Executes an API request for an Arazzo workflow step.
 * @param {object} step - The Arazzo step object containing operationId, parameters, requestBody, and outputs.
 * @param {object} sourceDescriptions - The list of source descriptions from the Arazzo document.
 * @param {object} inputs - The dynamic inputs for the workflow execution.
 * @returns {Promise<object>} - The resolved outputs from the API response.
 */
export async function arazzoFetch(step, sourceDescriptions, inputs) {
  const { operationId, parameters = [], requestBody = {}, outputs } = step;

  // Resolve operation details
  const operation = resolveOperation(operationId, sourceDescriptions);
  if (!operation) {
    throw new Error(
      `Operation "${operationId}" not found in source descriptions`,
    );
  }

  // Resolve URL, query parameters, headers, and request body
  const url = await resolveDynamicParameters(
    operation.url,
    parameters,
    inputs,
    "path",
  );
  const query = await resolveDynamicParameters({}, parameters, inputs, "query");
  const headers = await resolveDynamicParameters(
    {
      "Content-Type": requestBody.contentType || "application/json",
      Accept: "application/json",
    },
    parameters,
    inputs,
    "header",
  );
  const body = requestBody.payload
    ? await resolvePayload(requestBody.payload, inputs)
    : undefined;

  try {
    // Execute the API request
    const response = await ofetch(url, {
      method: operation.method || "GET",
      headers,
      query,
      body,
      timeout: operation.timeout || 30_000,
      retry: operation.retry || 1,
      retryDelay: operation.retryDelay || 1000,
    });

    // Resolve and return mapped outputs
    return await resolveOutputs(outputs, response);
  } catch (error) {
    throw transformFetchError(error, url, operation.method || "GET");
  }
}

/**
 * Resolves the operation details based on operationId and sourceDescriptions.
 * @param {string} operationId - The operationId to find.
 * @param {array} sourceDescriptions - List of source descriptions.
 * @returns {object|undefined} - The resolved operation or undefined if not found.
 */
function resolveOperation(operationId, sourceDescriptions) {
  for (const source of sourceDescriptions) {
    const operation = source.operations?.find(
      (op) => op.operationId === operationId,
    );
    if (operation) return operation;
  }
  return undefined;
}

/**
 * Resolves dynamic parameters based on their location (path, query, header).
 * @param {object|string} base - The base object or URL to modify.
 * @param {array} parameters - List of parameters from the step.
 * @param {object} inputs - Dynamic inputs for the workflow execution.
 * @param {string} location - The parameter location ("path", "query", "header").
 * @returns {Promise<object|string>} - The resolved parameters or modified base (e.g., URL, headers).
 */
async function resolveDynamicParameters(base, parameters, inputs, location) {
  if (typeof base === "string") {
    let url = base;
    for (const param of parameters.filter((p) => p.in === location)) {
      const value = await evaluateExpression(param.value, { inputs });
      url = url.replace(`{${param.name}}`, value);
    }
    return url;
  } else {
    const resolved = { ...base };
    for (const param of parameters.filter((p) => p.in === location)) {
      resolved[param.name] = await evaluateExpression(param.value, { inputs });
    }
    return resolved;
  }
}

/**
 * Resolves the request payload dynamically from inputs.
 * @param {object} payload - The payload object with dynamic expressions.
 * @param {object} inputs - Dynamic inputs for the workflow execution.
 * @returns {Promise<object>} - The resolved payload object.
 */
async function resolvePayload(payload, inputs) {
  const resolvedPayload = {};
  for (const [key, valueExpression] of Object.entries(payload)) {
    resolvedPayload[key] = await evaluateExpression(valueExpression, {
      inputs,
    });
  }
  return resolvedPayload;
}

/**
 * Maps API response data to outputs defined in the step.
 * @param {object} outputs - The outputs object with dynamic expressions.
 * @param {object} response - The API response data.
 * @returns {Promise<object>} - The resolved outputs.
 */
async function resolveOutputs(outputs = {}, response) {
  const resolved = {};
  for (const [key, expression] of Object.entries(outputs)) {
    resolved[key] = await evaluateExpression(expression, { response });
  }
  return resolved;
}

/**
 * Transforms errors into structured Arazzo-compatible format.
 * @param {object} error - The error object from the API request.
 * @param {string} url - The API URL that was called.
 * @param {string} method - The HTTP method used for the request.
 * @returns {object} - Arazzo-compatible error format.
 */
function transformFetchError(error, url, method) {
  if (error.response) {
    return {
      type: "FetchError",
      message: `[${method}] "${url}": ${error.response.status} ${error.response.statusText}`,
      statusCode: error.response.status,
      data: error.response._data || undefined,
    };
  }
  return {
    type: "NetworkError",
    message: `[${method}] "${url}": ${error.message}`,
    statusCode: undefined,
    data: undefined,
  };
}
