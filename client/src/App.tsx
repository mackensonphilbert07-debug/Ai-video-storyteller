import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import StoryGenerator from "./pages/StoryGenerator";
import ProjectGallery from "./pages/ProjectGallery";
import PricingPage from "./pages/PricingPage";
import VideoGenerator from "./pages/VideoGenerator";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={""} component={Home} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/generate"}>
        <ProtectedRoute>
          <StoryGenerator />
        </ProtectedRoute>
      </Route>
      <Route path={"/video-generator"}>
        <ProtectedRoute>
          <VideoGenerator />
        </ProtectedRoute>
      </Route>
      <Route path={"/projects"}>
        <ProtectedRoute>
          <ProjectGallery />
        </ProtectedRoute>
      </Route>
      <Route path={"/pricing"} component={PricingPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
