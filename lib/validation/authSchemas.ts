import { z } from "zod";

export const signinSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type SigninInput = z.infer<typeof signinSchema>;

export const brandSignupSchema = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
  companyName: z.string().min(1, "Company name is required.").max(120),
});

export type BrandSignupInput = z.infer<typeof brandSignupSchema>;

export const creatorEmailSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export type CreatorEmailInput = z.infer<typeof creatorEmailSchema>;

export const creatorSessionTokenSchema = z.object({
  token: z.string().min(1),
});
