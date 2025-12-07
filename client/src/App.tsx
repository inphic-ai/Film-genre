import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Board from "./pages/Board";

import Manage from "./pages/Manage";
import VideoDetail from "./pages/VideoDetail";
import Dashboard from "./pages/Dashboard";
import TagDetailPage from "./pages/TagDetailPage";
import TagRankingPage from "./pages/TagRankingPage";
import ReviewCenter from "./pages/ReviewCenter";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/board"} component={Board} />

      <Route path={"/manage"} component={Manage} />
      <Route path={"/manage/:id"} component={Manage} />
      <Route path={"/video/:id"} component={VideoDetail} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/tag/:id"} component={TagDetailPage} />
      <Route path={"/tags/ranking"} component={TagRankingPage} />
      <Route path={"/admin/review"} component={ReviewCenter} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
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
