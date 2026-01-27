import { Link } from 'react-router-dom';

const Events = () => {
  const upcomingEvents = [
    {
      id: 1,
      title: "Irish Dota League Season 6",
      date: "1st January 2026",
      location: "Online",
      description: "The 6th installment of the Irish Dota League.",
      image: "/img/idl.png",
      linkUrl: "/league",
      buttonText: "View League",
      buttonLink: "/league"
    },
  ];

  const pastEvents = [
    {
      id: 1,
      title: "Landalk 2",
      date: "October 11th 2025",
      image: "/img/landalk2.png",
      linkUrl: "https://www.dotabuff.com/esports/leagues/18677-landalk-2",
      linkText: "Dotabuff"
    },
    {
      id: 2,
      title: "IDL Season 5",
      date: "Summer 2025",
      image: "/img/idl.png",
      linkUrl: "https://www.dotabuff.com/esports/leagues/18171-irish-dota-league-season-5",
      linkText: "Dotabuff"
    },
    {
      id: 3,
      title: "D2I Rebooted",
      date: "5th April 2025",
      image: "/img/d2irebooted.png",
      linkUrl: "https://www.dotabuff.com/esports/leagues/18004-d2i-rebooted",
      linkText: "Dotabuff"
    },
    {
      id: 4,
      title: "IDL Season 4",
      date: "February 2025",
      image: "/img/idl.png",
      linkUrl: "https://www.dotabuff.com/esports/leagues/17600-irish-dota-league-season-4",
      linkText: "Dotabuff"
    },
    {
      id: 5,
      title: "Landalk",
      date: "3rd November 2024",
      image: "/img/landalk.png",
      linkUrl: "https://www.dotabuff.com/esports/leagues/17254-landalk",
      linkText: "Dotabuff"
    }
  ];

  return (
    <main className="flex flex-col gap-4 mt-2">
      {/* Page Title */}
      <div className="flex flex-col items-center justify-center gap-2 text-center px-4 py-4">
        <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.033em]">
          COMMUNITY EVENTS
        </h1>
        <p className="text-white/60 text-lg max-w-2xl">
          From local LANs to online tournaments, find all the upcoming Dota 2 events happening across Ireland.
        </p>
      </div>

      {/* Upcoming Events Section */}
      <section>
        <h2 className="text-white text-2xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5 border-b-2 border-primary w-fit mb-6">
          Upcoming Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
          {upcomingEvents.map((event) => (
            <div 
              key={event.id}
              className="flex flex-col gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-lg transition-all hover:border-primary"
            >
              <div 
                className="w-full bg-center bg-no-repeat aspect-video bg-contain rounded-md bg-zinc-800"
                style={{ backgroundImage: `url("${event.image}")` }}
              ></div>
              <div className="flex flex-col gap-3">
                <h3 className="text-white text-xl font-bold leading-normal">{event.title}</h3>
                <p className="font-mono text-sm text-white/70">{event.date}</p>
                <p className="font-mono text-sm text-white/70">{event.location}</p>
                <p className="text-white/70 text-base font-normal leading-relaxed">{event.description}</p>
              </div>
              <Link 
                to={event.buttonLink}
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-primary text-black text-base font-bold leading-normal tracking-wide hover:bg-green-400 transition-colors"
              >
                <span className="truncate">{event.buttonText}</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Past Events Section */}
      <section className="mt-4">
        <h2 className="text-white text-2xl font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5 border-b-2 border-accent-orange w-fit mb-6">
          Past Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
          {pastEvents.map((event) => (
            <div 
              key={event.id}
              className="flex flex-col gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-lg opacity-70"
            >
              <div 
                className="w-full bg-center bg-no-repeat aspect-video bg-contain rounded-md filter grayscale bg-zinc-800"
                style={{ backgroundImage: `url("${event.image}")` }}
              ></div>
              <div className="flex flex-col gap-3">
                <h3 className="text-white text-xl font-bold leading-normal">{event.title}</h3>
                <p className="font-mono text-sm text-white/70">{event.date}</p>
                <a 
                  className="text-accent-orange text-base font-bold leading-normal hover:underline" 
                  href={event.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {event.linkText}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Events;

