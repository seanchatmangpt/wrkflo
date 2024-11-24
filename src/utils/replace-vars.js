function replaceVariables(template, context) {
    return template.replace(/\${([^}]+)}/g, (match, path) => {
        const keys = path.split('.');
        let value = context;
        for (const key of keys) {
            value = value[key];
            if (value === undefined) {
                return match; // If value is not found in the context, return the original match
            }
        }
        return value;
    });
}
function replaceVariables(template, context) {
    return template.replace(/\${([^}]+)}/g, (match, path) => {
        const keys = path.split('.');
        let value = context;
        for (const key of keys) {
            value = value[key];
            if (value === undefined) {
                return match; // If value is not found in the context, return the original match
            }
        }
        return value;
    });
}

// Example usage:
const template = "User ${inputs.username} logged in with token ${steps.loginUser.outputs.sessionToken}";
const context = {
    inputs: {
        username: "john_doe"
    },
    steps: {
        loginUser: {
            outputs: {
                sessionToken: "abc123"
            }
        }
    }
};

const result = replaceVariables(template, context);
console.log(result); // Output: User john_doe logged in with token abc123

import { describe, it, expect } from 'vitest';

describe('Request Body Replacement', () => {
  it('should replace payload values with inputs', () => {
    const inputs = {
      pet_id: 123,
      coupon_code: 'DISCOUNT10',
      quantity: 2
    };
    const payloadTemplate = {
      petOrder: {
        petId: '$inputs.pet_id',
        couponCode: '$inputs.coupon_code',
        quantity: '$inputs.quantity',
        status: 'placed',
        complete: false
      }
    };
    const replacedPayload = JSON.parse(JSON.stringify(payloadTemplate).replace(/\$inputs\.(\w+)/g, (_, key) => inputs[key]));
    expect(replacedPayload).toEqual({
      petOrder: {
        petId: 123,
        couponCode: 'DISCOUNT10',
        quantity: 2,
        status: 'placed',
        complete: false
      }
    });
  });
});

// Example usage:
const template = "User ${inputs.username} logged in with token ${steps.loginUser.outputs.sessionToken}";
const context = {
    inputs: {
        username: "john_doe"
    },
    steps: {
        loginUser: {
            outputs: {
                sessionToken: "abc123"
            }
        }
    }
};

const result = replaceVariables(template, context);
console.log(result); // Output: User john_doe logged in with token abc123

import { describe, it, expect } from 'vitest';

describe('Request Body Replacement', () => {
  it('should replace payload values with inputs', () => {
    const inputs = {
      pet_id: 123,
      coupon_code: 'DISCOUNT10',
      quantity: 2
    };
    const payloadTemplate = {
      petOrder: {
        petId: '$inputs.pet_id',
        couponCode: '$inputs.coupon_code',
        quantity: '$inputs.quantity',
        status: 'placed',
        complete: false
      }
    };
    const replacedPayload = JSON.parse(JSON.stringify(payloadTemplate).replace(/\$inputs\.(\w+)/g, (_, key) => inputs[key]));
    expect(replacedPayload).toEqual({
      petOrder: {
        petId: 123,
        couponCode: 'DISCOUNT10',
        quantity: 2,
        status: 'placed',
        complete: false
      }
    });
  });
});
