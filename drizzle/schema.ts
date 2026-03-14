import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, longtext, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Video Projects Table
export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description"),
  originalText: longtext("original_text").notNull(),
  status: mysqlEnum("status", ["draft", "processing", "completed", "failed"]).default("draft").notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  videoDuration: int("video_duration"), // in seconds
  sceneCount: int("scene_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = typeof videoProjects.$inferInsert;

// Scenes Table
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  sceneNumber: int("scene_number").notNull(),
  title: varchar("title", { length: 255 }),
  description: longtext("description").notNull(),
  textContent: longtext("text_content").notNull(),
  imagePrompt: longtext("image_prompt"),
  status: mysqlEnum("status", ["pending", "generating_image", "generating_audio", "generating_video", "completed", "failed"]).default("pending").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  audioUrl: varchar("audio_url", { length: 500 }),
  videoUrl: varchar("video_url", { length: 500 }),
  duration: decimal("duration", { precision: 5, scale: 2 }), // in seconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

// Processing Queue Table (for background jobs)
export const processingQueue = mysqlTable("processing_queue", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  sceneId: int("scene_id"),
  taskType: mysqlEnum("task_type", ["analyze_text", "generate_image", "generate_audio", "generate_video", "compose_final_video"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  priority: int("priority").default(0),
  retryCount: int("retry_count").default(0),
  maxRetries: int("max_retries").default(3),
  metadata: json("metadata"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProcessingQueueItem = typeof processingQueue.$inferSelect;
export type InsertProcessingQueueItem = typeof processingQueue.$inferInsert;

// Subscription Plans Table
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "free", "standard", "pro", "premium"
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Monthly price in USD
  maxVideosPerMonth: int("max_videos_per_month"), // null = unlimited
  maxVideoMinutes: int("max_video_minutes"), // Maximum video duration in minutes
  maxCharactersPerStory: int("max_characters_per_story"), // Maximum story text length
  stripeProductId: varchar("stripe_product_id", { length: 100 }),
  stripePriceId: varchar("stripe_price_id", { length: 100 }),
  isActive: int("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// User Subscriptions Table
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  planId: int("plan_id").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "unpaid", "trialing"]).default("active").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

// User Usage Tracking Table
export const userUsageTracking = mysqlTable("user_usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  videosGenerated: int("videos_generated").default(0),
  totalCharactersUsed: int("total_characters_used").default(0),
  totalVideoMinutesGenerated: int("total_video_minutes_generated").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserUsageTracking = typeof userUsageTracking.$inferSelect;
export type InsertUserUsageTracking = typeof userUsageTracking.$inferInsert;