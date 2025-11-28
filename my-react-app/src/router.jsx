import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import BookingPage from './pages/Booking';
import HomePage from './pages/Home';
import ListingPage from './pages/Listing';
import MachinePage from './pages/Machine';
import NotFoundPage from './pages/NotFound';
import UserPage from './pages/User';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'booking', element: <BookingPage /> },
      { path: 'listing', element: <ListingPage /> },
      { path: 'machine', element: <MachinePage /> },
      { path: 'user', element: <UserPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
