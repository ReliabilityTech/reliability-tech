import { z } from 'zod';

export const healthStatusSchema = z.enum(['ok', 'degraded', 'down']);

export const healthResponseSchema = z.object({
  status: healthStatusSchema,
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  checks: z.record(
    z.string(),
    z.object({
      status: healthStatusSchema,
      latencyMs: z.number().nonnegative().optional(),
      message: z.string().optional(),
    }),
  ),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type HealthStatus = z.infer<typeof healthStatusSchema>;
