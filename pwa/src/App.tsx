import { Navigate, Route, Routes } from "react-router";
import AppShell from "./components/AppShell";
import { useAuth } from "./lib/auth";
import ActivityPage from "./pages/ActivityPage";
import AppsPage from "./pages/AppsPage";
import ChildDetailPage from "./pages/ChildDetailPage";
import ChildrenPage from "./pages/ChildrenPage";
import DashboardPage from "./pages/DashboardPage";
import PairingPage from "./pages/PairingPage";
import SettingsPage from "./pages/SettingsPage";
// ShopPage removed from MVP
import SignInPage from "./pages/SignInPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import TasksPage from "./pages/TasksPage";

function App() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="h-full grid place-items-center">
        <div className="text-muted text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/children" element={<ChildrenPage />} />
        <Route path="/children/:uid" element={<ChildDetailPage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="/pairing" element={<PairingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
