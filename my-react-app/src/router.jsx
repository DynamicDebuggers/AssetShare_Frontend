import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/Home';
import ListingPage from './pages/Listing';
import NotFoundPage from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'listings', element: <ListingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
