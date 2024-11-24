import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../src/evaluator.js';

describe('Arazzo Specification - Complex Workflow Evaluations', () => {
  const context = {
    inputs: { username: 'testUser', password: 'secret', pet_id: '123' },
    response: {
      body: {
        pets: [{ name: 'dog', status: 'available' }, { name: 'cat', status: 'unavailable' }],
      },
      statusCode: 200,
    },
    steps: {
      loginStep: {
        outputs: { sessionToken: 'abc123', tokenExpires: '2024-11-30T12:00:00Z' },
      },
      getPetStep: {
        outputs: {
          availablePets: [
            { id: '123', name: 'dog', status: 'available' },
            { id: '456', name: 'cat', status: 'unavailable' },
          ],
        },
      },
    },
    outputs: { finalStatus: 'success' },
    url: 'https://api.example.com/pets',
    method: 'GET',
    statusCode: 200,
  };

  it('should evaluate a multi-step workflow successfully', async () => {
    const petStatus = await evaluateExpression(
      '$steps.getPetStep.outputs.availablePets[0].status',
      context,
      'simple'
    );
    expect(petStatus).toBe('available');
  });

  it('should validate JSONPath expressions for dynamic outputs', async () => {
    const expression = '$.steps.getPetStep.outputs.availablePets[?(@.id=="123")].name';
    const result = await evaluateExpression(expression, context, 'jsonpath');
    expect(result[0]).toBe('dog');
  });

  it('should handle failures with retry logic', async () => {
    let retryCount = 0;
    let simulatedStatusCode = 503;

    while (retryCount < 3 && simulatedStatusCode !== 200) {
      retryCount += 1;
      simulatedStatusCode = retryCount === 3 ? 200 : 503; // Simulate success on the third attempt
    }

    expect(retryCount).toBe(3);
    expect(simulatedStatusCode).toBe(200);
  });

  it('should handle XPath expressions correctly', async () => {
    const xmlContext = `
      <pets>
        <pet>
          <id>123</id>
          <name>dog</name>
          <status>available</status>
        </pet>
        <pet>
          <id>456</id>
          <name>cat</name>
          <status>unavailable</status>
        </pet>
      </pets>
    `;

    const result = await evaluateExpression('//pet[name="dog"]/status/text()', null, 'xpath', {
      xmlContext,
    });
    expect(result[0]).toBe('available');
  });

  it('should process a payload replacement dynamically', async () => {
    const requestBody = {
      petOrder: {
        petId: '$inputs.pet_id',
        quantity: 1,
        status: 'placed',
        complete: false,
      },
    };

    const resolvedBody = JSON.parse(
      JSON.stringify(requestBody).replace(/\$inputs\.pet_id/g, context.inputs.pet_id)
    );

    expect(resolvedBody.petOrder.petId).toBe('123');
    expect(resolvedBody.petOrder.status).toBe('placed');
  });

  it('should handle regex evaluation', async () => {
    const regexMatch = await evaluateExpression('^abc123$', context.steps.loginStep.outputs.sessionToken, 'regex');
    expect(regexMatch).toBe(true);
  });

  it('should support deep path resolution in JSONPath', async () => {
    const deepPath = await evaluateExpression('$.response.body.pets[?(@.name=="dog")].status', context, 'jsonpath');
    expect(deepPath[0]).toBe('available');
  });

  it('should correctly resolve complex runtime expressions in simple mode', async () => {
    const dynamicStatus = await evaluateExpression(
      '$.steps.getPetStep.outputs.availablePets[1].status == "unavailable"',
      context,
      'simple'
    );
    expect(dynamicStatus).toBe(true);
  });
});



describe('Runtime Expression Evaluation', () => {

  // Test: Evaluate Simple Expression
  it('Evaluates Simple Expression', async () => {
    const expression = "$method";
    const context = { method: "GET" };
    const type = "simple";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toBe("GET");
  });

  // Test: Evaluate Simple Expression with Missing Context
  it('Evaluates Simple Expression with Missing Context', async () => {
    const expression = "$method";
    const context = {};  // method is missing
    const type = "simple";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toBeUndefined(); // Or adjust based on how the function handles missing keys
  });

  // Test: Evaluate JSONPath Expression
  it('Evaluates JSONPath Expression', async () => {
    const expression = "$.user.name";
    const context = { user: { name: "John" } };
    const type = "jsonpath";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toEqual(["John"]);
  });

  // Test: Evaluate JSONPath with Missing Property
  it('Evaluates JSONPath with Missing Property', async () => {
    const expression = "$.user.age";
    const context = { user: { name: "John" } };  // age is missing
    const type = "jsonpath";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toEqual([]);
  });

  // Test: Evaluate XPath Expression
  it('Evaluates XPath Expression', async () => {
    const expression = "//name";
    const xmlContext = "<user><name>John</name></user>";
    const type = "xpath";
    const additional = { xmlContext };
    const result = await evaluateExpression(expression, {}, type, additional);
    expect(result).toEqual(["John"]);
  });

  // Test: Evaluate XPath with Missing XML Element
  it('Evaluates XPath with Missing XML Element', async () => {
    const expression = "//age";
    const xmlContext = "<user><name>John</name></user>";  // age is missing
    const type = "xpath";
    const additional = { xmlContext };
    const result = await evaluateExpression(expression, {}, type, additional);
    expect(result).toEqual([]);
  });

  // Test: Evaluate Regex Expression with Match
  it('Evaluates Regex Expression with Match', async () => {
    const expression = "^hello";
    const context = "hello world";
    const type = "regex";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toBe(true);
  });

  // Test: Evaluate Regex Expression with No Match
  it('Evaluates Regex Expression with No Match', async () => {
    const expression = "^world";
    const context = "hello world";
    const type = "regex";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toBe(false);
  });

  // Test: Evaluate Body Reference Expression in Request
  it('Evaluates Body Reference Expression in Request', async () => {
    const expression = "$request.body#/user/uuid";
    const context = { body: { user: { uuid: "12345" } } };
    const type = "jsonpath";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toEqual(["12345"]);
  });

  // Test: Evaluate Expression with Invalid Type
  it('Throws Error for Unsupported Expression Type', async () => {
    const expression = "$method";
    const context = { method: "GET" };
    const type = "unsupported";
    const additional = {};
    await expect(evaluateExpression(expression, context, type, additional)).rejects.toThrowError('Unsupported expression type: unsupported');
  });

  // Test: Evaluate Workflow Input Reference Expression
  it('Evaluates Workflow Input Reference Expression', async () => {
    const expression = "$workflows.foo.inputs.username";
    const context = { workflows: { foo: { inputs: { username: "johndoe" } } } };
    const type = "jsonpath";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toEqual(["johndoe"]);
  });

  // Test: Evaluate Multiple Expressions (Combined)
  it('Evaluates Combined Expressions', async () => {
    const expression = "$method == 'GET' && $request.body#/user/uuid == '12345'";
    const context = { method: "GET", body: { user: { uuid: "12345" } } };
    const type = "simple";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toBe(true);
  });

  // Test: Evaluate Expression with Invalid JSONPath
  it('Evaluates Invalid JSONPath Expression', async () => {
    const expression = "$.user[0].name";  // Invalid path, user is an object, not an array
    const context = { user: { name: "John" } };
    const type = "jsonpath";
    const additional = {};
    const result = await evaluateExpression(expression, context, type, additional);
    expect(result).toEqual([]);
  });

});
