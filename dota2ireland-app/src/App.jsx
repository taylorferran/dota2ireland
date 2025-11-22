import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import Merch from './pages/Merch';
import League from './pages/League';

const domain = import.meta.env.VITE_AUTH0_DOMAIN || '***REMOVED_AUTH0_DOMAIN***';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || '***REMOVED_AUTH0_CLIENT_ID***';

function App() {
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
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="events" element={<Events />} />
            <Route path="merch" element={<Merch />} />
            <Route path="league" element={<League />} />
          </Route>
        </Routes>
      </Router>
    </Auth0Provider>
  );
}

export default App;
