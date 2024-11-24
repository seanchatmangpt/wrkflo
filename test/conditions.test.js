import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../src/evaluator';

describe('Arazzo Specification - Condition Evaluations', async () => {
  const context = {
    inputs: { username: 'testUser', pet_id: '123' },
    response: {
      body: { pets: [{ id: '123', name: 'dog', status: 'available' }] },
      statusCode: 200,
    },
    steps: {
      getPetStep: {
        outputs: {
          availablePets: [
            { id: '123', name: 'dog', status: 'available' },
            { id: '124', name: 'cat', status: 'unavailable' },
          ],
        },
      },
    },
  };

  describe('Simple Conditions', async () => {
    it('should evaluate a simple condition correctly', async () => {
      const condition = '$steps.getPetStep.outputs.availablePets[0].status == "available"';
      const result = await evaluateExpression(condition, context, 'simple');
      expect(result).toBe(true);
    });

    it('should handle logical AND correctly', async () => {
      const condition = '$steps.getPetStep.outputs.availablePets[0].status == "available" && $response.statusCode == 200';
      const result = await evaluateExpression(condition, context, 'simple');
      expect(result).toBe(true);
    });

    it('should handle logical OR correctly', async () => {
      const condition = '$steps.getPetStep.outputs.availablePets[0].status == "unavailable" || $response.statusCode == 200';
      const result = await evaluateExpression(condition, context, 'simple');
      expect(result).toBe(true);
    });
  });

  describe('Regex Conditions', async () => {
    it('should validate a regex pattern against a string', async () => {
      const condition = '^available$';
      const target = context.steps.getPetStep.outputs.availablePets[0].status;
      const result = await evaluateExpression(condition, target, 'regex');
      expect(result).toBe(true);
    });

    it('should fail if regex does not match', async () => {
      const condition = '^unavailable$';
      const target = context.steps.getPetStep.outputs.availablePets[0].status;
      const result = await evaluateExpression(condition, target, 'regex');
      expect(result).toBe(false);
    });
  });

  describe('JSONPath Conditions', async () => {
    it('should filter JSON data using JSONPath', async () => {
      const expression = '$.steps.getPetStep.outputs.availablePets[?(@.id=="123")].name';
      const result = await evaluateExpression(expression, context, 'jsonpath');
      expect(result[0]).toBe('dog');
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
        <pet>
          <id>124</id>
          <name>cat</name>
          <status>unavailable</status>
        </pet>
      </pets>
    `;

    it('should evaluate XPath to extract text content', async () => {
      const expression = '//pet[name="dog"]/status/text()';
      const result = await evaluateExpression(expression, null, 'xpath', { xmlContext });
      expect(result[0]).toBe('available');
    });

    it('should return empty array if XPath condition is not met', async () => {
      const expression = '//pet[name="bird"]/status/text()';
      const result = await evaluateExpression(expression, null, 'xpath', { xmlContext });
      expect(result).toEqual([]);
    });
  });

  describe('Combination of Conditions', async () => {
    it('should handle nested simple conditions correctly', async () => {
      const condition = '($response.statusCode == 200) && ($steps.getPetStep.outputs.availablePets[0].status == "available")';
      const result = await evaluateExpression(condition, context, 'simple');
      expect(result).toBe(true);
    });

    it('should fail combined conditions if any part is false', async () => {
      const condition = '($response.statusCode == 404) || ($steps.getPetStep.outputs.availablePets[0].status == "unavailable")';
      const result = await evaluateExpression(condition, context, 'simple');
      expect(result).toBe(false);
    });
  });
});
