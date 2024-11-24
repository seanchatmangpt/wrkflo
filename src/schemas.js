import { z } from "zod";

// Info Object Schema
export const InfoObjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
  description: z.string().optional(),
  version: z.string().min(1, "Version is required"),
}).strict();

// Source Description Object Schema
export const SourceDescriptionObjectSchema = z.object({
  name: z.string().regex(/^[A-Za-z0-9_\-]+$/, "Invalid name format"),
  url: z.string().url("Invalid URL format"),
  type: z.enum(["arazzo", "openapi"], "Source type must be 'arazzo' or 'openapi'"),
}).strict();

// Criterion Object Schema
export const CriterionObjectSchema = z.object({
  context: z.string().optional(),
  condition: z.string().min(1, "Condition is required"),
  type: z.enum(["simple", "regex", "jsonpath", "xpath"]).optional(),
}).strict();

// Step Object Schema
export const StepObjectSchema = z
  .object({
    stepId: z.string().regex(/^[A-Za-z0-9_\-]+$/, "Invalid step ID format"),
    description: z.string().optional(),
    operationId: z.string().optional(),
    operationPath: z.string().optional(),
    workflowId: z.string().optional(),
    parameters: z
      .array(
        z.object({
          name: z.string().min(1, "Parameter name is required"),
          in: z.enum(["path", "query", "header", "cookie", "body"]),
          value: z.any().optional(),
        })
      )
      .optional(),
    requestBody: z
      .object({
        contentType: z.string().min(1, "Content-Type is required"),
        payload: z.any().optional(),
      })
      .optional(),
    successCriteria: z.array(CriterionObjectSchema).optional(),
    onSuccess: z.array(z.any()).optional(),
    onFailure: z.array(z.any()).optional(),
    outputs: z.record(z.string(), z.any()).optional(),
  })
  .superRefine((data, ctx) => {
    const fields = ["operationId", "operationPath", "workflowId"];
    const provided = fields.filter((field) => data[field] !== undefined);
    if (provided.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "One of operationId, operationPath, or workflowId must be provided",
        path: ["operationId", "operationPath", "workflowId"],
      });
    } else if (provided.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "operationId, operationPath, and workflowId are mutually exclusive",
        path: ["operationId", "operationPath", "workflowId"],
      });
    }
  })


// Workflow Object Schema
export const WorkflowObjectSchema = z.object({
  workflowId: z.string().regex(/^[A-Za-z0-9_\-]+$/, "Invalid workflow ID"),
  summary: z.string().optional(),
  description: z.string().optional(),
  inputs: z.object({
    type: z.string(),
    properties: z.record(z.string(), z.any()).optional(),
  }).optional(),
  steps: z.array(StepObjectSchema).min(1, "At least one step is required"),
  outputs: z.record(z.string(), z.any()).optional(),
}).strict();

// Arazzo Specification Object Schema
export const ArazzoSpecificationObjectSchema = z.object({
  arazzo: z.string().regex(/^1\.0\.\d+(-.+)?$/, "Invalid Arazzo version"),
  info: InfoObjectSchema,
  sourceDescriptions: z.array(SourceDescriptionObjectSchema).min(1),
  workflows: z.array(WorkflowObjectSchema).min(1),
}).strict();
