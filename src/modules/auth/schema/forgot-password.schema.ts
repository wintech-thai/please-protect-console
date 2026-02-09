import { z } from "zod";

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, "Password is required")
    .min(7, "Password must be at least 7 characters")
    .max(15, "Password must not exceed 15 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character (!, @, #, etc.)"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], 
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;