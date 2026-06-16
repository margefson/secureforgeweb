import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/views/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/views/Home";
import Login from "@/views/Login";
import Register from "@/views/Register";
import Dashboard from "@/views/Dashboard";
import Applications from "@/views/Applications";
import NewApplication from "@/views/NewApplication";
import ApplicationDetail from "@/views/ApplicationDetail";
import AnalysisChecklistWizard from "@/views/AnalysisChecklistWizard";
import Admin from "@/views/Admin";
import AdminUsers from "@/views/AdminUsers";
import Profile from "@/views/Profile";
import ResetPassword from "@/views/ResetPassword";
import ComingSoon from "@/views/ComingSoon";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/applications/new" component={NewApplication} />
      <Route path="/analyses/:id/checklist" component={AnalysisChecklistWizard} />
      <Route path="/applications/:id" component={ApplicationDetail} />
      <Route path="/applications" component={Applications} />
      <Route path="/posture" component={ComingSoon} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/profile" component={Profile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
