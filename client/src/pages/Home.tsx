import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  email: string;
  name: string | null;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleStartNow = () => {
    if (user) {
      setLocation("/video-generator");
    } else {
      setLocation("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Navigation Header */}
      <nav className="border-b border-purple-500/20 bg-black/30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">✨</div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AI Video Storyteller
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white"
              onClick={() => setLocation("/pricing")}
            >
              Pricing
            </Button>

            {isLoading ? (
              <div className="h-10 w-24 bg-purple-500/20 rounded animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <span className="text-gray-300">{user.name || user.email}</span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-900/30"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setLocation("/login")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h2 className="text-5xl sm:text-6xl font-bold text-white leading-tight">
            Transformez vos histoires en vidéos
          </h2>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Créez des vidéos narratives complètes avec l'IA. Entièrement gratuit, open source, sans API payante.
          </p>

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleStartNow}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6"
            >
              ✨ Commencer maintenant
            </Button>

            <Button
              onClick={() => setLocation("/pricing")}
              variant="outline"
              size="lg"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-900/30 text-lg px-8 py-6"
            >
              Voir les plans
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Analyse IA</h3>
            <p className="text-gray-400 text-sm">
              L'IA divise automatiquement votre histoire en scènes narratives cohérentes
            </p>
          </div>

          <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Génération d'Images</h3>
            <p className="text-gray-400 text-sm">
              Crée des images visuelles pour chaque scène basées sur votre histoire
            </p>
          </div>

          <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition">
            <div className="text-3xl mb-3">🎙️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Narration Vocale</h3>
            <p className="text-gray-400 text-sm">
              Génère une narration vocale naturelle dans votre langue préférée
            </p>
          </div>

          <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition">
            <div className="text-3xl mb-3">📹</div>
            <h3 className="text-lg font-semibold text-white mb-2">Vidéo Complète</h3>
            <p className="text-gray-400 text-sm">
              Téléchargez votre vidéo finale en haute qualité avec sous-titres
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-20 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-lg p-12">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Comment ça marche</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full text-white font-bold mb-4">
                1
              </div>
              <h4 className="text-white font-semibold mb-2">Écrivez votre idée</h4>
              <p className="text-gray-400 text-sm">Décrivez l'histoire que vous voulez transformer en vidéo</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full text-white font-bold mb-4">
                2
              </div>
              <h4 className="text-white font-semibold mb-2">Choisissez les options</h4>
              <p className="text-gray-400 text-sm">Sélectionnez la langue, la voix et la qualité vidéo</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full text-white font-bold mb-4">
                3
              </div>
              <h4 className="text-white font-semibold mb-2">Générez la vidéo</h4>
              <p className="text-gray-400 text-sm">L'IA crée votre vidéo en quelques minutes</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full text-white font-bold mb-4">
                4
              </div>
              <h4 className="text-white font-semibold mb-2">Téléchargez</h4>
              <p className="text-gray-400 text-sm">Obtenez votre vidéo finale prête à partager</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-black/30 backdrop-blur mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400 text-sm">
          <p>© 2026 AI Video Storyteller. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
