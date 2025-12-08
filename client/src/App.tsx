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
import Products from "./pages/Products";
import MyContributions from "./pages/MyContributions";
import AdminSettings from "./pages/AdminSettings";
import TagsManagement from "./pages/TagsManagement";
import Notifications from "./pages/Notifications";
import PerformanceMonitor from "./pages/PerformanceMonitor";
import Creators from "./pages/Creators";
import CreatorDetail from "./pages/CreatorDetail";
import OperationLogs from "./pages/OperationLogs";

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
      <Route path={"/products"} component={Products} />
      <Route path={"/my-contributions"} component={MyContributions} />
      <Route path={"/admin/settings"} component={AdminSettings} />
      <Route path={"/admin/tags"} component={TagsManagement} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/admin/performance"} component={PerformanceMonitor} />
        <Route path="/creators" component={Creators} />
        <Route path="/creator/:creatorName" component={CreatorDetail} />
        <Route path="/admin/logs" component={OperationLogs} />
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
