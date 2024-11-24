import unjs from "eslint-config-unjs";

export default unjs({
  ignores: [
    // Add specific paths to ignore linting, such as build artifacts or node_modules
    "dist",
    "node_modules",
  ],
  rules: {
    // Rule overrides for specific needs
    "unicorn/expiring-todo-comments": "off", // Disable the problematic rule
  },
  markdown: {
    rules: {
      // Markdown-specific rule overrides
      "unicorn/expiring-todo-comments": "off", // Disable the rule in markdown files too
    },
  },
});
