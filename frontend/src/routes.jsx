import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import Reset from "./pages/Reset";
import ResetConfirm from "./pages/ResetConfirm";
import Main from "./pages/Main";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import PostViewModal from "./components/PostViewModal";
import FollowList from "./components/FollowList";

function RequireAuth({ children }) {
  let isAuthenticated = false;
  try {
    const stored = JSON.parse(localStorage.getItem("me") || "{}");
    isAuthenticated = Boolean(stored?.user);
  } catch (_err) {
    isAuthenticated = false;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function MeRedirect() {
  const me = JSON.parse(localStorage.getItem("me") || "{}")?.user;
  if (!me?.username) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${me.username}`} replace />;
}

function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  return <PostViewModal postId={postId} onClose={() => navigate(-1)} />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/reset/confirm" element={<ResetConfirm />} />

     

      <Route
        path="/"
        element={
          <RequireAuth>
            <Navigate to="/register" replace />
          </RequireAuth>
        }
      />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <Main />
          </RequireAuth>
        }
      />

      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <Notifications />
          </RequireAuth>
        }
      />
     
      <Route
        path="/explore"
        element={
          <RequireAuth>
            <Explore />
          </RequireAuth>
        }
      />
      <Route
        path="/messages"
        element={
          <RequireAuth>
            <Messages />
          </RequireAuth>
        }
      />

    
      <Route
        path="/profile/me"
        element={
          <RequireAuth>
            <MeRedirect />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/:username"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/:username/followers"
        element={
          <RequireAuth>
            <FollowList mode="followers" />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/:username/following"
        element={
          <RequireAuth>
            <FollowList mode="following" />
          </RequireAuth>
        }
      />

      <Route
        path="/p/:postId"
        element={
          <RequireAuth>
            <PostPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
