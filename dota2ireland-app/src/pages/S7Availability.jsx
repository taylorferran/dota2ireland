import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, getSupabaseClient } from '../lib/supabase';
import { useMyTeam } from '../hooks/useMyTeam';
import { useToast } from '../components/ToastProvider';

// ─── Config ──────────────────────────────────────────────────────────────────
const LEAGUE_START = '2026-06-01';

// Weeks per division: D1 = 5 rounds (6 teams), D2A/D2B/D3 = 6 rounds
const WEEKS_BY_DIVISION = { 1: 5, 2: 7, 22: 7, 3: 5 };

const WEEKDAY_SLOTS = ['18:00', '19:00', '20:00', '21:00'];
const WEEKEND_SLOTS = ['12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function slotsForDate(dateStr) {
  const day = new Date(dateStr + 'T12:00:00').getDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6 ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
}

function slotKey(date, time) {
  return `${date} ${time}`;
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IE', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function fmtDateShort(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IE', {
    day: 'numeric', month: 'short',
  });
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildWeeks(weekCount) {
  return Array.from({ length: weekCount }, (_, i) => ({
    label: `Week ${i + 1}`,
    start: addDays(LEAGUE_START, i * 7),
  }));
}

function calcTotalSlots(weeks) {
  return weeks.reduce((sum, w) =>
    sum + getWeekDates(w.start).reduce((ds, d) => ds + slotsForDate(d).length, 0), 0);
}

