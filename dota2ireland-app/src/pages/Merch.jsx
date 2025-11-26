const Merch = () => {
  return (
    <main className="flex-1">
      <section className="py-16 md:py-24 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          {/* Large Question Mark */}
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary/20 to-zinc-900 border-2 border-primary/50 flex items-center justify-center">
              <span className="text-primary text-8xl md:text-9xl font-black">?</span>
            </div>
          </div>

          {/* Teaser Text */}
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-[-0.033em] mb-6">
            soon
          </h1>
          
          
        </div>
      </section>
    </main>
  );
};

export default Merch;

