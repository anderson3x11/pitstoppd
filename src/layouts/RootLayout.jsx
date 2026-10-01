import { Outlet, ScrollRestoration } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// children : utilisé par errorElement (404), sinon <Outlet />
export default function RootLayout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-page text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] btn btn-primary btn-sm">Skip to content</a>
      <Navbar />
      <main id="main" className="flex-1">
        {children ?? <Outlet />}
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
