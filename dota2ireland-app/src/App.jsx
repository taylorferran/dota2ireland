import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { Analytics } from '@vercel/analytics/react';
import Layout from './components/Layout';

// Lazy load pages for better code splitting
const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const Merch = lazy(() => import('./pages/Merch'));
const League = lazy(() => import('./pages/League'));
const Contact = lazy(() => import('./pages/Contact'));
const Imprint = lazy(() => import('./pages/Imprint'));
const Casters = lazy(() => import('./pages/Casters'));

const domain = import.meta.env.VITE_AUTH0_DOMAIN || '***REMOVED_AUTH0_DOMAIN***';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || '***REMOVED_AUTH0_CLIENT_ID***';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  // Hide splash screen after app loads (with extra 0.5s delay)
  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 500);
      }, 500);
    }
  }, []);

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="events" element={<Events />} />
              <Route path="merch" element={<Merch />} />
              {/* League routes - redirect /league to /league/s6 (default to Season 6) */}
              <Route path="league" element={<Navigate to="/league/s6" replace />} />
              <Route path="league/:season" element={<League />} />
              <Route path="league/:season/:divisionOrView" element={<League />} />
              <Route path="league/:season/:divisionOrView/:view" element={<League />} />
              <Route path="imprint" element={<Imprint />} />
              <Route path="contact" element={<Contact />} />
            </Route>
            {/* Hidden page for casters - no navigation links */}
            <Route path="/casters" element={<Casters />} />
          </Routes>
        </Suspense>
      </Router>
      <Analytics />
    </Auth0Provider>
  );
}

export default App;
