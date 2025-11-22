import { useState } from 'react';
import { Link } from 'react-router-dom';

const Merch = () => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  const sizes = ['S', 'M', 'L', 'XL'];

  const productImages = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDdclMhfXMaUXealVKFwogdiQ5cuqIP74mVZr0MAgjNWw8SCQLC76MxHElk6kDjsIwjIn7vC-cBpj4CCzclx4DGLRAW5Qu1eGVu8Odp7l2ldXdieBTCknd1FLom5eljid2xDRjrzx_L2WgoR8sB4kkH8StCD7dXGTgZKHHcps48vZYn6yDQYfU-KOBLnbUOuigjWDU2vyzPCXLj7-30Iy-Xf030b6nBARkfkSv57HjM4EF6tUrNLRKok6u_CUuqTf206LtUe8SKz5vj",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBdr6cIpscI3ChgksEBvDfqmMVxwpZPnpi6q9usk9VDWwCXmJI4tz3sxXRG6rmEKCxPaFZrHrqydoYnceZodlSgRaFF12knfDXzwEm_UG-IMNH-xuomgXiU93_RgCNbgxWUxs_TMiJC5AzHQFkAH6l4s00Au0HW6DBg3CYIAWXqUxs3MpZdLsaNZ2iDtuA8S8tM-N-B0uzXOGHqgfRbGdTq0WjKMTuMJwOSj_IYihZ30j8Nz_tIvmzkF3B8hqAmko_-9S46jqOB2ksD",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDXjo40zBQ6lzjMJFCiZgoCZnZjRZHQsM6ggBC5L07lE0BGtaI2aQgV9ol99LdKjCPOU3EMsqEJkF3kgoZVFxqRN3FBmPqx5pyCOKTjv_SLe6iYZz5XR4V1RPyGMNggbe_-tJ1s4hlFvt1XL1wm65d84J7lVD9Cta0MI0veyN9szrS4LgGWLOmZ5e2oxy8Lzqzy4HgbQHDzU_96Jhz60QRbQn12iweCeYxBU05fPgP4NIe-JNfNnSDWViabShc3pksOcRtCT3G48IOU",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAfRac353JO9vmHQqDcAcrZB5_CgVZPNNdIJex5zVSkdCrjyLbaEZvlUY6tsezjGUK3IAU0Tbr49wHTq38N7ZDziQPbV_gGGA6KqjyXG6Y3D99Phxf6cBSYKOJVS1ermPDHUe6VQpQaCAJdwUwzRgy8VzkGHYmmhc_ep-DSk2vP9MqnMEmNQfzP6YMl29-h-F_EPnxYX3SKgXOpiSOD_SvGahPCB9kKKz2i23m8ZrAhCuGNvX7RJeMebeI5WAqD0pfonTtmk3G06wHC"
  ];

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <main className="flex-grow p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap gap-2 mb-8 text-sm">
        <Link className="text-white/60 hover:text-white transition-colors" to="/">
          Home
        </Link>
        <span className="text-white/60">/</span>
        <span className="text-white">Merch</span>
      </div>

      {/* Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Product Images */}
        <div className="flex flex-col gap-4">
          <div 
            className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-md aspect-square bg-gray-900 border border-white/10"
            style={{ backgroundImage: `url("${productImages[0]}")` }}
          ></div>
          <div className="grid grid-cols-3 gap-4">
            {productImages.slice(1).map((image, index) => (
              <div 
                key={index}
                className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-md aspect-square bg-gray-900 border border-white/10"
                style={{ backgroundImage: `url("${image}")` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <h1 className="text-4xl lg:text-5xl font-bold uppercase tracking-wider text-white">
            D2I T-Shirt
          </h1>
          <p className="text-white/70 text-base leading-relaxed mt-2">
            Represent the Irish Dota 2 community in style.
          </p>
          
          <div className="mt-8 mb-6">
            <span className="text-4xl font-bold text-primary">€15.00</span>
          </div>

          <div className="space-y-6">
            {/* Size Selection */}
            <div>
              <label className="text-sm uppercase tracking-widest text-white/70" htmlFor="size">
                Size
              </label>
              <div className="flex gap-2 mt-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex items-center justify-center rounded-md h-10 w-10 border transition-colors ${
                      selectedSize === size
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/20 bg-transparent text-white/70 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selection */}
            <div>
              <label className="text-sm uppercase tracking-widest text-white/70" htmlFor="quantity">
                Quantity
              </label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center rounded-md border border-white/20 p-1">
                  <button
                    onClick={decrementQuantity}
                    className="flex items-center justify-center h-8 w-8 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">remove</span>
                  </button>
                  <input
                    className="w-10 bg-transparent border-none text-center text-white focus:ring-0 p-0"
                    type="text"
                    value={quantity}
                    readOnly
                  />
                  <button
                    onClick={incrementQuantity}
                    className="flex items-center justify-center h-8 w-8 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button className="flex w-full max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 bg-primary text-background-dark gap-2 text-base font-bold leading-normal tracking-wide hover:opacity-90 transition-opacity uppercase">
              <span className="material-symbols-outlined">add_shopping_cart</span>
              Add to Cart
            </button>
          </div>

          {/* Product Description */}
          <div className="mt-12 border-t border-white/10 pt-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider">Description</h3>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">
                Our inaugural community t-shirt. Made from 100% premium soft cotton, this tee features our iconic logo, 
                screen-printed for a long-lasting, quality finish. Perfect for LANs, pubstomps, or just showing your 
                support for Dota 2 in Ireland.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider">Support the Community</h3>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">
                Every purchase directly supports the Dota2Ireland community. Funds go towards running local tournaments, 
                maintaining our servers, and creating more great events for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Merch;

