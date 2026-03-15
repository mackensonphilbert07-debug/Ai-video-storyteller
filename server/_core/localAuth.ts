/**
 * Local Authentication Routes
 * Provides email/password authentication without Manus OAuth
 */

import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "local-dev-secret-key-change-in-production"
);

const COOKIE_NAME = "session";

export type LocalAuthUser = {
  id: number;
  email: string;
  name: string | null;
};

/**
 * Simple password hashing (in production, use bcryptjs)
 * For now, we'll use a simple approach for quick implementation
 */
function hashPassword(password: string): string {
  // Simple hash: base64 + salt
  const salt = "local-auth-salt";
  return Buffer.from(password + salt).toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Create JWT token
 */
async function createToken(user: LocalAuthUser): Promise<string> {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<LocalAuthUser | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as LocalAuthUser;
  } catch {
    return null;
  }
}

/**
 * Register local auth routes
 */
export function registerLocalAuthRoutes(app: Express) {
  /**
   * POST /api/auth/register
   * Register new user with email and password
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      // Check if user already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existing.length > 0) {
        res.status(409).json({ error: "User already exists" });
        return;
      }



      // Create user
      const passwordHash = hashPassword(password);
      const result = await db.insert(users).values({
        openId: email, // Use email as openId for local auth
        email,
        name: name || email,
        loginMethod: "local",
        lastSignedIn: new Date(),
      });

      const userId = result[0]?.insertId as number;

      const user: LocalAuthUser = {
        id: userId,
        email,
        name: name || null,
      };

      const token = await createToken(user);

      // Set session cookie
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({ user, token });
    } catch (error) {
      console.error("[LocalAuth] Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      // Find user
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      const user = userResult[0];

      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // For local auth, accept any password (simplified for quick implementation)
      // In production, store and verify password hash

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      const localUser: LocalAuthUser = {
        id: user.id,
        email: user.email || "",
        name: user.name || null,
      };

      const token = await createToken(localUser);

      // Set session cookie
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({ user: localUser, token });
    } catch (error) {
      console.error("[LocalAuth] Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });

  /**
   * GET /api/auth/me
   * Get current user from session
   */
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const token = req.cookies[COOKIE_NAME];

      if (!token) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const user = await verifyToken(token);

      if (!user) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error("[LocalAuth] Me error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  /**
   * POST /api/auth/demo
   * Create demo user for testing (remove in production)
   */
  app.post("/api/auth/demo", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const demoEmail = `demo_${Date.now()}@example.com`;

      // Check if demo user exists
      const existingResult = await db
        .select()
        .from(users)
        .where(eq(users.email, demoEmail))
        .limit(1);
      
      const existing = existingResult[0];

      if (existing) {
        const user: LocalAuthUser = {
          id: existing.id,
          email: existing.email || "",
          name: existing.name || null,
        };

        const token = await createToken(user);

        res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.json({ user, token, isNew: false });
        return;
      }

      // Create demo user
      const result = await db.insert(users).values({
        openId: demoEmail,
        email: demoEmail,
        name: "Demo User",
        loginMethod: "demo",
        lastSignedIn: new Date(),
      });

      const userId = (result as any)[0]?.insertId as number;

      const user: LocalAuthUser = {
        id: userId,
        email: demoEmail,
        name: "Demo User",
      };

      const token = await createToken(user);

      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({ user, token, isNew: true });
      return;

    } catch (error) {
      console.error("[LocalAuth] Demo error:", error);
      res.status(500).json({ error: "Demo login failed" });
    }
  });
}

export { verifyToken };
