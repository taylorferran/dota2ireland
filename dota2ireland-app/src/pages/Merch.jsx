const Merch = () => {
  // Replace this with your actual Stripe Payment Link
  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/YOUR_PAYMENT_LINK_ID";

  return (
    <main className="flex-1">
      {/* Header Section */}
      <section className="py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-black tracking-tighter md:text-5xl mb-4">
            Official Merch
          </h1>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* T-Shirt Product Card */}
          <div className="flex flex-col rounded-lg bg-white/5 border border-white/10 transition-all hover:border-white/20 hover:bg-white/10 overflow-hidden">
            {/* Product Image - Placeholder */}
            <div className="w-full aspect-square bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center relative">
              {/* Placeholder T-shirt icon */}
              <svg 
                className="w-32 h-32 text-white/30" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M16.24 11.51l1.57-9.51h-4.12c-.24-1.15-1.23-2-2.41-2H8.72c-1.18 0-2.17.85-2.41 2H2.19l1.57 9.51L6 9.62V21h8V9.62l2.24 1.89zM9.5 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <span className="text-white/50 text-sm">Image coming soon</span>
              </div>
            </div>
            
            {/* Product Info */}
            <div className="flex flex-col flex-1 p-5 gap-4">
              <div>
                <h3 className="text-white text-xl font-bold mb-1">
                  Dota 2 Ireland T-Shirt
                </h3>
                <p className="text-white/70 text-sm">
                  Official community t-shirt. Available in various sizes.
                </p>
              </div>
              
              {/* Pricing */}
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-primary text-2xl font-bold">£16</span>
                  <span className="text-white/50 text-sm">+ postage</span>
                </div>
                <p className="text-white/40 text-xs">
                  Shipping costs calculated at checkout
                </p>
              </div>
              
              {/* Buy Button */}
              <a 
                href={STRIPE_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-4 bg-primary text-black text-base font-bold hover:bg-primary/90 transition-colors mt-auto"
              >
                <span>Buy Now</span>
              </a>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="max-w-2xl mx-auto mt-12 p-6 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-white text-lg font-bold mb-3">Shipping Information</h3>
          <ul className="text-white/70 text-sm space-y-2">
            <li>• Orders are shipped within 5-7 business days</li>
            <li>• UK & Ireland shipping available</li>
            <li>• International shipping available at checkout</li>
          </ul>
        </div>
      </section>
    </main>
  );
};

export default Merch;

