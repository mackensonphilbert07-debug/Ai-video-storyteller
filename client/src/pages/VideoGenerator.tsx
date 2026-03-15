import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Download, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<"fr" | "en" | "es" | "ht">("en");
  const [targetLanguages, setTargetLanguages] = useState<("fr" | "en" | "es" | "ht")[]>([]);
  const [voiceCharacter, setVoiceCharacter] = useState<"male" | "female" | "neutral">("neutral");
  const [videoQuality, setVideoQuality] = useState<"720p" | "1080p">("1080p");
  const [transition, setTransition] = useState<"fade" | "slide" | "zoom" | "none">("fade");
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [generatedVideo, setGeneratedVideo] = useState<{
    url: string;
    duration: number;
    title: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);

  const { data: supportedOptions } = trpc.aiVideo.getSupportedLanguages.useQuery();
  const createVideoMutation = trpc.aiVideo.createVideoFromStory.useMutation({
    onSuccess: (data) => {
      setGeneratedVideo({
        url: data.videoUrl,
        duration: data.duration,
        title: data.metadata.title,
      });
      setProgress(100);
    },
    onError: (error) => {
      console.error("Error creating video:", error);
      setProgress(0);
    },
  });

  const handleCreateVideo = async () => {
    if (!prompt.trim()) {
      alert("Veuillez entrer une idée d'histoire");
      return;
    }

    setProgress(10);
    setGeneratedVideo(null);

    try {
      await createVideoMutation.mutateAsync({
        storyPrompt: prompt,
        sourceLanguage,
        targetLanguages,
        videoQuality,
        voiceCharacter,
        includeSubtitles,
        transition,
      });
    } catch (error) {
      console.error("Failed to create video:", error);
    }
  };

  const handleDownloadVideo = () => {
    if (!generatedVideo?.url) return;

    const a = document.createElement("a");
    a.href = generatedVideo.url;
    a.download = `${generatedVideo.title}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleTargetLanguage = (lang: "fr" | "en" | "es" | "ht") => {
    if (lang === sourceLanguage) return; // Can't select source language as target

    setTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎬 Créateur de Vidéos IA
          </h1>
          <p className="text-purple-200">
            Transformez votre idée en vidéo narrative complète en quelques clics
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Story Prompt */}
            <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Votre Idée d'Histoire</CardTitle>
                <CardDescription>
                  Décrivez l'histoire que vous souhaitez créer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Ex: Une aventure épique d'un chevalier qui sauve un royaume..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-32 bg-slate-700 border-purple-500/30 text-white placeholder-slate-400"
                  maxLength={1000}
                />
                <div className="text-sm text-slate-400">
                  {prompt.length}/1000 caractères
                </div>
              </CardContent>
            </Card>

            {/* Language & Voice Settings */}
            <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Paramètres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Source Language */}
                <div className="space-y-2">
                  <Label className="text-white">Langue Principale</Label>
                  <Select value={sourceLanguage} onValueChange={(v: any) => setSourceLanguage(v)}>
                    <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-purple-500/30">
                      {supportedOptions?.languages &&
                        Object.entries(supportedOptions.languages).map(([code, name]) => (
                          <SelectItem key={code} value={code} className="text-white">
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Character */}
                <div className="space-y-2">
                  <Label className="text-white">Type de Voix</Label>
                  <Select value={voiceCharacter} onValueChange={(v: any) => setVoiceCharacter(v)}>
                    <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-purple-500/30">
                      {supportedOptions?.voiceCharacters &&
                        Object.entries(supportedOptions.voiceCharacters).map(([code, name]) => (
                          <SelectItem key={code} value={code} className="text-white">
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Video Quality */}
                <div className="space-y-2">
                  <Label className="text-white">Qualité Vidéo</Label>
                  <Select value={videoQuality} onValueChange={(v: any) => setVideoQuality(v)}>
                    <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-purple-500/30">
                      {supportedOptions?.videoQualities &&
                        Object.entries(supportedOptions.videoQualities).map(([code, name]) => (
                          <SelectItem key={code} value={code} className="text-white">
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transition */}
                <div className="space-y-2">
                  <Label className="text-white">Transition</Label>
                  <Select value={transition} onValueChange={(v: any) => setTransition(v)}>
                    <SelectTrigger className="bg-slate-700 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-purple-500/30">
                      {supportedOptions?.transitions &&
                        Object.entries(supportedOptions.transitions).map(([code, name]) => (
                          <SelectItem key={code} value={code} className="text-white">
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subtitles */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="subtitles"
                    checked={includeSubtitles}
                    onChange={(e) => setIncludeSubtitles(e.target.checked)}
                    className="rounded border-purple-500/30"
                  />
                  <Label htmlFor="subtitles" className="text-white cursor-pointer">
                    Inclure les sous-titres
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Create Button */}
            <Button
              onClick={handleCreateVideo}
              disabled={!prompt.trim() || createVideoMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg"
            >
              {createVideoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Création en cours... {progress}%
                </>
              ) : (
                "🎬 Créer la Vidéo"
              )}
            </Button>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Aperçu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedVideo ? (
                  <>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        src={generatedVideo.url}
                        controls
                        className="w-full h-full"
                        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%23000' width='16' height='9'/%3E%3Cpath fill='%23fff' d='M6 2.5L12 4.5L6 6.5Z'/%3E%3C/svg%3E"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white truncate">
                        {generatedVideo.title}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Durée: {Math.round(generatedVideo.duration)}s
                      </p>
                    </div>
                    <Button
                      onClick={handleDownloadVideo}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </Button>
                  </>
                ) : (
                  <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-12 w-12 text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">
                        Votre vidéo apparaîtra ici
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Alert */}
        {createVideoMutation.isError && (
          <Alert className="mt-6 bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">
              {createVideoMutation.error?.message || "Une erreur s'est produite"}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
