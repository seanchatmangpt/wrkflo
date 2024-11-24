import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../src/expression-condition-evaluator.js';

describe('Expression Evaluator', () => {
    const context = {
        inputs: { username: "Alice", clientId: "12345", profile: { firstName: "Alice", age: 30 } },
        response: { body: { status: "success", pets: [{ id: 1 }, { id: 2 }] } }
    };

    // Test 1
    it('Test 1: should replace a single variable in a string', () => {
        const expression = "Hello, ${inputs.username}!";
        expect(evaluateExpression(expression, context)).toBe("Hello, Alice!");
    });

    // Test 2
    it('Test 2: should replace multiple variables in a string', () => {
        const expression = "Hello, ${inputs.username}! Your client ID is ${inputs.clientId}.";
        expect(evaluateExpression(expression, context)).toBe("Hello, Alice! Your client ID is 12345.");
    });

    // Test 3
    it('Test 3: should handle strings with no variables', () => {
        const expression = "Hello, World!";
        expect(evaluateExpression(expression, context)).toBe("Hello, World!");
    });

    // Test 4
    it('Test 4: should resolve nested paths using dot-notation', () => {
        const expression = "$inputs.profile.firstName";
        expect(evaluateExpression(expression, context)).toBe("Alice");
    });

    // Test 6
    it('Test 6: should resolve JSON Pointer paths', () => {
        const expression = "$response.body#/pets/0/id";
        expect(evaluateExpression(expression, context)).toBe(1);
    });

    // Test 7
    it('Test 7: should handle invalid JSON Pointer paths gracefully', () => {
        const expression = "$response.body#/invalid/path";
        expect(evaluateExpression(expression, context)).toBe(null);
    });

    // Test 8
    it('Test 8: should parse numeric literals', () => {
        const expression = "42";
        expect(evaluateExpression(expression, context)).toBe(42);
    });

    // Test 9
    it('Test 9: should parse string literals', () => {
        const expression = "'Hello World'";
        expect(evaluateExpression(expression, context)).toBe("Hello World");
    });

    // Test 10
    it('Test 10: should parse boolean literals', () => {
        const expression = "true";
        expect(evaluateExpression(expression, context)).toBe(true);
    });

    // Test 11
    it('Test 11: should parse null literals', () => {
        const expression = "null";
        expect(evaluateExpression(expression, context)).toBe(null);
    });

    // Test 12
    it('Test 12: should handle complex embedded expressions', () => {
        const expression = "Client ID: {$inputs.clientId}, Status: {$response.body.status}";
        expect(evaluateExpression(expression, context)).toBe("Client ID: 12345, Status: success");
    });
});
