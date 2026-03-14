import { describe, it, expect, beforeEach, vi } from "vitest";
import { videoRouter } from "./video";
import * as db from "../db";

// Mock the database functions
vi.mock("../db", () => ({
  createVideoProject: vi.fn(),
  getUserVideoProjects: vi.fn(),
  getVideoProjectById: vi.fn(),
  updateVideoProject: vi.fn(),
  createScene: vi.fn(),
  getProjectScenes: vi.fn(),
  addToProcessingQueue: vi.fn(),
}));

// Mock the LLM function
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("videoRouter", () => {
  const mockUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockContext = {
    user: mockUser,
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProject", () => {
    it("should create a new video project", async () => {
      const input = {
        title: "My Story",
        description: "A great story",
        text: "Once upon a time, there was a brave knight...",
      };

      const mockResult = { insertId: 1 };
      (db.createVideoProject as any).mockResolvedValue(mockResult);

      const caller = videoRouter.createCaller(mockContext);
      const result = await caller.createProject(input);

      expect(db.createVideoProject).toHaveBeenCalledWith(mockUser.id, {
        title: input.title,
        description: input.description,
        originalText: input.text,
        status: "draft",
      });
      expect(result).toEqual(mockResult);
    });

    it("should reject if text is too short", async () => {
      const input = {
        title: "My Story",
        description: "A great story",
        text: "Short",
      };

      const caller = videoRouter.createCaller(mockContext);
      
      await expect(caller.createProject(input)).rejects.toThrow();
    });

    it("should reject if user is not authenticated", async () => {
      const input = {
        title: "My Story",
        description: "A great story",
        text: "Once upon a time, there was a brave knight...",
      };

      const unauthContext = { ...mockContext, user: null };
      const caller = videoRouter.createCaller(unauthContext);
      
      await expect(caller.createProject(input)).rejects.toThrow("Please login");
    });
  });

  describe("listProjects", () => {
    it("should list all projects for the user", async () => {
      const mockProjects = [
        { id: 1, userId: mockUser.id, title: "Project 1", status: "draft" },
        { id: 2, userId: mockUser.id, title: "Project 2", status: "completed" },
      ];

      (db.getUserVideoProjects as any).mockResolvedValue(mockProjects);

      const caller = videoRouter.createCaller(mockContext);
      const result = await caller.listProjects();

      expect(db.getUserVideoProjects).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockProjects);
    });

    it("should reject if user is not authenticated", async () => {
      const unauthContext = { ...mockContext, user: null };
      const caller = videoRouter.createCaller(unauthContext);
      
      await expect(caller.listProjects()).rejects.toThrow("Please login");
    });
  });

  describe("getProject", () => {
    it("should get a project with its scenes", async () => {
      const mockProject = { id: 1, userId: mockUser.id, title: "Project 1", status: "draft" };
      const mockScenes = [
        { id: 1, projectId: 1, sceneNumber: 1, title: "Scene 1" },
        { id: 2, projectId: 1, sceneNumber: 2, title: "Scene 2" },
      ];

      (db.getVideoProjectById as any).mockResolvedValue(mockProject);
      (db.getProjectScenes as any).mockResolvedValue(mockScenes);

      const caller = videoRouter.createCaller(mockContext);
      const result = await caller.getProject({ projectId: 1 });

      expect(db.getVideoProjectById).toHaveBeenCalledWith(1);
      expect(db.getProjectScenes).toHaveBeenCalledWith(1);
      expect(result).toEqual({ project: mockProject, scenes: mockScenes });
    });

    it("should reject if project does not exist", async () => {
      (db.getVideoProjectById as any).mockResolvedValue(null);

      const caller = videoRouter.createCaller(mockContext);
      
      await expect(caller.getProject({ projectId: 999 })).rejects.toThrow("Project not found or access denied");
    });

    it("should reject if project belongs to another user", async () => {
      const otherUserProject = { id: 1, userId: 999, title: "Project 1", status: "draft" };
      (db.getVideoProjectById as any).mockResolvedValue(otherUserProject);

      const caller = videoRouter.createCaller(mockContext);
      
      await expect(caller.getProject({ projectId: 1 })).rejects.toThrow("Project not found or access denied");
    });
  });
});
