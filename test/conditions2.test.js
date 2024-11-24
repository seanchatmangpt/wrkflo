import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../src/evaluator';

describe('Arazzo Specification - Condition Evaluations', async () => {
  const context = {
    inputs: { username: 'testUser', password: 'secret', pet_id: '123' },
    response: { body: { pets: [{ name: 'dog', status: 'available' }] }, statusCode: 200 },
    steps: {
      getPetStep: {
        outputs: {
          availablePets: [{ id: '123', name: 'dog', status: 'available' }]
        }
      }
    },
    outputs: { finalStatus: 'success' },
    url: 'https://api.example.com/pets',
    method: 'GET',
    statusCode: 200
  };

  describe('Simple Conditions', async () => {
    it('should evaluate a simple condition correctly', async () => {
      const expression = '$inputs.username === "testUser"';
      const result = await evaluateExpression(expression, context, 'simple');
      expect(result).toBe(true);
    });

    it('should handle logical AND correctly', async () => {
      const expression = '$inputs.username === "testUser" && $response.statusCode === 200';
      const result = await evaluateExpression(expression, context, 'simple');
      expect(result).toBe(true);
    });

    it('should handle logical OR correctly', async () => {
      const expression = '$inputs.username === "invalidUser" || $response.statusCode === 200';
      const result = await evaluateExpression(expression, context, 'simple');
      expect(result).toBe(true);
    });
  });

  describe('JSONPath Conditions', async () => {
    it('should filter JSON data using JSONPath', async () => {
      const expression = '$.steps.getPetStep.outputs.availablePets[?(@.id=="123")].name';
      const result = await evaluateExpression(expression, context, 'jsonpath');
      expect(result).toEqual(['dog']);
    });

    it('should return empty array if JSONPath condition is not met', async () => {
      const expression = '$.steps.getPetStep.outputs.availablePets[?(@.id=="999")].name';
      const result = await evaluateExpression(expression, context, 'jsonpath');
      expect(result).toEqual([]);
    });
  });

  describe('XPath Conditions', async () => {
    const xmlContext = `
      <pets>
        <pet>
          <id>123</id>
          <name>dog</name>
          <status>available</status>
        </pet>
      </pets>
    `;

    it('should evaluate XPath to extract text content', async () => {
      const expression = '//pet[name="dog"]/status/text()';
      const result = await evaluateExpression(expression, {}, 'xpath', { xmlContext });
      expect(result).toEqual(['available']);
    });

    it('should return empty array if XPath condition is not met', async () => {
      const expression = '//pet[name="bird"]/status/text()';
      const result = await evaluateExpression(expression, {}, 'xpath', { xmlContext });
      expect(result).toEqual([]);
    });
  });

  describe('Combination of Conditions', async () => {
    it('should handle nested simple conditions correctly', async () => {
      const expression = '($response.statusCode === 200) && ($steps.getPetStep.outputs.availablePets[0].status === "available")';
      const result = await evaluateExpression(expression, context, 'simple');
      expect(result).toBe(true);
    });

    it('should fail combined conditions if any part is false', async () => {
      const expression = '($response.statusCode === 404) || ($steps.getPetStep.outputs.availablePets[0].status === "unavailable")';
      const result = await evaluateExpression(expression, context, 'simple');
      expect(result).toBe(false);
    });

    it('should handle mixed JSONPath and simple conditions', async () => {
      const jsonPathExpression = '$.steps.getPetStep.outputs.availablePets[?(@.id=="123")].status';
      const jsonPathResult = await evaluateExpression(jsonPathExpression, context, 'jsonpath');

      // Inject JSONPath result into context
      const extendedContext = { ...context, status: jsonPathResult[0] };
      const simpleExpression = 'status === "available"';
      const simpleResult = await evaluateExpression(simpleExpression, extendedContext, 'simple');

      expect(jsonPathResult).toEqual(['available']);
      expect(simpleResult).toBe(true);
    });
  });
});
