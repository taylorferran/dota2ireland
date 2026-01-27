import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const backgroundImages = [
    '/img/splash1.webp',
    '/img/splash2.webp',
    '/img/splash3.webp'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="py-2 md:py-3">
        <div className="relative flex min-h-[480px] flex-col gap-6 rounded-xl items-center justify-center p-4 text-center overflow-hidden">
          {/* Background Images with Fade Transition */}
          {backgroundImages.map((image, index) => (
            <div
              key={image}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%), url("${image}")`,
                opacity: currentImageIndex === index ? 1 : 0,
                zIndex: currentImageIndex === index ? 1 : 0
              }}
            />
          ))}
          
          {/* Content */}
          <div className="relative z-10 flex flex-col gap-4">
            <h1 className="text-white text-4xl font-black tracking-tighter md:text-6xl">
              Welcome to Dota 2 Ireland
            </h1>
            <h2 className="text-white/80 text-base font-normal md:text-lg max-w-2xl mx-auto">
              The home of Irish Dota
            </h2>
          </div>
          <a 
            href="https://discord.gg/NraEzrEtxs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative z-10 flex min-w-[84px] max-w-sm cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-black text-base font-bold tracking-wide hover:bg-opacity-90 transition-all"
          >
            <span className="truncate">Join Our Discord</span>
          </a>
        </div>
      </section>

      {/* Featured Content Cards */}
      <section className="py-2 md:py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 - Tournament */}
          <div className="flex h-full flex-col gap-4 rounded-lg bg-white/5 border border-white/10 transition-all hover:border-white/20 hover:bg-white/10 overflow-hidden">
            <div 
              className="w-full bg-center bg-no-repeat aspect-video bg-cover"
              style={{
                backgroundImage: 'url(/img/homepage1.webp)'
              }}
            ></div>
            <div className="flex flex-col flex-1 justify-between p-4 pt-0 gap-4">
              <div>
                <p className="text-white text-lg font-bold">Events</p>
                <p className="text-white/70 text-sm font-normal">Check out the details for upcoming and past events.</p>
              </div>
              <Link to="/events">
                <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors">
                  <span className="truncate">Learn More</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Card 2 - League */}
          <div className="flex h-full flex-col gap-4 rounded-lg bg-white/5 border border-white/10 transition-all hover:border-white/20 hover:bg-white/10 overflow-hidden">
            <div 
              className="w-full bg-center bg-no-repeat aspect-video bg-cover"
              style={{
                backgroundImage: 'url(/img/old_logo.jpeg)'
              }}
            ></div>
            <div className="flex flex-col flex-1 justify-between p-4 pt-0 gap-4">
              <div>
                <p className="text-white text-lg font-bold">Irish Dota League</p>
                <p className="text-white/70 text-sm font-normal">See the standings and schedule for the current season.</p>
              </div>
              <Link to="/league">
                <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors">
                  <span className="truncate">View League</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Card 3 - Merch */}
          <div className="flex h-full flex-col gap-4 rounded-lg bg-white/5 border border-white/10 transition-all hover:border-white/20 hover:bg-white/10 overflow-hidden">
            <div className="w-full aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <svg className="w-20 h-20 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.24 11.51l1.57-9.51h-4.12c-.24-1.15-1.23-2-2.41-2H8.72c-1.18 0-2.17.85-2.41 2H2.19l1.57 9.51L6 9.62V21h8V9.62l2.24 1.89zM9.5 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
            </div>
            <div className="flex flex-col flex-1 justify-between p-4 pt-0 gap-4">
              <div>
                <p className="text-white text-lg font-bold">Official Merch</p>
                <p className="text-white/70 text-sm font-normal">Get your official Dota 2 Ireland t-shirt now.</p>
              </div>
              <Link to="/merch">
                <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-colors">
                  <span className="truncate">Shop Now</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;

