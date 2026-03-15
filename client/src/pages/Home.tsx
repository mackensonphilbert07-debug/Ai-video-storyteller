import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, Palette, Download } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, navigate] = useLocation();

  const handleGetStarted = () => {
    // Always redirect to login first if not authenticated
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    // Navigate to video generator if authenticated
    navigate("/video-generator");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold text-white">AI Video Storyteller</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate("/pricing")} className="text-slate-300 hover:text-white">
              Pricing
            </Button>
            {isAuthenticated ? (
              <>
                <span className="text-slate-300">{user?.name}</span>
                <Button variant="outline" onClick={logout} className="border-slate-600 text-slate-300 hover:text-white">
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()} className="bg-purple-600 hover:bg-purple-700 text-white">
                Connexion
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="space-y-6">
          <h2 className="text-5xl md:text-6xl font-bold text-white">
            Transformez vos histoires en vidéos
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Créez des vidéos narratives complètes avec l'IA. Entièrement gratuit, open source, sans API payante.
          </p>
          <Button
            onClick={handleGetStarted}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 px-8 text-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Commencer maintenant
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-white mb-12 text-center">Fonctionnalités</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Sparkles className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Analyse IA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">L'IA divise automatiquement votre histoire en scènes cohérentes</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Palette className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Génération d'Images</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">Crée des images visuelles pour chaque scène</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Zap className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Narration Vocale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">Génère une narration vocale naturelle pour votre histoire</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Download className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Vidéo Complète</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">Téléchargez votre vidéo finale en haute qualité</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="space-y-6">
          <h3 className="text-3xl font-bold text-white">Prêt à commencer ?</h3>
          <p className="text-xl text-slate-300">
            Créez votre première vidéo narrative en quelques minutes
          </p>
          <Button
            onClick={handleGetStarted}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 px-8 text-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Commencer maintenant
          </Button>
        </div>
      </section>
    </div>
  );
}
