import { z } from "zod";

/** Instagram handle: strip a leading @, allow letters, numbers, periods, underscores. */
export const handleSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@+/, ""))
  .pipe(
    z
      .string()
      .min(1, "Instagram handle is required.")
      .max(60, "Handle is too long.")
      .regex(
        /^[A-Za-z0-9._]+$/,
        "Handles can only contain letters, numbers, periods, and underscores.",
      ),
  );

export const startProposalSchema = z.object({
  brandSlug: z.string().trim().min(1, "Brand is required."),
  creatorHandle: handleSchema,
  creatorName: z
    .string()
    .trim()
    .max(120, "Name is too long.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  creatorEmail: z.string().trim().email("Enter a valid email address."),
});

export const usageDaysSchema = z.union([
  z.literal(0),
  z.literal(30),
  z.literal(90),
]);

export const scopeSchema = z
  .object({
    reelsCount: z.number().int().min(0).max(5),
    storiesCount: z.number().int().min(0).max(5),
    adUsageDays: usageDaysSchema,
  })
  .refine((scope) => scope.reelsCount + scope.storiesCount >= 1, {
    message: "Select at least one reel or story.",
    path: ["reelsCount"],
  });

export const estimateSchema = z.object({
  draftId: z.string().uuid("Invalid draft id."),
  scope: scopeSchema,
});

export const submitProposalSchema = z.object({
  draftId: z.string().uuid("Invalid draft id."),
  scope: scopeSchema,
});

export const matchTierSchema = z.enum(["GREEN", "YELLOW", "ARCHIVED"]);
export const workflowStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "APPROVED",
  "REJECTED",
]);

export const updateProposalSchema = z
  .object({
    workflowStatus: workflowStatusSchema.optional(),
    matchTier: matchTierSchema.optional(),
    adminNotes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (data) =>
      data.workflowStatus !== undefined ||
      data.matchTier !== undefined ||
      data.adminNotes !== undefined,
    { message: "No fields to update." },
  );

export const instagramReplySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(1000, "Message is too long."),
});

export const proposalFiltersSchema = z.object({
  matchTier: matchTierSchema.optional(),
  workflowStatus: workflowStatusSchema.optional(),
  campaignId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type StartProposalInput = z.infer<typeof startProposalSchema>;
export type ScopeInput = z.infer<typeof scopeSchema>;
export type EstimateInput = z.infer<typeof estimateSchema>;
export type SubmitProposalInput = z.infer<typeof submitProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type ProposalFilters = z.infer<typeof proposalFiltersSchema>;
export type InstagramReplyInput = z.infer<typeof instagramReplySchema>;
