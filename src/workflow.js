import { evaluateExpression } from './evaluator'; // Importing the evaluator

// Function to execute a workflow step
async function executeStep(step, context) {
  console.log(`[Debug] Executing Step: ${step.stepId}`);
  let stepResult = null;

  // Evaluate success criteria for the step
  const successCriteriaMet = step.successCriteria.every(criterion => {
    const { context: criterionContext, condition, type } = criterion;
    // Evaluate each condition for success
    const result = evaluateExpression(condition, context, type || 'simple', { xmlContext: context });
    console.log(`[Debug] Evaluating Criterion: ${condition} => Result:`, result);
    return result;
  });

  if (successCriteriaMet) {
    console.log(`[Debug] Step ${step.stepId} succeeded`);

    // Execute the step's main operation (this could be an API call or another workflow)
    if (step.operationId) {
      // Assume an API call or similar operation is happening here
      // Simulate response (In a real implementation, you would replace this with actual API calls)
      stepResult = { statusCode: 200, responseBody: { message: 'Step completed' } };
      context.steps[step.stepId] = stepResult;
      // Update the context with the step result
      context.response = stepResult;
    }

    // Handle success actions
    if (step.onSuccess) {
      await handleSuccessActions(step.onSuccess, context);
    }
  } else {
    console.log(`[Debug] Step ${step.stepId} failed`);

    // Handle failure actions
    if (step.onFailure) {
      await handleFailureActions(step.onFailure, context);
    }
  }

  return stepResult;
}

// Function to handle success actions for a step
async function handleSuccessActions(successActions, context) {
  for (const action of successActions) {
    if (action.type === 'end') {
      console.log(`[Debug] Ending workflow as part of success action`);
      // End the workflow
      return;
    } else if (action.type === 'goto') {
      console.log(`[Debug] Goto step ${action.stepId} as part of success action`);
      // Move to another step (this can be customized)
      context.currentStep = action.stepId;
    }
  }
}

// Function to handle failure actions for a step
async function handleFailureActions(failureActions, context) {
  for (const action of failureActions) {
    if (action.type === 'end') {
      console.log(`[Debug] Ending workflow as part of failure action`);
      // End the workflow
      return;
    } else if (action.type === 'retry') {
      console.log(`[Debug] Retrying step due to failure action`);
      // Retry logic (implement retry logic here)
    } else if (action.type === 'goto') {
      console.log(`[Debug] Goto step ${action.stepId} as part of failure action`);
      // Move to another step in case of failure (this can be customized)
      context.currentStep = action.stepId;
    }
  }
}

// Workflow engine function
async function runWorkflow(workflow, context) {
  console.log(`[Debug] Starting Workflow: ${workflow.workflowId}`);
  context.workflowId = workflow.workflowId;
  context.inputs = workflow.inputs || {};

  // Execute each step in the workflow
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    context.currentStep = step.stepId;

    // Execute the step
    await executeStep(step, context);

    // If step failed and failure actions include 'end', we terminate the workflow
    if (context.terminateWorkflow) {
      console.log(`[Debug] Workflow terminated at step ${step.stepId}`);
      break;
    }
  }

  console.log(`[Debug] Workflow ${workflow.workflowId} completed`);
}

// Example usage with a workflow and context
const workflow = {
  workflowId: 'loginAndRetrievePet',
  steps: [
    {
      stepId: 'loginStep',
      description: 'Login step',
      operationId: 'loginUser',
      successCriteria: [
        { condition: '$statusCode == 200', type: 'simple' }
      ],
      outputs: {
        sessionToken: '$response.body.token'
      },
      onSuccess: [
        { type: 'goto', stepId: 'getPetStep' }
      ]
    },
    {
      stepId: 'getPetStep',
      description: 'Retrieve pet by status',
      operationPath: '/pets',
      successCriteria: [
        { condition: '$statusCode == 200', type: 'simple' }
      ],
      outputs: {
        availablePets: '$response.body.pets'
      },
      onFailure: [
        { type: 'retry', retryAfter: 1, retryLimit: 3 }
      ]
    }
  ]
};

const context = {
  inputs: { username: 'test', password: 'test123' },
  response: {
    body: {
      token: 'xyz123',
      pets: [{ name: 'Buddy', id: '123' }]
    },
    statusCode: 200
  },
  steps: {},
  terminateWorkflow: false
};

// Running the workflow
runWorkflow(workflow, context);
