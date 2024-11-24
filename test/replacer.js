class JsonPlaceholderReplacer {
  constructor(context, options = {}) {
    this.context = context; // The context (HTTP request, response, workflows, etc.)
    this.defaultValueSeparator = options.defaultValueSeparator || ':';
  }

  // Method to replace placeholders in the object
  resolveExpression(expression) {
    // Match runtime expressions like $request.body#/user/uuid
    const regex = /\{\{(.*?)\}\}|\<\<(.+?)\>\>/g;
    let match;
    while ((match = regex.exec(expression)) !== null) {
      const placeholderKey = match[1] || match[2];
      expression = expression.replace(match[0], this.evaluatePlaceholder(placeholderKey.trim()));
    }
    return expression;
  }

  // Evaluate a placeholder in the context
  evaluatePlaceholder(placeholderKey) {
    if (this.defaultValueSeparator) {
      // Handle default value syntax (e.g., <<key:default-value>>)
      const [key, defaultValue] = placeholderKey.split(this.defaultValueSeparator);
      if (defaultValue) {
        const resolvedValue = this.getValueFromContext(key);
        return resolvedValue !== undefined ? resolvedValue : defaultValue;
      }
    }

    // Standard resolution logic
    return this.getValueFromContext(placeholderKey);
  }

  // Get a value from context based on the placeholder key
  getValueFromContext(key) {
    const keys = key.split('.');
    let result = this.context;

    for (let k of keys) {
      if (result && k in result) {
        result = result[k];
      } else {
        return undefined; // Return undefined if key is not found
      }
    }

    return result;
  }

  // Perform the placeholder replacement on an object (handles nested objects and arrays)
  replace(object) {
    if (typeof object !== 'object' || object === null) {
      return this.resolveExpression(object);
    }

    if (Array.isArray(object)) {
      return object.map(item => this.replace(item));
    }

    const newObject = {};
    for (const [key, value] of Object.entries(object)) {
      newObject[key] = this.replace(value);
    }

    return newObject;
  }
}

// Example context
const context = {
  $method: 'POST',
  $url: 'https://api.example.com',
  $statusCode: 200,
  $request: {
    body: {
      user: {
        uuid: '12345'
      }
    },
    header: {
      accept: 'application/json'
    }
  },
  $response: {
    body: {
      status: 'success',
      pets: [{ id: 1, name: 'Buddy' }]
    },
    header: {
      'X-Rate-Limit': 100
    }
  },
  $inputs: {
    username: 'testuser',
    password: 'password123'
  },
  $outputs: {
    sessionToken: 'abcd1234'
  },
  $steps: {
    loginStep: {
      outputs: {
        sessionToken: 'abcd1234'
      }
    }
  },
  $workflows: {
    exampleWorkflow: {
      inputs: {
        username: 'testuser'
      }
    }
  }
};

// Instantiate the replacer
const replacer = new JsonPlaceholderReplacer(context);

// Example object with placeholders to replace
const object = {
  method: "{{$method}}",
  url: "{{$url}}",
  statusCode: "{{$statusCode}}",
  requestBody: "{{$request.body#/user/uuid}}",
  petStatus: "{{$response.body#/status}}",
  pets: "{{$response.body.pets}}",
  workflowInput: "{{$workflows.exampleWorkflow.inputs.username}}",
  loginStepToken: "{{$steps.loginStep.outputs.sessionToken}}",
  defaultExample: "{{$request.header.accept:default-value}}"
};

// Perform replacement
const result = replacer.replace(object);

console.log(JSON.stringify(result, null, 2));

