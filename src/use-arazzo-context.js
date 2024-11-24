import { createContext } from "unctx";

// Create the Arazzo context
export const UseArazzoContext = createContext({
  asyncContext: true, // Optional: Enables async context tracking if supported
});

/**
 * useArazzoContext Hook
 * Retrieves the current Arazzo context.
 *
 * @returns {object} The current Arazzo context.
 * @throws {Error} If no context is available.
 */
export function useArazzoContext() {
  const context = UseArazzoContext.tryUse();
  if (!context) {
    throw new Error(
      "Context is not available. Please ensure `ArazzoContext.call()` is used."
    );
  }
  return context;
}

/**
 * setArazzoContext
 * Manually sets the Arazzo context for singleton use cases.
 *
 * @param {object} context - The context object to set.
 */
export function setArazzoContext(context) {
  UseArazzoContext.set(context);
}

/**
 * unsetArazzoContext
 * Clears the Arazzo context for singleton use cases.
 */
export function unsetArazzoContext() {
  UseArazzoContext.unset();
}
