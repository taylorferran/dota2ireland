const Merch = () => {
  return (
    <main className="flex flex-col items-center gap-8 py-10 px-4">
      <div className="text-center">
        <h1 className="text-white text-4xl font-black tracking-tighter md:text-5xl mb-2">
          Official Merch
        </h1>
      </div>

      <div className="flex flex-col items-center gap-6 bg-white/5 border border-white/10 rounded-lg p-6 max-w-sm w-full">
        <img
          src="/img/merch.png"
          alt="Dota 2 Ireland T-Shirt"
          className="w-full rounded-md"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-white text-2xl font-bold">Dota 2 Ireland T-Shirt</h2>
          <span className="text-primary text-3xl font-black">£20</span>
          <p className="text-white/60 text-sm">Limited sizes available</p>
          <p className="text-white/70 text-sm mt-2">
            To purchase, contact <span className="text-primary font-bold">taylorferran</span> on Discord.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Merch;
