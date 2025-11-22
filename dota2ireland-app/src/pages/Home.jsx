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
      <section className="py-8 md:py-12">
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
      <section className="py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 - Tournament */}
          <div className="flex h-full flex-col gap-4 rounded-xl bg-white/5 border border-white/10 transition-all hover:border-white/20 hover:bg-white/10 p-1">
            <div 
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuClHSAQXq2SypYu7P9V0UglAzs49mDZFSb7F0cbB11jcssdubZ74YeIRNcir0etiI1aN0E5bw7mguVkOSfu-Hi6XUZY4jHFLHswgi_R1Z3Lgc0qO4eFX9ZCYMcibaDpxP7B-EautZwmzghuFeS4TSUTS3b0PWRbRCeJsjM9YAfi7wpoD9AIDuADQ0FIfhCBVuea-_-DaasClIlk39crbDXLVNbbEkkRZ2lWPg6_32JoymgzemZGAIQWf8kYq4Kf85zJJbvwe80POE0H")'
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
          <div className="flex h-full flex-col gap-4 rounded-xl bg-white/5 border border-white/10 transition-all hover:border-white/20 hover:bg-white/10 p-1">
            <div 
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCU828Swcjhnq9bvGBz16zHE-B7Sr_zSzE2_AmwEwsaw0dfT0itN5o-r96RYN9XmbeoKMJCPpnF5gpMphJjTdbF637Atgg1gjIU7HsLrip3ATVk0dWNzIsZBbcz6JMraR2WaTPtaIMV223hktEgA3SDVib5RDnq5WUsDBowgFC9lZCAr0GSlDwNpgjLy-0tMT4zPKPH7fMB5Hd-o5k033QhrNNoZXedXUESsjF3hHcIJBgYHHdtiP22KYDdagKNn7B1njyFFRFBZqDN")'
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
          <div className="flex h-full flex-col gap-4 rounded-xl bg-white/5 border border-white/10 transition-all hover:border-white/20 hover:bg-white/10 p-1">
            <div 
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDxkoghrLvQJE1Au-7b-6dMt_pmUIH6qYXfF85eYBBdLVJNHmBA36RJnA_0EZJTHn30CERWmoi1XjayOYycQ7SgSxR5fhoH3EoZT8ciZmfMZkKZkzEAmiUYC9MHrZywZAYpT70vrc41fHnhNHtJjPLSQjqvilpexsbi6-6OXlwsVDfxaAm3B7YaQu0docLnaipByuLeSEQlzCmZ1j0uf1sLpctL6zPCnpyGw1kUfBITXk9V0lj5XqgQSL2BuJA_vJRf5SXpijxk5l4h")'
              }}
            ></div>
            <div className="flex flex-col flex-1 justify-between p-4 pt-0 gap-4">
              <div>
                <p className="text-white text-lg font-bold">Latest Merch Drop</p>
                <p className="text-white/70 text-sm font-normal">Get the newest community-designed gear now.</p>
              </div>
              <Link to="/merch">
                <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-accent-orange text-white text-sm font-bold hover:bg-opacity-90 transition-colors">
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

