import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PageLayout from "./components/PageLayout";
import SessionManager from "./components/SessionManager";

import AdminDashboard from "./pages/AdminDashboard";
import CreatePlayRequest from "./pages/CreatePlayRequest";
import FindPartner from "./pages/FindPartner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MatchDetails from "./pages/MatchDetails";
import PlayerDetails from "./pages/PlayerDetails";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Requests from "./pages/Requests";

function App() {
  return (
    <>
      <SessionManager />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PageLayout>
                <Home />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/partner"
          element={
            <ProtectedRoute>
              <PageLayout>
                <FindPartner />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/player/:id"
          element={
            <ProtectedRoute>
              <PageLayout>
                <PlayerDetails />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <PageLayout>
                <CreatePlayRequest />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageLayout>
                <Profile />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <PageLayout>
                <Requests />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <PageLayout>
                <AdminDashboard />
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/match/:id"
          element={
            <ProtectedRoute>
              <PageLayout>
                <MatchDetails />
              </PageLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;