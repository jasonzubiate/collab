import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Slug is required.")
  .max(80, "Slug is too long.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens.",
  );

const centsField = z
  .number({ message: "Enter a whole number of cents." })
  .int("Must be a whole number of cents.")
  .min(0, "Cannot be negative.");

// Money/threshold fields shared by create + update.
const campaignFields = {
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug: slugSchema,
  isActive: z.boolean().optional(),
  minFollowers: z.number().int().min(0, "Cannot be negative."),
  minEngagementRate: z
    .number()
    .min(0, "Cannot be negative.")
    .max(100, "Engagement rate looks too high."),
  baseRatePer10kCents: centsField,
  ratePerReelCents: centsField,
  ratePerStoryCents: centsField,
  adUsage30DayMultiplier: z
    .number()
    .min(1, "Must be at least 1.0.")
    .max(10, "Multiplier looks too high."),
  adUsage90DayMultiplier: z
    .number()
    .min(1, "Must be at least 1.0.")
    .max(10, "Multiplier looks too high."),
};

const multiplierOrderRefinement = (data: {
  adUsage30DayMultiplier: number;
  adUsage90DayMultiplier: number;
}) => data.adUsage90DayMultiplier >= data.adUsage30DayMultiplier;

export const createCampaignSchema = z
  .object(campaignFields)
  .refine(multiplierOrderRefinement, {
    message: "90-day multiplier must be >= 30-day multiplier.",
    path: ["adUsage90DayMultiplier"],
  });

export const updateCampaignSchema = z
  .object({
    name: campaignFields.name.optional(),
    slug: campaignFields.slug.optional(),
    isActive: campaignFields.isActive,
    minFollowers: campaignFields.minFollowers.optional(),
    minEngagementRate: campaignFields.minEngagementRate.optional(),
    baseRatePer10kCents: campaignFields.baseRatePer10kCents.optional(),
    ratePerReelCents: campaignFields.ratePerReelCents.optional(),
    ratePerStoryCents: campaignFields.ratePerStoryCents.optional(),
    adUsage30DayMultiplier:
      campaignFields.adUsage30DayMultiplier.optional(),
    adUsage90DayMultiplier:
      campaignFields.adUsage90DayMultiplier.optional(),
  })
  .refine(
    (data) =>
      data.adUsage30DayMultiplier === undefined ||
      data.adUsage90DayMultiplier === undefined ||
      data.adUsage90DayMultiplier >= data.adUsage30DayMultiplier,
    {
      message: "90-day multiplier must be >= 30-day multiplier.",
      path: ["adUsage90DayMultiplier"],
    },
  );

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
