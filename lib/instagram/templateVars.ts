import { formatCompactNumber } from "@/lib/money";
import { isPseudoHandle } from "./identity";

export type CreatorIdentityVars = {
  creatorGreeting: string;
  creatorHandle: string;
  creatorHandleFormatted: string;
  followerCountFormatted: string;
  isVerifiedIdentity: boolean;
};

export function buildCreatorIdentityVars(input: {
  creatorHandle: string | null | undefined;
  enrichmentProvider: string;
  followerCount: number;
}): CreatorIdentityVars {
  const handle = (input.creatorHandle ?? "").trim();
  const isVerifiedIdentity =
    Boolean(handle) &&
    !isPseudoHandle(handle) &&
    input.enrichmentProvider === "instagram_graph";

  return {
    creatorGreeting: isVerifiedIdentity ? ` @${handle}` : "",
    creatorHandle: handle,
    creatorHandleFormatted: isVerifiedIdentity ? `@${handle}` : "",
    followerCountFormatted: formatCompactNumber(input.followerCount),
    isVerifiedIdentity,
  };
}

export type DraftMetricsSnapshot = {
  followerCount: number;
  engagementRate: number;
  creatorHandle?: string;
  isVerifiedIdentity?: boolean;
  enrichmentProvider?: string;
};

export function buildIdentityVarsFromDraftMetrics(
  metrics: DraftMetricsSnapshot | null | undefined,
): CreatorIdentityVars {
  if (!metrics) {
    return {
      creatorGreeting: "",
      creatorHandle: "",
      creatorHandleFormatted: "",
      followerCountFormatted: "",
      isVerifiedIdentity: false,
    };
  }

  return buildCreatorIdentityVars({
    creatorHandle: metrics.creatorHandle,
    enrichmentProvider: metrics.enrichmentProvider ?? "mock",
    followerCount: metrics.followerCount,
  });
}
