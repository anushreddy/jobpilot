import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const emailSchema = z.string().email("Please enter a valid email address");

export const jobSearchConfigSchema = z.object({
  roleTitle: z.string().min(1, "Role title is required").max(255),
  roleAliases: z.array(z.string().min(1).max(255)).max(20).default([]),
  city: z.string().max(255).trim().optional().nullable(),
  state: z.string().max(100).trim().optional().nullable(),
  country: z
    .string()
    .length(2, "Country must be a 2-letter ISO code")
    .transform((s) => s.toUpperCase())
    .default("US"),
  isRemoteSearch: z.boolean().default(false),
  priority: z.number().int().min(1, "Min 1").max(10, "Max 10").default(5),
  isActive: z.boolean().default(true),
});

// All fields optional for partial updates (e.g. toggling status).
export const jobSearchConfigUpdateSchema = jobSearchConfigSchema.partial();
