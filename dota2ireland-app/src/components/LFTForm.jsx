import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth0 } from "@auth0/auth0-react";
import { useMyTeam } from "../hooks/useMyTeam";
import { Link } from "react-router-dom";

const POSITIONS = [
  "Carry",
  "Mid",
  "Offlane",
  "Support",
  "Hard Support",
];

const initialFormState = {
  name: "",
  steamProfile: "",
  dotabuffProfile: "",
  rank: "",
  notes: "",
  positions: [],
};

export const LFTForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [existingLFT, setExistingLFT] = useState(null);
  const [checkingLFT, setCheckingLFT] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const { user } = useAuth0();
  const { team: existingTeam, loading: checkingTeam } = useMyTeam();

  // Check if user already has an LFT entry
  useEffect(() => {
    const checkExistingLFT = async () => {
      if (!user?.sub) {
        setCheckingLFT(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('lft_players')
          .select('*')
          .eq('auth_id', user.sub);

        if (error) {
          console.error('Error checking LFT:', error);
        } else if (data && data.length > 0) {
          setExistingLFT(data[0]);
        } else {
          setExistingLFT(null);
        }
      } catch (err) {
        console.error('Error checking LFT:', err);
      } finally {
        setCheckingLFT(false);
      }
    };

    checkExistingLFT();
    setIsSuccess(false); // Reset success state when component loads
  }, [user]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePositionToggle = (position) => {
    setFormData((current) => ({
      ...current,
      positions: current.positions.includes(position)
        ? current.positions.filter((p) => p !== position)
        : [...current.positions, position],
    }));
  };

  const ranks = [
    "Herald",
    "Guardian",
    "Crusader",
    "Archon",
    "Legend",
    "Ancient",
    "Divine",
    "Immortal",
  ];

  const handleRemoveLFT = async () => {
    if (!user?.sub || !existingLFT) return;

    const confirmRemove = window.confirm('Are you sure you want to remove your LFT listing?');
    if (!confirmRemove) return;

    setIsRemoving(true);
    setError(null);

    try {
      const { data, error: deleteError } = await supabase
        .from('lft_players')
        .delete()
        .eq('auth_id', user.sub)
        .select();

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Successfully deleted
      setExistingLFT(null);
      setIsSuccess(true);
    } catch (err) {
      console.error('Error removing LFT:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove LFT listing');
    } finally {
      setIsRemoving(false);
    }
  };

  if (checkingTeam || checkingLFT) {
    return <div className="text-center text-white/60 py-8">Loading...</div>;
  }

  // Show existing LFT entry if user already posted
  if (existingLFT && !isSuccess) {
    const roles = existingLFT.roles || [];
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4 text-white">
            You're Already on the LFT List
          </h2>
          <p className="text-white/80 mb-6">
            Your LFT listing is currently active. Team captains can see your profile.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Current LFT Info */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6 border border-primary/30">
            <h3 className="text-white font-bold text-lg mb-4">Your LFT Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Name:</span>
                <span className="text-white font-medium">{existingLFT.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Rank:</span>
                <span className="px-2 py-1 bg-primary/20 text-primary rounded text-sm">{existingLFT.rank}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Positions:</span>
                <div className="flex gap-2">
                  {roles.map((role, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/10 text-white rounded text-sm">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              {existingLFT.notes && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-white/60 text-sm">Notes:</span>
                  <p className="text-white mt-1">{existingLFT.notes}</p>
                </div>
              )}
              <div className="pt-2 border-t border-white/10">
                <span className="text-white/60 text-xs">Entry ID: {existingLFT.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRemoveLFT}
            disabled={isRemoving}
            className={`w-full py-3 px-6 rounded-lg transition-colors font-medium ${
              isRemoving
                ? 'bg-zinc-700 text-white/40 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isRemoving ? 'Removing...' : 'Remove My LFT Listing'}
          </button>
        </div>
      </div>
    );
  }

  if (existingTeam) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Already on a Team
          </h2>
          <p className="text-white/80 mb-6">
            You cannot register as LFT while being a member of team "{existingTeam.name}".
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !user?.sub || formData.positions.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // First check if user already has an LFT entry
      const { data: existingCheck, error: checkError } = await supabase
        .from('lft_players')
        .select('*')
        .eq('auth_id', user.sub);

      if (checkError) throw checkError;

      if (existingCheck && existingCheck.length > 0) {
        setError('You already have an LFT listing. Please remove it first before creating a new one.');
        setExistingLFT(existingCheck[0]);
        setIsSubmitting(false);
        return;
      }

      // Map positions to roles for database compatibility
      const { positions, ...restFormData } = formData;
      const { data, error: submitError } = await supabase.from("lft_players").insert([
        {
          ...restFormData,
          roles: positions, // Map positions to roles column
          auth_id: user.sub,
        },
      ]).select().single();

      if (submitError) throw submitError;

      setFormData(initialFormState);
      setExistingLFT(data);
      setIsSuccess(true);
    } catch (err) {
      console.error("Error registering as LFT:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    const isRemoval = existingLFT === null;
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <span className="material-symbols-outlined text-6xl text-primary">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isRemoval ? 'LFT Listing Removed!' : 'Successfully Registered as LFT!'}
            </h2>
            <p className="text-white/80">
              {isRemoval 
                ? 'Your LFT listing has been removed. You can register again at any time.'
                : 'Your LFT listing has been posted. Teams can now see your profile and contact you.'
              }
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="mt-4 px-6 py-2 bg-primary text-black rounded-lg hover:bg-primary/80 transition-colors font-medium"
            >
              Back to League
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputClasses = "w-full px-4 py-2 bg-zinc-900 border-2 border-white/10 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-white placeholder-white/40";
  const selectClasses = "w-full px-4 py-2 bg-zinc-900 border-2 border-white/10 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-white";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-800 rounded-lg shadow-lg p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Register as Looking for Team
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={inputClasses}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Rank
              </label>
              <select
                value={formData.rank}
                onChange={(e) => handleChange("rank", e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Steam Profile URL
              </label>
              <input
                type="url"
                value={formData.steamProfile}
                onChange={(e) => handleChange("steamProfile", e.target.value)}
                className={inputClasses}
                placeholder="https://steamcommunity.com/id/..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Dotabuff Profile URL
              </label>
              <input
                type="url"
                value={formData.dotabuffProfile}
                onChange={(e) => handleChange("dotabuffProfile", e.target.value)}
                className={inputClasses}
                placeholder="https://www.dotabuff.com/players/..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Preferred Positions
            </label>
            <div className="space-y-2">
              {POSITIONS.map((position) => (
                <label key={position} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.positions.includes(position)}
                    onChange={() => handlePositionToggle(position)}
                    className="h-4 w-4 text-primary focus:ring-primary border-white/20 rounded bg-zinc-900"
                  />
                  <span className="text-sm text-white">{position}</span>
                </label>
              ))}
            </div>
            {formData.positions.length === 0 && (
              <p className="mt-1 text-sm text-red-400">
                Please select at least one position
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className={inputClasses}
              rows={4}
              placeholder="Add any additional information (availability, experience, etc.)"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || formData.positions.length === 0}
              className={`w-full py-4 px-6 rounded-lg transition-colors text-lg font-medium ${
                isSubmitting || formData.positions.length === 0
                  ? "bg-zinc-700 text-white/40 cursor-not-allowed"
                  : "bg-primary text-black hover:bg-primary/80"
              }`}
            >
              {isSubmitting ? "Registering..." : "Register as LFT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

