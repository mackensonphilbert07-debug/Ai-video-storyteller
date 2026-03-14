import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, videoProjects, InsertVideoProject, scenes, InsertScene, processingQueue, InsertProcessingQueueItem, subscriptionPlans, userSubscriptions, userUsageTracking } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Video Projects queries
export async function createVideoProject(userId: number, project: Omit<InsertVideoProject, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(videoProjects).values({
    ...project,
    userId,
  });
  
  // Get the created project to return its ID
  const createdProjects = await db.select().from(videoProjects)
    .where(eq(videoProjects.userId, userId))
    .orderBy(videoProjects.createdAt)
    .limit(1);
  
  if (createdProjects.length === 0) {
    throw new Error("Failed to retrieve created project");
  }
  
  return createdProjects[0];
}

export async function getUserVideoProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(videoProjects).where(eq(videoProjects.userId, userId));
}

export async function getVideoProjectById(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVideoProject(projectId: number, updates: Partial<InsertVideoProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(videoProjects).set(updates).where(eq(videoProjects.id, projectId));
}

// Scenes queries
export async function createScene(scene: InsertScene) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(scenes).values(scene);
}

export async function getProjectScenes(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(scenes).where(eq(scenes.projectId, projectId));
}

export async function updateScene(sceneId: number, updates: Partial<InsertScene>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(scenes).set(updates).where(eq(scenes.id, sceneId));
}

// Processing Queue queries
export async function addToProcessingQueue(item: InsertProcessingQueueItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(processingQueue).values(item);
}

export async function getPendingQueueItems(limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(processingQueue)
    .where(eq(processingQueue.status, "pending"))
    .limit(limit);
}

export async function updateQueueItem(queueId: number, updates: Partial<InsertProcessingQueueItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(processingQueue).set(updates).where(eq(processingQueue.id, queueId));
}


// Subscription Plans queries
export async function getAllSubscriptionPlans() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, 1));
}

export async function getSubscriptionPlanByName(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, name))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getSubscriptionPlanById(planId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// User Subscriptions queries
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserSubscription(userId: number, planId: number, stripeSubscriptionId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(userSubscriptions).values({
    userId,
    planId,
    stripeSubscriptionId,
    status: "active",
  });
}

export async function updateUserSubscription(userId: number, updates: Partial<typeof userSubscriptions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(userSubscriptions).set(updates).where(eq(userSubscriptions.userId, userId));
}

// User Usage Tracking queries
export async function getUserUsageForMonth(userId: number, month: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { and } = await import("drizzle-orm");
  const result = await db.select().from(userUsageTracking)
    .where(and(eq(userUsageTracking.userId, userId), eq(userUsageTracking.month, month)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateUserUsage(userId: number, month: string, updates: Partial<typeof userUsageTracking.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserUsageForMonth(userId, month);
  
  if (existing) {
    return db.update(userUsageTracking).set(updates).where(eq(userUsageTracking.userId, userId));
  } else {
    return db.insert(userUsageTracking).values({
      userId,
      month,
      ...updates,
    });
  }
}

export async function incrementUserVideoCount(userId: number, month: string, characterCount: number, videoDurationMinutes: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserUsageForMonth(userId, month);
  
  if (existing) {
    return db.update(userUsageTracking).set({
      videosGenerated: (existing.videosGenerated || 0) + 1,
      totalCharactersUsed: (existing.totalCharactersUsed || 0) + characterCount,
      totalVideoMinutesGenerated: (existing.totalVideoMinutesGenerated || 0) + videoDurationMinutes,
    }).where(eq(userUsageTracking.userId, userId));
  } else {
    return db.insert(userUsageTracking).values({
      userId,
      month,
      videosGenerated: 1,
      totalCharactersUsed: characterCount,
      totalVideoMinutesGenerated: videoDurationMinutes,
    });
  }
}
