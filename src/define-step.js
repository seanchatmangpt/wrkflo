import { StepObjectSchema } from "./schemas"; // Assuming you already have Zod schemas
import { useArazzoContext } from "./use-arazzo-context.js";
import { evaluateExpression } from "./evaluator.js";

/**
 * defineStep
 * Defines a single step in a workflow, with hooks for lifecycle events.
 *
 * @param {object} def - The step definition.
 * @param {string} def.stepId - Unique ID for the step.
 * @param {string} def.description - A description of the step.
 * @param {string} [def.operationId] - The operation ID this step executes.
 * @param {string} [def.operationPath] - The operation path if operationId is unavailable.
 * @param {object[]} [def.parameters] - Parameters to inject into the operation.
 * @param {object} [def.requestBody] - Request body object for the operation.
 * @param {array} [def.successCriteria] - Criteria to determine if the step succeeded.
 * @param {array} [def.onSuccess] - Actions to execute on step success.
 * @param {array} [def.onFailure] - Actions to execute on step failure.
 * @param {function} def.run - The function to execute the step logic.
 * @returns {function} - The step function.
 */
export function defineStep(def) {
  // Validate the step definition using the Zod schema
  const validation = StepObjectSchema.safeParse(def);
  if (!validation.success) {
    throw new Error(
      `Invalid step definition: ${JSON.stringify(validation.error.errors)}`
    );
  }

  return async function executeStep(inputs) {
    const context = useArazzoContext();
    const stepContext = { ...context, inputs };

    try {
      // Preprocess parameters and request body
      const parameters = await resolveParameters(def.parameters, stepContext);
      const requestBody = await resolveRequestBody(def.requestBody, stepContext);

      // Execute the step's core logic (e.g., calling an API)
      const result = await def.run({
        ...stepContext,
        parameters,
        requestBody,
      });

      // Evaluate success criteria
      const success = evaluateCriteria(def.successCriteria, result, stepContext);
      if (success) {
        await handleActions(def.onSuccess, result, stepContext);
      } else {
        throw new Error("Step failed due to unmet success criteria.");
      }

      return result;
    } catch (error) {
      await handleActions(def.onFailure, error, stepContext);
      throw error;
    }
  };
}

/**
 * Resolves parameters using runtime expressions.
 * @param {array} parameters - List of parameters.
 * @param {object} context - Current step context.
 * @returns {Promise<object>} - Resolved parameters.
 */
async function resolveParameters(parameters, context) {
  if (!parameters) return {};
  const resolved = {};
  for (const param of parameters) {
    resolved[param.name] = await evaluateExpression(param.value, context);
  }
  return resolved;
}

/**
 * Resolves the request body using runtime expressions.
 * @param {object} requestBody - The request body definition.
 * @param {object} context - Current step context.
 * @returns {Promise<object>} - Resolved request body.
 */
async function resolveRequestBody(requestBody, context) {
  if (!requestBody) return null;
  const resolvedPayload = await evaluateExpression(
    requestBody.payload,
    context
  );
  return {
    contentType: requestBody.contentType,
    payload: resolvedPayload,
  };
}

/**
 * Evaluates success criteria against the result and context.
 * @param {array} criteria - Success criteria to evaluate.
 * @param {object} result - Step execution result.
 * @param {object} context - Current step context.
 * @returns {boolean} - Whether the criteria are met.
 */
function evaluateCriteria(criteria, result, context) {
  if (!criteria) return true; // No criteria means success by default
  return criteria.every((criterion) =>
    evaluateExpression(criterion.condition, { ...context, result })
  );
}

/**
 * Executes success or failure actions.
 * @param {array} actions - Actions to execute.
 * @param {object} data - Data to pass to the actions.
 * @param {object} context - Current step context.
 * @returns {Promise<void>}
 */
async function handleActions(actions, data, context) {
  if (!actions) return;
  for (const action of actions) {
    await action(data, context);
  }
}
