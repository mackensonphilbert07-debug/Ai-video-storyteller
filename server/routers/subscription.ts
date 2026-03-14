import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getUserSubscription,
  getUserUsageForMonth,
} from "../db";
import { TRPCError } from "@trpc/server";

export const subscriptionRouter = router({
  /**
   * Get current user's subscription plan
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await getUserSubscription(ctx.user.id);
    
    // Return free plan if no subscription found
    if (!subscription) {
      return {
        planId: "free",
        planName: "Free",
        maxVideosPerMonth: 5,
        maxVideoDuration: 300,
        maxCharacters: 5000,
        status: "active",
      };
    }

    // Map subscription to plan limits
    const planLimits: Record<number, { name: string; videos: number; duration: number; characters: number }> = {
      1: { name: "Free", videos: 5, duration: 300, characters: 5000 },
      2: { name: "Standard", videos: Infinity, duration: 300, characters: 5000 },
      3: { name: "Pro", videos: Infinity, duration: 600, characters: 20000 },
      4: { name: "Premium", videos: Infinity, duration: Infinity, characters: 30000 },
    };

    const planInfo = planLimits[subscription.planId] || planLimits[1];

    return {
      planId: subscription.planId,
      planName: planInfo.name,
      maxVideosPerMonth: planInfo.videos,
      maxVideoDuration: planInfo.duration,
      maxCharacters: planInfo.characters,
      status: subscription.status,
    };
  }),

  /**
   * Get all available subscription plans
   */
  getAllPlans: publicProcedure.query(async () => {
    const plans = [
      {
        id: 1,
        name: "Free",
        price: 0,
        period: "Forever",
        maxVideosPerMonth: 5,
        maxVideoDuration: 300,
        maxCharacters: 5000,
        features: ["5 videos per month", "Up to 5 minutes per video", "Community support"],
      },
      {
        id: 2,
        name: "Standard",
        price: 10,
        period: "month",
        maxVideosPerMonth: Infinity,
        maxVideoDuration: 300,
        maxCharacters: 5000,
        features: ["Unlimited videos", "Up to 5 minutes per video", "Email support"],
      },
      {
        id: 3,
        name: "Pro",
        price: 15,
        period: "month",
        maxVideosPerMonth: Infinity,
        maxVideoDuration: 600,
        maxCharacters: 20000,
        features: ["Unlimited videos", "Up to 10 minutes per video", "Priority support"],
      },
      {
        id: 4,
        name: "Premium",
        price: 30,
        period: "month",
        maxVideosPerMonth: Infinity,
        maxVideoDuration: Infinity,
        maxCharacters: 30000,
        features: ["Unlimited videos", "Unlimited duration", "24/7 support"],
      },
    ];
    return plans;
  }),

  /**
   * Check if user can generate a video with given parameters
   */
  checkVideoGenerationQuota: protectedProcedure
    .input(
      z.object({
        storyLength: z.number().min(1),
        estimatedDuration: z.number().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const subscription = await getUserSubscription(ctx.user.id);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await getUserUsageForMonth(ctx.user.id, currentMonth);

      // Get plan limits
      const planLimits: Record<number, { videos: number; duration: number; characters: number }> = {
        1: { videos: 5, duration: 300, characters: 5000 },
        2: { videos: Infinity, duration: 300, characters: 5000 },
        3: { videos: Infinity, duration: 600, characters: 20000 },
        4: { videos: Infinity, duration: Infinity, characters: 30000 },
      };

      const planId = subscription?.planId || 1;
      const limits = planLimits[planId] || planLimits[1];

      // Check video count limit
      if (limits.videos !== Infinity) {
        const videosGenerated = usage?.videosGenerated || 0;
        if (videosGenerated >= limits.videos) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You have reached your monthly video limit (${limits.videos} videos)`,
          });
        }
      }

      // Check duration limit
      if (limits.duration !== Infinity && input.estimatedDuration > limits.duration) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Video duration exceeds your plan limit (max ${limits.duration / 60} minutes)`,
        });
      }

      // Check character limit
      if (input.storyLength > limits.characters) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Story length exceeds your plan limit (max ${limits.characters} characters)`,
        });
      }

      return {
        allowed: true,
        message: "You can generate this video",
      };
    }),

  /**
   * Get current month's usage statistics
   */
  getCurrentUsage: protectedProcedure.query(async ({ ctx }) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await getUserUsageForMonth(ctx.user.id, currentMonth);
    const subscription = await getUserSubscription(ctx.user.id);

    const planLimits: Record<number, { videos: number; duration: number; characters: number }> = {
      1: { videos: 5, duration: 300, characters: 5000 },
      2: { videos: Infinity, duration: 300, characters: 5000 },
      3: { videos: Infinity, duration: 600, characters: 20000 },
      4: { videos: Infinity, duration: Infinity, characters: 30000 },
    };

    const planId = subscription?.planId || 1;
    const limits = planLimits[planId] || planLimits[1];

    const videosGenerated = usage?.videosGenerated || 0;
    const totalDuration = usage?.totalVideoMinutesGenerated || 0;
    const totalCharacters = usage?.totalCharactersUsed || 0;

    return {
      videosGenerated,
      totalDuration,
      totalCharacters,
      limits: {
        maxVideos: limits.videos,
        maxDuration: limits.duration,
        maxCharacters: limits.characters,
      },
      percentageUsed: {
        videos: limits.videos === Infinity ? 0 : videosGenerated / limits.videos,
        duration: limits.duration === Infinity ? 0 : totalDuration / limits.duration,
        characters: limits.characters === Infinity ? 0 : totalCharacters / limits.characters,
      },
    };
  }),

  /**
   * Upgrade to a paid plan (placeholder for Stripe integration)
   */
  upgradePlan: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["standard", "pro", "premium"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In production, this would integrate with Stripe
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message:
          "Stripe integration coming soon. Please contact support for manual upgrade.",
      });
    }),

  /**
   * Cancel current subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    // In production, this would integrate with Stripe
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message:
        "Subscription management coming soon. Please contact support.",
    });
  }),
});