// ─── Component ───────────────────────────────────────────────────────────────
const S7Availability = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const { supabaseToken } = useAuth();
  const { team: myTeam, loading: teamLoading } = useMyTeam();

  const [blocked, setBlocked] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const weekCount = WEEKS_BY_DIVISION[myTeam?.division_id] ?? 5;
  const weeks = useMemo(() => buildWeeks(weekCount), [weekCount]);
  const totalSlots = useMemo(() => calcTotalSlots(weeks), [weeks]);

  // Load existing submission
  useEffect(() => {
    if (!user?.sub) { setLoading(false); return; }
    supabase
      .from('s7_availability')
      .select('blocked_slots, submitted_at')
      .eq('auth_id', user.sub)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.blocked_slots) setBlocked(new Set(data.blocked_slots));
        if (data?.submitted_at) setLastSaved(new Date(data.submitted_at));
        setLoading(false);
      });
  }, [user?.sub]);

  // ── Slot toggles ──────────────────────────────────────────────────────────
  const toggleSlot = (key) => setBlocked(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const blockDay = (date) => setBlocked(prev => {
    const next = new Set(prev);
    slotsForDate(date).forEach(t => next.add(slotKey(date, t)));
    return next;
  });

  const clearDay = (date) => setBlocked(prev => {
    const next = new Set(prev);
    slotsForDate(date).forEach(t => next.delete(slotKey(date, t)));
    return next;
  });

  const blockWeek = (weekStart) => setBlocked(prev => {
    const next = new Set(prev);
    getWeekDates(weekStart).forEach(d => slotsForDate(d).forEach(t => next.add(slotKey(d, t))));
    return next;
  });

  const clearWeek = (weekStart) => setBlocked(prev => {
    const next = new Set(prev);
    getWeekDates(weekStart).forEach(d => slotsForDate(d).forEach(t => next.delete(slotKey(d, t))));
    return next;
  });

  const copyWeek1ToAll = () => {
    const week1Dates = getWeekDates(weeks[0].start);
    setBlocked(prev => {
      const next = new Set(prev);
      weeks.slice(1).forEach(week => {
        getWeekDates(week.start).forEach((date, dayIdx) => {
          const week1Date = week1Dates[dayIdx];
          slotsForDate(week1Date).forEach(time => {
            const w1key = slotKey(week1Date, time);
            const key   = slotKey(date, time);
            prev.has(w1key) ? next.add(key) : next.delete(key);
          });
        });
      });
      return next;
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!supabaseToken || !user?.sub) return;
    setSaving(true);
    try {
      const client = getSupabaseClient(supabaseToken);
      const myPlayer = myTeam?.players?.find(p => p.auth_id === user.sub);
      const now = new Date().toISOString();
      const { error } = await client
        .from('s7_availability')
        .upsert(
          {
            auth_id:       user.sub,
            player_name:   myPlayer?.name || user.name || user.email,
            team_id:       myTeam?.id || null,
            blocked_slots: [...blocked],
            submitted_at:  now,
          },
          { onConflict: 'auth_id' }
        );
      if (error) throw error;
      setLastSaved(new Date(now));
      toast.success('Availability saved!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const blockedCount = blocked.size;
  const pctBlocked   = totalSlots > 0 ? blockedCount / totalSlots : 0;
  const showWarning  = pctBlocked > 0.6;

  const myPlayer = useMemo(
    () => myTeam?.players?.find(p => p.auth_id === user?.sub),
    [myTeam, user?.sub]
  );

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <main className="flex-1 py-16">
        <div className="max-w-md mx-auto text-center space-y-6">
          <span className="material-symbols-outlined text-5xl text-white/30">calendar_month</span>
          <h1 className="text-3xl font-black text-white">Season 7 Availability</h1>
          <p className="text-white/60">You need to be signed in to submit your availability.</p>
          <button
            onClick={() => loginWithRedirect({ appState: { returnTo: '/league/s7/availability' } })}
            className="px-8 py-3 bg-primary text-black rounded-full font-bold hover:bg-primary/80 transition-colors"
          >
            Sign In
          </button>
        </div>
      </main>
    );
  }

  if (teamLoading || loading) {
    return (
      <main className="flex-1 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    );
  }

  if (!myTeam) {
    return (
      <main className="flex-1 py-16">
        <div className="max-w-md mx-auto text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-white/30">group_off</span>
          <h1 className="text-2xl font-black text-white">Not on a roster</h1>
          <p className="text-white/60">Your account isn&apos;t linked to a Season 7 team. Contact your captain.</p>
          <button onClick={() => navigate('/league/s7/d1/standings')} className="text-primary hover:underline text-sm">
            Back to League
          </button>
        </div>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 py-6">
      {/* Back */}
      <button
        onClick={() => navigate('/league/s7/d1/standings')}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to League
      </button>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-white">Season 7 Availability</h1>
          <p className="text-white/50 mt-1 text-sm">All times are Dublin time (Europe/Dublin)</p>
        </div>

        {/* Player card */}
        <div className="bg-zinc-900 rounded-lg border border-white/10 p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">person</span>
          <div className="flex-1">
            <div className="text-white font-medium">{myPlayer?.name || user?.name}</div>
            <div className="text-xs text-white/50">{myTeam.name} &bull; {weekCount} weeks</div>
          </div>
          <div className="text-right">
            <div className={`font-bold text-lg ${showWarning ? 'text-red-400' : 'text-primary'}`}>
              {blockedCount}
            </div>
            <div className="text-xs text-white/50">of {totalSlots} blocked</div>
          </div>
        </div>

        {/* Warning */}
        {showWarning && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5">warning</span>
            <span>You&apos;ve blocked {Math.round(pctBlocked * 100)}% of your {weekCount}-week window — this makes scheduling hard for your team. Only block times you genuinely can&apos;t play.</span>
          </div>
        )}

        {/* Instruction */}
        <div className="bg-zinc-900 rounded-lg border border-primary/30 px-4 py-3 text-sm text-white/80">
          <span className="text-primary font-semibold">Tick the times you cannot play.</span>{' '}
          Blocked slots are highlighted in red. Leave a slot un-ticked if you&apos;re free.
        </div>

        {/* Copy week 1 action */}
        <div className="flex justify-end">
          <button
            onClick={copyWeek1ToAll}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-xs">content_copy</span>
            Copy Week 1 pattern to all weeks
          </button>
        </div>

        {/* Week grids */}
        {weeks.map((week) => {
          const weekDates = getWeekDates(week.start);
          const weekEnd   = weekDates[6];
          const weekBlockedCount = weekDates.reduce(
            (n, d) => n + slotsForDate(d).filter(t => blocked.has(slotKey(d, t))).length, 0
          );

          return (
            <div key={week.label} className="bg-zinc-900 rounded-lg border border-white/10 overflow-hidden">
              {/* Week header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
                <div>
                  <span className="text-white font-bold">{week.label}</span>
                  <span className="text-white/50 text-xs ml-2">
                    w/c Mon {fmtDateShort(week.start)} – {fmtDateShort(weekEnd)}
                  </span>
                  {weekBlockedCount > 0 && (
                    <span className="ml-2 text-xs text-red-400">{weekBlockedCount} blocked</span>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => blockWeek(week.start)}
                    className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    Block all
                  </button>
                  <button
                    onClick={() => clearWeek(week.start)}
                    className="text-xs px-2 py-1 rounded bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Days */}
              <div className="divide-y divide-white/5">
                {weekDates.map((date) => {
                  const slots     = slotsForDate(date);
                  const isWeekend = new Date(date + 'T12:00:00').getDay() % 6 === 0;
                  const dayBlocked = slots.filter(t => blocked.has(slotKey(date, t))).length;

                  return (
                    <div key={date} className={`px-3 py-2.5 ${isWeekend ? 'bg-white/[0.02]' : ''}`}>
                      <div className="flex items-start gap-2">
                        {/* Day label */}
                        <div className="w-[72px] shrink-0 pt-0.5">
                          <div className="text-xs font-medium text-white/70">{fmtDate(date).split(',')[0]}</div>
                          <div className="text-xs text-white/40">{fmtDateShort(date)}</div>
                        </div>

                        {/* Slot chips */}
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {slots.map((time) => {
                            const key       = slotKey(date, time);
                            const isBlocked = blocked.has(key);
                            return (
                              <button
                                key={time}
                                onClick={() => toggleSlot(key)}
                                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors focus:outline-none ${
                                  isBlocked
                                    ? 'bg-red-500/25 text-red-300 border border-red-500/50 line-through'
                                    : 'bg-zinc-800 text-white/70 border border-white/10 hover:border-white/30 hover:text-white'
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>

                        {/* Day controls */}
                        <div className="flex gap-1 shrink-0 pt-0.5">
                          {dayBlocked < slots.length && (
                            <button
                              onClick={() => blockDay(date)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                              title="Block all slots this day"
                            >
                              All
                            </button>
                          )}
                          {dayBlocked > 0 && (
                            <button
                              onClick={() => clearDay(date)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 hover:bg-white/20 transition-colors"
                              title="Clear all slots this day"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Save bar */}
        <div className="flex items-center justify-between pt-2 pb-8">
          {lastSaved ? (
            <span className="text-xs text-white/40">
              Last saved {lastSaved.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : <span />}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-primary text-black rounded-full font-bold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />Saving…</>
            ) : (
              <><span className="material-symbols-outlined text-base">save</span>Save Availability</>
            )}
          </button>
        </div>

      </div>
    </main>
  );
};

export default S7Availability;
