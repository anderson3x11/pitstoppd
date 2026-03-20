import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import GrandsPrix from './pages/GrandsPrix'
import GrandPrix from './pages/GrandPrix'
import Saisons from './pages/Saisons'
import Saison from './pages/Saison'
import Pilotes from './pages/Pilotes'
import Pilote from './pages/Pilote'
import Profil from './pages/Profil'
import ProfilReviews from './pages/ProfilReviews'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import Review from './pages/Review'
import Search from './pages/Search'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'gps', element: <GrandsPrix /> },
      { path: 'gps/:saison/:slug', element: <GrandPrix /> },
      { path: 'gps/:saison/:slug/review/:username', element: <Review /> },
      { path: 'saisons', element: <Saisons /> },
      { path: 'saisons/:annee', element: <Saison /> },
      { path: 'pilotes', element: <Pilotes /> },
      { path: 'pilotes/:id', element: <Pilote /> },
      { path: 'settings', element: <Settings /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'search', element: <Search /> },
      // /:username doit être en dernier (route dynamique catch-all)
      { path: ':username/reviews', element: <ProfilReviews /> },
      { path: ':username', element: <Profil /> },
    ],
  },
])
