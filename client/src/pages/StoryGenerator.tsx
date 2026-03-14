import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, Download, Play, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Scene {
  title: string;
  description: string;
  imagePrompt: string;
  textContent: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

export default function StoryGenerator() {
  const { user, isAuthenticated } = useAuth();
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<"input" | "scenes" | "video">("input");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const createProjectMutation = trpc.video.createProject.useMutation();
  const analyzeScenesMutation = trpc.video.analyzeAndGenerateScenes.useMutation();

  const handleGenerateScenes = async () => {
    if (!storyText.trim()) {
      toast.error("Veuillez entrer une histoire");
      return;
    }

    if (storyText.length < 10) {
      toast.error("L'histoire doit contenir au moins 10 caractères");
      return;
    }

    if (storyText.length > 30000) {
      toast.error("L'histoire ne peut pas dépasser 30 000 caractères");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter d'abord");
      return;
    }

    setIsGeneratingScenes(true);

    try {
      // Create project first
      const projectResult = await createProjectMutation.mutateAsync({
        title: storyTitle || "Untitled Story",
        description: "",
        text: storyText,
      });

      const newProjectId = (projectResult as any).id;
      if (!newProjectId) {
        throw new Error("Failed to create project: no ID returned");
      }
      setProjectId(newProjectId);

      // Analyze and generate scenes
      const scenesResult = await analyzeScenesMutation.mutateAsync({
        projectId: newProjectId,
        text: storyText,
      });

      setScenes(scenesResult.scenes);
      setCurrentStep("scenes");
      toast.success(`${scenesResult.scenes.length} scènes générées avec succès!`);
    } catch (error) {
      console.error("Error generating scenes:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la génération des scènes";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingScenes(false);
    }
  };

  const handleCreateVideo = async () => {
    if (scenes.length === 0) {
      toast.error("Aucune scène à traiter");
      return;
    }

    setIsGeneratingVideo(true);

    try {
      // Simulate video generation
      // In production, this would call the actual video generation API
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const mockVideoUrl = "https://example.com/generated-video.mp4";
      setVideoUrl(mockVideoUrl);
      setCurrentStep("video");
      toast.success("Vidéo générée avec succès!");
    } catch (error) {
      console.error("Error creating video:", error);
      toast.error("Erreur lors de la création de la vidéo");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownloadVideo = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `${storyTitle || "story"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Téléchargement commencé");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">AI Video Storyteller</h1>
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-lg text-slate-300">
            Transformez votre histoire en vidéo avec l'IA - Entièrement gratuit et open source
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Votre Histoire</CardTitle>
                <CardDescription className="text-slate-400">
                  Écrivez votre histoire ou votre idée de vidéo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Titre du projet
                  </label>
                  <Input
                    placeholder="Ex: Le voyage du chevalier courageux"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Votre histoire (minimum 10 caractères, maximum 30 000)
                  </label>
                  <Textarea
                    placeholder="Il était une fois, dans un royaume lointain..."
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value.substring(0, 30000))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-64"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {storyText.length} / 30 000 caractères
                  </p>
                </div>

                <Button
                  onClick={handleGenerateScenes}
                  disabled={isGeneratingScenes || !storyText.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 text-lg"
                >
                  {isGeneratingScenes ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Générer les scènes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Info */}
          <div className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Comment ça marche?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p>Écrivez votre histoire</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p>L'IA divise en scènes</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p>Génère images et voix</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <p>Crée la vidéo finale</p>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-slate-800 border-slate-700">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-300">
                100% gratuit et open source. Aucune API payante utilisée.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Scenes Display */}
        {scenes.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Scènes générées ({scenes.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenes.map((scene, index) => (
                <Card key={index} className="bg-slate-800 border-slate-700 overflow-hidden hover:border-purple-500 transition">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-base">Scène {index + 1}: {scene.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-slate-700 rounded h-40 flex items-center justify-center">
                      {scene.imageUrl ? (
                        <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">Génération d'image...</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{scene.description}</p>
                    <p className="text-xs text-slate-400">
                      Prompt: {scene.imagePrompt.substring(0, 50)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex gap-4 justify-center">
              <Button
                onClick={handleCreateVideo}
                disabled={isGeneratingVideo}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-6 px-8 text-lg"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Créer la vidéo
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Video Result */}
        {videoUrl && (
          <div className="mt-12">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Vidéo générée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full aspect-video"
                    src={videoUrl}
                  />
                </div>
                <Button
                  onClick={handleDownloadVideo}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Télécharger la vidéo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
