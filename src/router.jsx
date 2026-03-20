import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'

const Home = lazy(() => import('./pages/Home'))
const GrandsPrix = lazy(() => import('./pages/GrandsPrix'))
const GrandPrix = lazy(() => import('./pages/GrandPrix'))
const Saisons = lazy(() => import('./pages/Saisons'))
const Saison = lazy(() => import('./pages/Saison'))
const Pilotes = lazy(() => import('./pages/Pilotes'))
const Pilote = lazy(() => import('./pages/Pilote'))
const Profil = lazy(() => import('./pages/Profil'))
const ProfilReviews = lazy(() => import('./pages/ProfilReviews'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Review = lazy(() => import('./pages/Review'))
const Search = lazy(() => import('./pages/Search'))

function Lazy({ children }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-10"><p className="text-muted text-sm">Loading…</p></div>}>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Lazy><Home /></Lazy> },
      { path: 'gps', element: <Lazy><GrandsPrix /></Lazy> },
      { path: 'gps/:saison/:slug', element: <Lazy><GrandPrix /></Lazy> },
      { path: 'gps/:saison/:slug/review/:username', element: <Lazy><Review /></Lazy> },
      { path: 'saisons', element: <Lazy><Saisons /></Lazy> },
      { path: 'saisons/:annee', element: <Lazy><Saison /></Lazy> },
      { path: 'pilotes', element: <Lazy><Pilotes /></Lazy> },
      { path: 'pilotes/:id', element: <Lazy><Pilote /></Lazy> },
      { path: 'settings', element: <Lazy><Settings /></Lazy> },
      { path: 'login', element: <Lazy><Login /></Lazy> },
      { path: 'register', element: <Lazy><Register /></Lazy> },
      { path: 'search', element: <Lazy><Search /></Lazy> },
      // /:username doit être en dernier (route dynamique catch-all)
      { path: ':username/reviews', element: <Lazy><ProfilReviews /></Lazy> },
      { path: ':username', element: <Lazy><Profil /></Lazy> },
    ],
  },
])
