import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Board from "./pages/Board";

// Lazy load non-critical pages for better performance
const Manage = lazy(() => import("./pages/Manage"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TagDetailPage = lazy(() => import("./pages/TagDetailPage"));
const TagRankingPage = lazy(() => import("./pages/TagRankingPage"));
const ReviewCenter = lazy(() => import("./pages/ReviewCenter"));
const Products = lazy(() => import("./pages/Products"));
const MyContributions = lazy(() => import("./pages/MyContributions"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const TagsManagement = lazy(() => import("./pages/TagsManagement"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PerformanceMonitor = lazy(() => import("./pages/PerformanceMonitor"));
const Creators = lazy(() => import("./pages/Creators"));
const CreatorDetail = lazy(() => import("./pages/CreatorDetail"));
const OperationLogs = lazy(() => import("./pages/OperationLogs"));
const CategoryManagement = lazy(() => import("./pages/CategoryManagement").then(m => ({ default: m.CategoryManagement })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/admin/categories" component={CategoryManagement} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
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
