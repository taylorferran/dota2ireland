import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { signSupabaseToken } from "../lib/auth";

export const useAuth = () => {
  const auth0 = useAuth0();
  const [supabaseToken, setSupabaseToken] = useState(null);

  useEffect(() => {
    const setToken = async () => {
      if (auth0.isAuthenticated && auth0.user && auth0.user.sub) {
        try {
          const token = await signSupabaseToken({ sub: auth0.user.sub });
          setSupabaseToken(token);
        } catch (error) {
          console.error('Error signing Supabase token:', error);
          setSupabaseToken(null);
        }
      } else if (!auth0.isLoading) {
        setSupabaseToken(null);
      }
    };
    
    setToken();
  }, [auth0.isAuthenticated, auth0.user, auth0.isLoading]);

  return {
    isAuthenticated: auth0.isAuthenticated,
    user: auth0.user,
    supabaseToken,
    isLoading: auth0.isLoading,
    login: auth0.loginWithRedirect,
    logout: auth0.logout,
  };
};

