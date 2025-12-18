import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import CreateUserPage from './pages/CreateUser';
import HomePage from './pages/Home';
import NotFoundPage from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'opret-bruger', element: <CreateUserPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
