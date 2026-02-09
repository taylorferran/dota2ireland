import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Rebooted2 = () => {
  const [tickets, setTickets] = useState({});

  useEffect(() => {
    supabase
      .from('tickets')
      .select('id, total, sold')
      .then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach((t) => { map[t.id] = t; });
          setTickets(map);
        }
      });
  }, []);

  const getRemaining = (id) => {
    const t = tickets[id];
    if (!t) return null;
    return t.total - t.sold;
  };

  const isSoldOut = (id) => {
    const remaining = getRemaining(id);
    return remaining !== null && remaining <= 0;
  };

  return (
    <main className="flex flex-col gap-6 mt-2">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center gap-4 text-center px-4 py-8">
        <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em]">
          REBOOTED 2
        </h1>
        <p className="text-primary text-xl font-bold">Dota 2 Ireland's first LAN of 2026</p>
        <p className="text-white/60 text-lg max-w-2xl">
          The sequel to D2I Rebooted. Two days of Dota 2 on LAN in Belfast.
        </p>
      </div>

      {/* Tickets */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        {/* QUB Compsci Building */}
        <div className="flex flex-col gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-lg transition-all hover:border-primary">
          <img
            src="/img/rebooted2/qub-compsci.PNG"
            alt="QUB Computer Science Building"
            className="w-full aspect-video object-cover rounded-md"
          />
          <h3 className="text-white text-xl font-bold">QUB Compsci Building — Player Ticket</h3>
          <p className="text-primary text-2xl font-bold">£60.00</p>
          {getRemaining('qub_player') !== null && (
            <p className={`text-sm font-mono ${isSoldOut('qub_player') ? 'text-red-400' : 'text-white/50'}`}>
              {isSoldOut('qub_player') ? 'SOLD OUT' : `${getRemaining('qub_player')} remaining`}
            </p>
          )}
          {isSoldOut('qub_player') ? (
            <div className="flex w-full items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-zinc-700 text-zinc-400 text-base font-bold leading-normal tracking-wide cursor-not-allowed">
              Sold Out
            </div>
          ) : (
            <a
              href="https://buy.stripe.com/eVq00jcch4pxfzC1KXefC02"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-primary text-black text-base font-bold leading-normal tracking-wide hover:bg-green-400 transition-colors"
            >
              Buy Player Ticket
            </a>
          )}
        </div>

        {/* Reboot Cafe */}
        <div className="flex flex-col gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-lg transition-all hover:border-primary">
          <img
            src="/img/rebooted2/reboot.jpg"
            alt="Reboot Cafe"
            className="w-full aspect-video object-cover rounded-md"
          />
          <h3 className="text-white text-xl font-bold">Reboot Cafe — Team Ticket</h3>
          <p className="text-primary text-2xl font-bold">£325.00</p>
          {getRemaining('reboot_team') !== null && (
            <p className={`text-sm font-mono ${isSoldOut('reboot_team') ? 'text-red-400' : 'text-white/50'}`}>
              {isSoldOut('reboot_team') ? 'SOLD OUT' : `${getRemaining('reboot_team')} remaining`}
            </p>
          )}
          {isSoldOut('reboot_team') ? (
            <div className="flex w-full items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-zinc-700 text-zinc-400 text-base font-bold leading-normal tracking-wide cursor-not-allowed">
              Sold Out
            </div>
          ) : (
            <a
              href="https://buy.stripe.com/4gMcN5b8d4pxgDGblxefC03"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-primary text-black text-base font-bold leading-normal tracking-wide hover:bg-green-400 transition-colors"
            >
              Buy Team Ticket
            </a>
          )}
        </div>
      </section>

      {/* Event Details */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        {/* When */}
        <div className="flex flex-col gap-3 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="text-primary text-lg font-bold">18th / 19th April </h3>
          <div className="flex flex-col gap-2 text-white/70">
            <p className="font-bold text-white">Saturday</p>
            <p>Games start in the morning and run through to late Saturday night.</p>
            <p className="font-bold text-white mt-2">Sunday</p>
            <p>Games resume in the morning and run until the evening.</p>
          </div>
        </div>

        {/* Where */}
        <div className="flex flex-col gap-3 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="text-primary text-lg font-bold">Where</h3>
          <div className="flex flex-col gap-2 text-white/70">
            <p className="font-bold text-white">Reboot Cafe & Queens Computer Science Building</p>
            <p>Belfast, Northern Ireland</p>
            <p>Reboot cafe has a better setup so tickets are (slightly) more expensive.</p>
          </div>
        </div>

        {/* What to Bring */}
        <div className="flex flex-col gap-3 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="text-primary text-lg font-bold">What to Bring</h3>
          <div className="flex flex-col gap-2 text-white/70">
            <p><span className="text-white font-bold">PCs will be provided</span> — you only need to bring your own peripherals (mouse, keyboard, headset).</p>
          </div>
        </div>

        {/* Who Can Play */}
        <div className="flex flex-col gap-3 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="text-primary text-lg font-bold">Who Can Play</h3>
          <div className="flex flex-col gap-2 text-white/70">
            <p><span className="text-white font-bold">Any MMR welcome.</span> Whether you're Herald or Immortal. All teams get to play on day 2, but this is when eliminations will happen.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Rebooted2;
