import React, { useState } from "react";
import { supabase, getSupabaseClient } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
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

export const AddTeamForm = ({ divisionId = 1 }) => {
  const [teamName, setTeamName] = useState("");
  const [player, setPlayer] = useState(initialPlayerState);
  const [teamImage, setTeamImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, supabaseToken } = useAuth();
  const { team: existingTeam, loading } = useMyTeam();

  const handlePlayerChange = (field, value) => {
    setPlayer((currentPlayer) => ({
      ...currentPlayer,
      [field]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setTeamImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setTeamImage(null);
    setImagePreview(null);
  };

  const uploadImage = async (file) => {
    if (!supabaseToken) {
      console.error('No Supabase token available');
      return null;
    }

    try {
      const authenticatedClient = getSupabaseClient(supabaseToken);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error } = await authenticatedClient.storage
        .from('team-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const { data: { publicUrl } } = authenticatedClient.storage
        .from('team-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
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
            You are already a member of team "{existingTeam.name}". You cannot register a new team while being a member of another team.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !user?.sub || !teamImage) return;

    setIsSubmitting(true);

    try {
      const country = await getCountry();

      let imageUrl = null;
      if (teamImage) {
        imageUrl = await uploadImage(teamImage);
      }

      const playerWithAuthId = {
        ...player,
        auth_id: user.sub,
        country: country,
      };

      const newTeam = {
        name: teamName,
        players: [JSON.stringify(playerWithAuthId)],
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        division_id: divisionId,
        image_url: imageUrl,
      };

      const { data, error } = await supabase.from("teams_s6").insert([newTeam]).select().single();

      if (error) throw error;
      if (data) {
        setTeamName("");
        setPlayer(initialPlayerState);
        setTeamImage(null);
        setImagePreview(null);
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Error adding team:", err);
      alert("Error creating team. Please try again.");
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
            <h2 className="text-2xl font-bold text-white">Team Successfully Registered!</h2>
            <p className="text-white/80">
              Your team has been registered for Season 6 of the Irish Dota League.
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
        <h2 className="text-2xl font-bold mb-6 text-white">Team Registration</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Team Name</label>
            <input 
              type="text" 
              value={teamName} 
              onChange={(e) => setTeamName(e.target.value)} 
              className={inputClasses} 
              required 
            />
          </div>

          {/* Team Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Team Logo <span className="text-red-400">*</span>
            </label>
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="team-image-upload"
                    required
                  />
                  <label htmlFor="team-image-upload" className="cursor-pointer">
                    <span className="material-symbols-outlined text-5xl text-white/40 mb-4 block">upload</span>
                    <p className="text-white mb-2">Click to upload team logo</p>
                    <p className="text-sm text-white/60">PNG, JPG up to 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Team logo preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Captain's Details</h3>
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
              disabled={isSubmitting || !teamImage}
              className={`w-full py-4 px-6 rounded-lg transition-colors text-lg font-medium ${
                isSubmitting || !teamImage
                  ? "bg-zinc-700 text-white/40 cursor-not-allowed"
                  : "bg-primary text-black hover:bg-primary/80"
              }`}
            >
              {isSubmitting ? "Registering Team..." : !teamImage ? "Please upload a team logo" : "Register Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

