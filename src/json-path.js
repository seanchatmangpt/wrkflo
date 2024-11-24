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

const context = {
    method: "GET", // Top-level expression for $method
    url: "https://api.example.com/users/123", // Top-level expression for $url
    request: {
        header: {
            accept: "application/json",
        },
        path: {
            id: 123,
        },
        body: {
            user: {
                uuid: "550e8400-e29b-41d4-a716-446655440000",
            },
        },
    },
    response: {
        body: {
            status: "success",
        },
        header: {
            Server: "nginx/1.19.10",
        },
    },
    inputs: {
        username: "john_doe",
    },
    steps: {
        someStep: {
            pets: ["dog", "cat"],
        },
    },
    outputs: {
        bar: { total: 200 },
    },
    components: {
        parameters: {
            foo: "bar",
        },
    },
};

console.log(resolveDynamicExpression("$method", context));
// Output: "GET"

console.log(resolveDynamicExpression("$request.header.accept", context));
// Output: "application/json"

console.log(resolveDynamicExpression("$request.path.id", context));
// Output: 123

console.log(resolveDynamicExpression("$request.body#/user/uuid", context));
// Output: "550e8400-e29b-41d4-a716-446655440000"

console.log(resolveDynamicExpression("$url", context));
// Output: "https://api.example.com/users/123"

console.log(resolveDynamicExpression("$response.body#/status", context));
// Output: "success"

console.log(resolveDynamicExpression("$response.header.Server", context));
// Output: "nginx/1.19.10"

console.log(resolveDynamicExpression("$inputs.username", context));
// Output: "john_doe"

console.log(resolveDynamicExpression("$steps.someStep.pets", context));
// Output: ["dog", "cat"]

console.log(resolveDynamicExpression("$outputs.bar", context));
// Output: { total: 200 }

console.log(resolveDynamicExpression("$outputs.bar.total", context));
// Output: 200

console.log(resolveDynamicExpression("$components.parameters.foo", context));
// Output: "bar"

// Embedded Expressions
console.log(resolveDynamicExpression("Hello, { $inputs.username }!", context));
// Output: "Hello, john_doe!"

console.log(resolveDynamicExpression("Your order total is { $outputs.bar.total } USD.", context));
// Output: "Your order total is 200 USD."

// Plain String
console.log(resolveDynamicExpression("This is a plain string.", context));
// Output: "This is a plain string."
