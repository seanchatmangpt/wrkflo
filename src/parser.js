const context = {
  // HTTP Context
  $url: "https://api.example.com/resource",
  $method: "POST",
  $statusCode: 200,
  $request: {
    headers: {
      accept: "application/json",
      authorization: "Bearer abc123",
    },
    query: {
      id: "123",
      search: "dog",
    },
    pathParams: {
      userId: "456",
    },
    body: {
      user: {
        uuid: "abc-123",
        name: "John Doe",
      },
      items: [
        { id: 1, name: "item1" },
        { id: 2, name: "item2" },
      ],
    },
  },
  $response: {
    headers: {
      "content-type": "application/json",
      server: "nginx",
    },
    body: {
      status: "success",
      pets: [
        { id: 1, name: "Fluffy", type: "dog" },
        { id: 2, name: "Whiskers", type: "cat" },
      ],
    },
  },

  // Workflow Context
  $inputs: {
    username: "Alice",
    password: "password123",
    pet_id: "1",
    quantity: 2,
    coupon_code: "DISCOUNT10",
  },
  $outputs: {
    result: "success",
    orderId: "order-789",
  },
  $steps: {
    loginStep: {
      outputs: {
        tokenExpires: "2024-12-31T23:59:59Z",
        rateLimit: 1000,
        sessionToken: "session-abc123",
      },
    },
    getPetStep: {
      outputs: {
        availablePets: [
          { id: 1, name: "Fluffy", type: "dog" },
          { id: 2, name: "Whiskers", type: "cat" },
        ],
      },
    },
  },
  $workflows: {
    foo: {
      outputs: {
        bar: "workflow-result",
      },
    },
  },

  // Components and Metadata
  $sourceDescriptions: {
    petStoreDescription: {
      url: "https://petstore.example.com",
      type: "openapi",
    },
  },
  $components: {
    parameters: {
      foo: {
        name: "foo",
        value: "bar",
      },
      storeId: {
        name: "storeId",
        value: "123",
      },
    },
  },
};


/**
 * Retrieve the value for a runtime expression from the context object.
 *
 * @param {string} expression - The runtime expression (e.g., $request.body#/user/uuid).
 * @param {object} context - The centralized context object.
 * @returns {any} - The resolved value or undefined if not found.
 */
const getValue = (expression, context) => {
  if (!expression.startsWith("$")) {
    console.error(`Invalid expression: "${expression}". Must start with "$".`);
    return expression;
  }

  const [base, ...pathParts] = expression.split(".");
  const subPath = pathParts.join(".");

  // Handle special cases for JSON Pointer
  if (subPath.includes("#/")) {
    const [rootKey, jsonPointer] = subPath.split("#/");
    const rootValue = context[base]?.[rootKey];
    if (rootValue) {
      return resolveJsonPointer(jsonPointer, rootValue);
    }
  }

  // Special handling for headers (normalize keys to lowercase)
  if (subPath.startsWith("header.")) {
    const headerKey = subPath.replace("header.", "").toLowerCase();
    const headers = context[base]?.headers || {};
    return headers[headerKey];
  }

  // Handle dot-separated paths
  return resolvePath(context[base], subPath);
};

/**
 * Resolve a nested path within an object using dot notation.
 *
 * @param {object} value - The root object to resolve the path in.
 * @param {string} path - The dot-separated path.
 * @returns {any} - The resolved value or undefined if not found.
 */
const resolvePath = (value, path) => {
  if (!path) return value;
  return path.split(".").reduce((current, key) => current?.[key], value);
};

/**
 * Resolve a JSON Pointer path within an object.
 *
 * @param {string} pointer - The JSON Pointer path (e.g., /user/uuid).
 * @param {object} obj - The object to resolve the pointer within.
 * @returns {any} - The resolved value or undefined if not found.
 */
const resolveJsonPointer = (pointer, obj) => {
  const parts = pointer.split("/");
  return parts.reduce((current, part) => current?.[part], obj);
};


// Examples
console.log(getValue("$url", context)); // https://api.example.com/resource
console.log(getValue("$method", context)); // POST
console.log(getValue("$statusCode", context)); // 200
console.log(getValue("$request.header.accept", context)); // application/json
console.log(getValue("$request.body#/user/uuid", context)); // abc-123
console.log(getValue("$steps.loginStep.outputs.sessionToken", context)); // session-abc123
console.log(getValue("$components.parameters.storeId.value", context)); // 123
