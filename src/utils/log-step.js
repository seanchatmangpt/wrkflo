/**
 * Logs and validates a step from a workflow.
 *
 * @param {Object} workflow - The workflow object containing the steps.
 * @param {string} stepId - The stepId of the step to log.
 */
export function logStep(workflow, stepId) {
  const step = workflow.steps.find((s) => s.stepId === stepId);

  if (!step) {
    console.error(`Step with ID "${stepId}" not found in workflow "${workflow.workflowId}".`);
    throw new Error(`Step "${stepId}" does not exist`);
  }

  console.log(`Step "${stepId}" Details:`, step);
  return step;
}
