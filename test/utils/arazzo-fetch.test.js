import { vi, describe, it, expect } from "vitest";
import { ofetch } from "ofetch";
import { arazzoFetch } from "../../src/utils/arazzo-fetch";

vi.mock("ofetch", () => ({
  ofetch: vi.fn(),
}));

const mockSourceDescriptions = [
  {
    name: "example-api",
    operations: [
      {
        operationId: "getPet",
        method: "GET",
        url: "https://example.com/pet/{petId}",
      },
      {
        operationId: "searchItems",
        method: "GET",
        url: "https://example.com/items",
      },
      {
        operationId: "createOrder",
        method: "POST",
        url: "https://example.com/orders",
      },
      {
        operationId: "authenticate",
        method: "GET",
        url: "https://example.com/auth",
      },
    ],
  },
];

describe("arazzoFetch - Happy Path", () => {
  it("should execute an API call and map outputs dynamically", async () => {
    // Mocking ofetch response
    ofetch.mockResolvedValueOnce({ body: { name: "Fluffy" } });

    const step = {
      stepId: "get-pet",
      operationId: "getPet",
      parameters: [{ name: "petId", in: "path", value: "$inputs.petId" }],
      outputs: {
        petName: "$response.body.name",
      },
    };

    const inputs = { petId: 123 };

    const result = await arazzoFetch(step, mockSourceDescriptions, inputs);

    // Assert result
    expect(result).toEqual({
      petName: "Fluffy",
    });

    // Ensure the API was called with the correct parameters
    expect(ofetch).toHaveBeenCalledWith(
      "https://example.com/pet/123",
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
    );
  });

  it("should resolve query parameters dynamically", async () => {
    ofetch.mockResolvedValueOnce({ body: { items: ["item1", "item2"] } });

    const step = {
      stepId: "search-items",
      operationId: "searchItems",
      parameters: [
        { name: "query", in: "query", value: "$inputs.searchQuery" },
      ],
      outputs: {
        items: "$response.body.items",
      },
    };

    const inputs = { searchQuery: "toys" };

    const result = await arazzoFetch(step, mockSourceDescriptions, inputs);

    // Validate resolved outputs
    expect(result).toEqual({
      items: ["item1", "item2"],
    });

    // Ensure the API was called with correct query parameters
    expect(ofetch).toHaveBeenCalledWith(
      "https://example.com/items",
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        query: { query: "toys" }, // Query parameters are passed here
      }),
    );
  });

  it("should handle a POST request with a dynamically resolved body", async () => {
    ofetch.mockResolvedValueOnce({ body: { success: true } });

    const step = {
      stepId: "create-order",
      operationId: "createOrder",
      parameters: [],
      requestBody: {
        contentType: "application/json",
        payload: {
          orderId: "$inputs.orderId",
          amount: "$inputs.amount",
        },
      },
      outputs: {
        orderSuccess: "$response.body.success",
      },
    };

    const inputs = { orderId: "A123", amount: 299.99 };

    const result = await arazzoFetch(step, mockSourceDescriptions, inputs);

    expect(result).toEqual({
      orderSuccess: true,
    });

    expect(ofetch).toHaveBeenCalledWith(
      "https://example.com/orders",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: {
          orderId: "A123",
          amount: 299.99,
        },
      }),
    );
  });

  it("should support dynamic headers in the request", async () => {
    ofetch.mockResolvedValueOnce({ body: { token: "abc123" } });

    const step = {
      stepId: "auth",
      operationId: "authenticate",
      parameters: [
        { name: "Authorization", in: "header", value: "Bearer $inputs.token" },
      ],
      outputs: {
        token: "$response.body.token",
      },
    };

    const inputs = { token: "xyz789" };

    const result = await arazzoFetch(step, mockSourceDescriptions, inputs);

    expect(result).toEqual({
      token: "abc123",
    });

    expect(ofetch).toHaveBeenCalledWith(
      "https://example.com/auth",
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer xyz789",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
    );
  });
});
