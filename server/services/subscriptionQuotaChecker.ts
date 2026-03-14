/**
 * Subscription Quota Checker Service
 * Verifies if a user can generate a video based on their subscription plan
 */

import { getUserSubscription, getSubscriptionPlanById, getUserUsageForMonth } from "../db";

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: {
    videosThisMonth: number;
    charactersThisMonth: number;
    videoMinutesThisMonth: number;
  };
  limits?: {
    maxVideosPerMonth: number | null | undefined;
    maxVideoMinutes: number | null | undefined;
    maxCharactersPerStory: number | null | undefined;
  };
}

/**
 * Check if a user can generate a video with the given parameters
 */
export async function checkVideoGenerationQuota(
  userId: number,
  storyCharacterCount: number,
  estimatedVideoMinutes: number
): Promise<QuotaCheckResult> {
  try {
    console.log(`[QuotaChecker] Checking quota for user ${userId}`);

    // Get user's current subscription
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      console.log(`[QuotaChecker] User ${userId} has no subscription, assigning free plan`);
      // Assign free plan by default
      return checkAgainstPlan(userId, 1, storyCharacterCount, estimatedVideoMinutes);
    }

    // Get the subscription plan details
    const plan = await getSubscriptionPlanById(subscription.planId);
    if (!plan) {
      return {
        allowed: false,
        reason: "Subscription plan not found",
      };
    }

    console.log(`[QuotaChecker] User ${userId} has plan: ${plan.name}`);

    // Check against plan limits
    return checkAgainstPlan(userId, subscription.planId, storyCharacterCount, estimatedVideoMinutes);
  } catch (error) {
    console.error(`[QuotaChecker] Error checking quota:`, error);
    return {
      allowed: false,
      reason: "Error checking subscription quota",
    };
  }
}

/**
 * Check quota against a specific plan
 */
async function checkAgainstPlan(
  userId: number,
  planId: number,
  storyCharacterCount: number,
  estimatedVideoMinutes: number
): Promise<QuotaCheckResult> {
  const plan = await getSubscriptionPlanById(planId);
  if (!plan) {
    return {
      allowed: false,
      reason: "Plan not found",
    };
  }

  // Get current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Get user's current usage for this month
  const usage = await getUserUsageForMonth(userId, currentMonth);

  const currentVideosThisMonth = usage?.videosGenerated || 0;
  const currentCharactersThisMonth = usage?.totalCharactersUsed || 0;
  const currentVideoMinutesThisMonth = usage?.totalVideoMinutesGenerated || 0;

  // Check character limit per story
  if (plan.maxCharactersPerStory && storyCharacterCount > plan.maxCharactersPerStory) {
    return {
      allowed: false,
      reason: `Story exceeds character limit of ${plan.maxCharactersPerStory} characters for ${plan.displayName} plan`,
      currentUsage: {
        videosThisMonth: currentVideosThisMonth,
        charactersThisMonth: currentCharactersThisMonth,
        videoMinutesThisMonth: currentVideoMinutesThisMonth,
      },
      limits: {
        maxVideosPerMonth: plan.maxVideosPerMonth,
        maxVideoMinutes: plan.maxVideoMinutes,
        maxCharactersPerStory: plan.maxCharactersPerStory,
      },
    };
  }

  // Check video duration limit
  if (plan.maxVideoMinutes && estimatedVideoMinutes > plan.maxVideoMinutes) {
    return {
      allowed: false,
      reason: `Estimated video duration (${estimatedVideoMinutes}m) exceeds limit of ${plan.maxVideoMinutes} minutes for ${plan.displayName} plan`,
      currentUsage: {
        videosThisMonth: currentVideosThisMonth,
        charactersThisMonth: currentCharactersThisMonth,
        videoMinutesThisMonth: currentVideoMinutesThisMonth,
      },
      limits: {
        maxVideosPerMonth: plan.maxVideosPerMonth,
        maxVideoMinutes: plan.maxVideoMinutes,
        maxCharactersPerStory: plan.maxCharactersPerStory,
      },
    };
  }

  // Check monthly video limit
  if (plan.maxVideosPerMonth && currentVideosThisMonth >= plan.maxVideosPerMonth) {
    return {
      allowed: false,
      reason: `Monthly video limit (${plan.maxVideosPerMonth}) reached for ${plan.displayName} plan. Please upgrade or wait for next month.`,
      currentUsage: {
        videosThisMonth: currentVideosThisMonth,
        charactersThisMonth: currentCharactersThisMonth,
        videoMinutesThisMonth: currentVideoMinutesThisMonth,
      },
      limits: {
        maxVideosPerMonth: plan.maxVideosPerMonth,
        maxVideoMinutes: plan.maxVideoMinutes,
        maxCharactersPerStory: plan.maxCharactersPerStory,
      },
    };
  }

  // All checks passed
  console.log(`[QuotaChecker] User ${userId} passed quota check for plan ${plan.name}`);

  return {
    allowed: true,
    currentUsage: {
      videosThisMonth: currentVideosThisMonth,
      charactersThisMonth: currentCharactersThisMonth,
      videoMinutesThisMonth: currentVideoMinutesThisMonth,
    },
    limits: {
      maxVideosPerMonth: plan.maxVideosPerMonth,
      maxVideoMinutes: plan.maxVideoMinutes,
      maxCharactersPerStory: plan.maxCharactersPerStory,
    },
  };
}

/**
 * Get user's current plan info
 */
export async function getUserPlanInfo(userId: number) {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      // Return free plan by default
      const freePlan = await getSubscriptionPlanById(1);
      return {
        planId: 1,
        planName: freePlan?.name || "free",
        displayName: freePlan?.displayName || "Free",
        price: 0,
        maxVideosPerMonth: freePlan?.maxVideosPerMonth || 5,
        maxVideoMinutes: freePlan?.maxVideoMinutes || 5,
        maxCharactersPerStory: freePlan?.maxCharactersPerStory || 5000,
      };
    }

    const plan = await getSubscriptionPlanById(subscription.planId);
    return {
      planId: subscription.planId,
      planName: plan?.name || "unknown",
      displayName: plan?.displayName || "Unknown",
      price: plan?.price || 0,
      maxVideosPerMonth: plan?.maxVideosPerMonth || null,
      maxVideoMinutes: plan?.maxVideoMinutes || null,
      maxCharactersPerStory: plan?.maxCharactersPerStory || 30000,
    };
  } catch (error) {
    console.error(`[QuotaChecker] Error getting user plan info:`, error);
    return null;
  }
}
