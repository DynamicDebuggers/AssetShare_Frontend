import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import App from './App';
import { getStoredToken } from './api/client';
import HomePage from './pages/Home';
import CreateUserPage from './pages/CreateUser';
import LoginPage from './pages/Login';
import ListingPage from './pages/Listing';
import UserPage from './pages/User';
import NotFoundPage from './pages/NotFound';

function RequireAuth({ children }) {
  const location = useLocation();
  const isLoggedIn = Boolean(getStoredToken());
  const publicPaths = ['/', '/login', '/opret-bruger'];

  if (!isLoggedIn && !publicPaths.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'opret-bruger', element: <CreateUserPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'listings', element: <ListingPage /> },
      { path: 'user', element: <UserPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
