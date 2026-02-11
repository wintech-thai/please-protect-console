import { z } from "zod";

const passwordSchema = z
  .string()
  .min(7, { message: "min_length" })
  .max(15, { message: "max_length" }) 
  .regex(/[A-Z]/, { message: "uppercase" })
  .regex(/[a-z]/, { message: "lowercase" })
  .regex(/[^A-Za-z0-9]/, { message: "special" });

export const userSignupFormSchema = z
  .object({
    firstName: z.string().min(1, { message: "required" }),
    lastName: z.string().min(1, { message: "required" }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "mismatch",
    path: ["confirmPassword"],
  });

export type UserSignupFormData = z.infer<typeof userSignupFormSchema>;