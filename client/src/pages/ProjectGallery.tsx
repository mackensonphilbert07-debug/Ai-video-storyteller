import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, Play, Download, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProjectGallery() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch projects
  const { data: projects, isLoading, refetch } = trpc.video.listProjects.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Delete project mutation
  const deleteProjectMutation = trpc.video.deleteProject.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      refetch();
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete project: ${error?.message || "Unknown error"}`);
      setDeletingId(null);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Sign in to view your projects</h1>
          <Button onClick={() => setLocation("/")} size="lg">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      processing: { variant: "default", label: "Processing..." },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      setDeletingId(projectId);
      deleteProjectMutation.mutate({ projectId });
    }
  };

  const handleDownloadVideo = (projectId: number) => {
    // This would trigger the download - for now just show a message
    toast.info("Download feature coming soon");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Projects</h1>
            <p className="text-slate-400 text-sm">Manage your video generation projects</p>
          </div>
          <Button onClick={() => setLocation("/generate")} className="gap-2">
            <Plus size={18} />
            New Project
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-purple-500" size={32} />
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <Play size={48} className="mx-auto opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-slate-400 mb-6">Create your first video project to get started</p>
            <Button onClick={() => setLocation("/generate")} size="lg">
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-white">{project.title}</CardTitle>
                      <CardDescription className="text-slate-400 text-sm mt-1">
                        {formatDate(project.createdAt)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-slate-300 text-sm line-clamp-2">{project.description}</p>
                  )}

                  {project.errorMessage && (
                    <div className="bg-red-900/20 border border-red-700 rounded p-2 text-red-300 text-xs">
                      {project.errorMessage}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/project/${project.id}`)}
                    >
                      <Play size={16} className="mr-1" />
                      View
                    </Button>

                    {project.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadVideo(project.id)}
                      >
                        <Download size={16} className="mr-1" />
                        Download
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deletingId === project.id}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
