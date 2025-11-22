import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth0 } from "@auth0/auth0-react";
import { useMyTeam } from "../hooks/useMyTeam";
import { Link } from "react-router-dom";

const initialPlayerState = {
  name: "",
  steamProfile: "",
  dotabuffProfile: "",
  rank: "",
  position: "",
};

const getCountry = async () => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.country_name;
  } catch (error) {
    console.error("Error getting country:", error);
    return "Unknown";
  }
};

export const JoinTeamForm = () => {
  const [teamId, setTeamId] = useState("");
  const [player, setPlayer] = useState(initialPlayerState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useAuth0();
  const { team: existingTeam, loading } = useMyTeam();

  const handlePlayerChange = (field, value) => {
    setPlayer((currentPlayer) => ({
      ...currentPlayer,
      [field]: value,
    }));
  };

  if (loading) {
    return <div className="text-center text-white/60 py-8">Loading...</div>;
  }

  if (existingTeam) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4 text-white">Already on a Team</h2>
          <p className="text-white/80 mb-6">
            You are already a member of team "{existingTeam.name}". You cannot join another team.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !user?.sub) return;
    setError(null);
    setIsSubmitting(true);

    try {
      // First, fetch the current team data
      const { data: teamData, error: fetchError } = await supabase
        .from("teams_s6")
        .select("players")
        .eq("id", teamId)
        .single();

      if (fetchError) throw fetchError;
      if (!teamData) throw new Error("Team not found");

      // Parse existing players
      const currentPlayers = teamData.players.map((p) => {
        if (typeof p === 'string') {
          return JSON.parse(p);
        }
        return p;
      });

      // Check if team is full
      if (currentPlayers.length >= 5) {
        throw new Error("Team is already full");
      }

      // Check if user is already on this team
      if (currentPlayers.some(p => p.auth_id === user.sub)) {
        throw new Error("You are already a member of this team");
      }

      const country = await getCountry();

      // Add new player
      const playerWithAuthId = {
        ...player,
        auth_id: user.sub,
        country: country,
      };

      // Create new array with stringified player objects
      const updatedPlayers = [
        ...currentPlayers.map((p) => JSON.stringify(p)),
        JSON.stringify(playerWithAuthId)
      ];

      // Update the team with the new player
      const { error: updateError } = await supabase
        .from("teams_s6")
        .update({ players: updatedPlayers })
        .eq("id", teamId);

      if (updateError) throw updateError;

      // Reset form on success
      setTeamId("");
      setPlayer(initialPlayerState);
      setIsSuccess(true);
    } catch (err) {
      console.error("Error joining team:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <span className="material-symbols-outlined text-6xl text-primary">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Successfully Joined Team!</h2>
            <p className="text-white/80">
              You have successfully joined the team. You can now view your team details and roster.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ranks = ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"];
  const positions = ["Carry", "Mid", "Offlane", "Support", "Hard Support"];

  const inputClasses = "w-full px-4 py-2 bg-zinc-900 border-2 border-white/10 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-white placeholder-white/40";
  const selectClasses = "w-full px-4 py-2 bg-zinc-900 border-2 border-white/10 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-white";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 text-white">Join a Team</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Team ID</label>
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className={inputClasses}
              required
              placeholder="Enter the team's unique ID"
            />
            <p className="text-sm text-white/60 mt-2">
              Ask your team captain for the Team ID
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Player Information</h3>
            <div className="bg-zinc-900 p-6 rounded-lg space-y-4 border-2 border-primary/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Name</label>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange("name", e.target.value)}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Position</label>
                  <select
                    value={player.position}
                    onChange={(e) => handlePlayerChange("position", e.target.value)}
                    className={selectClasses}
                    required
                  >
                    <option value="">Select Position</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Steam Profile URL</label>
                  <input
                    type="url"
                    value={player.steamProfile}
                    onChange={(e) => handlePlayerChange("steamProfile", e.target.value)}
                    className={inputClasses}
                    placeholder="https://steamcommunity.com/id/..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Dotabuff Profile URL</label>
                  <input
                    type="url"
                    value={player.dotabuffProfile}
                    onChange={(e) => handlePlayerChange("dotabuffProfile", e.target.value)}
                    className={inputClasses}
                    placeholder="https://www.dotabuff.com/players/..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Rank</label>
                  <select
                    value={player.rank}
                    onChange={(e) => handlePlayerChange("rank", e.target.value)}
                    className={selectClasses}
                    required
                  >
                    <option value="">Select Rank</option>
                    {ranks.map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-lg transition-colors text-lg font-medium ${
                isSubmitting
                  ? "bg-zinc-700 text-white/40 cursor-not-allowed"
                  : "bg-primary text-black hover:bg-primary/80"
              }`}
            >
              {isSubmitting ? "Joining Team..." : "Join Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

