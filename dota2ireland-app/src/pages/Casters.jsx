import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Casters = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams_s6')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const parsePlayerData = (playersArray) => {
    if (!playersArray || playersArray.length === 0) return [];
    
    return playersArray.map(player => {
      try {
        if (typeof player === 'object' && player !== null) {
          return player;
        }
        if (typeof player === 'string') {
          return JSON.parse(player);
        }
        return null;
      } catch (e) {
        console.error('Failed to parse player data:', e);
        return null;
      }
    }).filter(Boolean);
  };

  const handleDownloadImage = async (imageUrl, teamName) => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${teamName.replace(/\s+/g, '_')}_logo.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/60 py-16">Loading teams...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Casters Resources - Season 6
          </h1>
          <p className="text-white/70 text-lg">
            Team information, rosters, and downloadable logos for casting
          </p>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center text-white/60 py-16">No teams registered yet</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {teams.map((team) => {
              const players = parsePlayerData(team.players || []);
              
              return (
                <div key={team.id} className="bg-zinc-800 rounded-lg border border-white/10 overflow-hidden">
                  {/* Team Header */}
                  <div className="bg-zinc-900 p-6 border-b border-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-white font-bold text-2xl mb-2">{team.name}</h2>
                      </div>
                      
                      {/* Team Logo with Download */}
                      <div className="flex flex-col items-center gap-2">
                        {team.image_url ? (
                          <>
                            <img 
                              src={team.image_url} 
                              alt={`${team.name} logo`}
                              className="w-24 h-24 object-cover rounded-lg border-2 border-primary/30"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <button
                              onClick={() => handleDownloadImage(team.image_url, team.name)}
                              className="px-3 py-1 bg-primary text-black text-xs rounded hover:bg-primary/80 transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">download</span>
                              Download
                            </button>
                          </>
                        ) : (
                          <div className="w-24 h-24 bg-zinc-800 rounded-lg border-2 border-primary/30 flex items-center justify-center">
                            <span className="text-3xl text-white font-bold">
                              {team.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Players Roster */}
                  <div className="p-6">
                    <h3 className="text-white font-bold text-lg mb-4">Roster</h3>
                    {players.length === 0 ? (
                      <div className="text-white/60 text-sm text-center py-6">No players registered</div>
                    ) : (
                      <div className="space-y-3">
                        {players.map((player, index) => (
                          <div key={index} className="bg-zinc-900 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="text-white font-bold text-lg">
                                    {player.name}
                                  </div>
                                  {index === 0 && (
                                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded font-medium">
                                      Captain
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm">
                                  <div className="px-2 py-1 bg-zinc-800 text-white/80 rounded">
                                    {player.position || 'Position TBD'}
                                  </div>
                                  <div className="px-2 py-1 bg-primary/20 text-primary rounded">
                                    {player.rank || 'Unranked'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                {player.steamProfile && player.steamProfile !== 'https://steamcommunity.com/my/' && (
                                  <a
                                    href={player.steamProfile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded transition-colors flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-sm">link</span>
                                    Steam
                                  </a>
                                )}
                                {player.dotabuffProfile && player.dotabuffProfile !== 'https://www.dotabuff.com/players/' && (
                                  <a
                                    href={player.dotabuffProfile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-primary hover:bg-primary/80 text-black text-sm rounded transition-colors flex items-center gap-1 font-medium"
                                  >
                                    <span className="material-symbols-outlined text-sm">sports_esports</span>
                                    Dotabuff
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Casters;

