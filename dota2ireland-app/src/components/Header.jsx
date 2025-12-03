import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => location.pathname === path;
  
  const closeMobileMenu = () => setMobileMenuOpen(false);
  
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-4 py-4 md:px-10 relative">
      <Link to="/" className="flex items-center gap-4">
        <img 
          src="/img/simple-idl-logo.png" 
          alt="Dota2Ireland Logo" 
          className="h-10 w-auto"
        />
        <h2 className="text-white text-xl font-bold tracking-tighter">Dota 2 Ireland</h2>
      </Link>
      
      <div className="flex flex-1 justify-end items-center gap-4 md:gap-8">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-9">
          <Link 
            className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-white hover:text-primary'}`}
            to="/"
          >
            Home
          </Link>
          <Link 
            className={`text-sm font-medium transition-colors ${isActive('/events') ? 'text-primary' : 'text-white hover:text-primary'}`}
            to="/events"
          >
            Events
          </Link>
          <Link 
            className={`text-sm font-medium transition-colors ${isActive('/league') ? 'text-primary' : 'text-white hover:text-primary'}`}
            to="/league"
          >
            Irish Dota League
          </Link>
          <Link 
            className={`text-sm font-medium transition-colors ${isActive('/imprint') ? 'text-primary' : 'text-white hover:text-primary'}`}
            to="/imprint"
          >
            Imprint
          </Link>
          <Link 
            className={`text-sm font-medium transition-colors ${isActive('/merch') ? 'text-primary' : 'text-white hover:text-primary'}`}
            to="/merch"
          >
            Merch
          </Link>
          <Link 
            className={`text-sm font-medium transition-colors ${isActive('/contact') ? 'text-primary' : 'text-white hover:text-primary'}`}
            to="/contact"
          >
            Contact
          </Link>
        </nav>
        
        <div className="flex gap-1 md:gap-2">
          <a 
            href="https://discord.gg/NraEzrEtxs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 w-9 md:h-10 md:w-10 bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Join our Discord"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"></path>
            </svg>
          </a>
          <a 
            href="https://twitter.com/dota2ireland" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 w-9 md:h-10 md:w-10 bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Follow us on Twitter"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"></path>
            </svg>
          </a>
          <a 
            href="https://twitch.tv/dota2ireland" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 w-9 md:h-10 md:w-10 bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Watch us on Twitch"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"></path>
            </svg>
          </a>
        </div>

        {/* Mobile Menu Button - after social icons on mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-white">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={closeMobileMenu}
          />
          
          {/* Mobile Menu */}
          <div className="md:hidden fixed top-[73px] left-0 right-0 bg-zinc-900 border-b border-white/10 z-50 shadow-xl">
            <nav className="flex flex-col p-4 gap-1">
              <Link 
                className={`text-base font-medium transition-colors px-4 py-3 rounded-lg ${
                  isActive('/') ? 'text-primary bg-primary/10' : 'text-white hover:bg-white/10'
                }`}
                to="/"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link 
                className={`text-base font-medium transition-colors px-4 py-3 rounded-lg ${
                  isActive('/events') ? 'text-primary bg-primary/10' : 'text-white hover:bg-white/10'
                }`}
                to="/events"
                onClick={closeMobileMenu}
              >
                Events
              </Link>
              <Link 
                className={`text-base font-medium transition-colors px-4 py-3 rounded-lg ${
                  isActive('/league') ? 'text-primary bg-primary/10' : 'text-white hover:bg-white/10'
                }`}
                to="/league"
                onClick={closeMobileMenu}
              >
                Irish Dota League
              </Link>
              <Link 
                className={`text-base font-medium transition-colors px-4 py-3 rounded-lg ${
                  isActive('/imprint') ? 'text-primary bg-primary/10' : 'text-white hover:bg-white/10'
                }`}
                to="/imprint"
                onClick={closeMobileMenu}
              >
                Imprint Leaderboard
              </Link>
              <Link 
                className={`text-base font-medium transition-colors px-4 py-3 rounded-lg ${
                  isActive('/merch') ? 'text-primary bg-primary/10' : 'text-white hover:bg-white/10'
                }`}
                to="/merch"
                onClick={closeMobileMenu}
              >
                Merch
              </Link>
              <Link 
                className={`text-base font-medium transition-colors px-4 py-3 rounded-lg ${
                  isActive('/contact') ? 'text-primary bg-primary/10' : 'text-white hover:bg-white/10'
                }`}
                to="/contact"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;

