import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { Analytics } from '@vercel/analytics/react';
import Layout from './components/Layout';
import { ToastProvider } from './components/ToastProvider';

// Lazy load pages for better code splitting
const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const Merch = lazy(() => import('./pages/Merch'));
const League = lazy(() => import('./pages/League'));
const Contact = lazy(() => import('./pages/Contact'));
const Imprint = lazy(() => import('./pages/Imprint'));
const Casters = lazy(() => import('./pages/Casters'));
const S7Availability = lazy(() => import('./pages/S7Availability'));
const Rules = lazy(() => import('./pages/Rules'));
const Rebooted2 = lazy(() => import('./pages/Rebooted2'));
const Rebooted2Tables = lazy(() => import('./pages/Rebooted2Tables'));
const Rebooted2Admin = lazy(() => import('./pages/Rebooted2Admin'));
const Season7Availability = lazy(() => import('./pages/Season7Availability'));

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate();
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={(appState) => navigate(appState?.returnTo ?? '/')}
    >
      {children}
    </Auth0Provider>
  );
}

function App() {
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
    <Router>
      <Auth0ProviderWithNavigate>
        <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="events" element={<Events />} />
              <Route path="events/rebooted2" element={<Rebooted2 />} />
              <Route path="events/rebooted2-tournament" element={<Rebooted2Tables />} />
              <Route path="merch" element={<Merch />} />
              {/* League routes - redirect /league to /league/s7 (default to Season 7) */}
              <Route path="league" element={<Navigate to="/league/s7" replace />} />
              <Route path="league/rules" element={<Rules />} />
              <Route path="league/s7/availability" element={<S7Availability />} />
              <Route path="league/:season" element={<League />} />
              <Route path="league/:season/:divisionOrView" element={<League />} />
              <Route path="league/:season/:divisionOrView/:view" element={<League />} />
              <Route path="imprint" element={<Imprint />} />
              <Route path="contact" element={<Contact />} />
            </Route>
            {/* Hidden page for casters - no navigation links */}
            <Route path="/casters" element={<Casters />} />
            {/* Hidden admin page for Rebooted2 team management */}
            <Route path="/rebooted2-admin" element={<Rebooted2Admin />} />
            {/* Hidden admin page: Season 7 player availability (read-only) */}
            <Route path="/season7availability" element={<Season7Availability />} />
          </Routes>
        </Suspense>
        <Analytics />
        </ToastProvider>
      </Auth0ProviderWithNavigate>
    </Router>
  );
}

export default App;
