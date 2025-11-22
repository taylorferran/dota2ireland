import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth0 } from "@auth0/auth0-react";

export const useMyTeam = () => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth0();

  const fetchTeam = useCallback(async () => {
    if (!user?.sub) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("teams_s6").select("*");

      if (error) throw error;

      if (data) {
        const parsedTeams = data.map((team) => ({
          ...team,
          players: team.players.map((player) => {
            if (typeof player === 'string') {
              return JSON.parse(player);
            }
            return player;
          }),
        }));

        const myTeam = parsedTeams.find((team) => 
          team.players.some((player) => player.auth_id === user.sub)
        );

        setTeam(myTeam || null);
      }
    } catch (err) {
      console.error("Error fetching team:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [user?.sub]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return {
    team,
    loading,
    error,
    mutate: fetchTeam,
  };
};

