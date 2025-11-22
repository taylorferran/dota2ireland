# Dota2Ireland Community Website

A modern React website for the Dota2Ireland community, featuring event listings, merchandise, and community information.

## Features

- 🏠 **Home Page**: Welcome section with featured content cards for tournaments, leagues, and merchandise
- 📅 **Events Page**: Display upcoming and past Dota 2 community events across Ireland
- 🛍️ **Merch Page**: Product showcase with size selection and quantity management
- 🎨 **Consistent Branding**: Using the official Dota2Ireland color scheme and design system

## Design System

### Colors
- **Primary Green**: `#13ec5b` - Main brand color
- **Accent Orange**: `#f97316` - Secondary accent
- **Background Dark**: `#102216` - Dark background
- **Background Light**: `#f6f8f6` - Light background

### Typography
- **Font Family**: Space Grotesk (sans-serif)
- Dark mode enabled by default

### Border Radius
- Default: `1rem`
- Large: `2rem`
- Extra Large: `3rem`
- Full: `9999px` (pill shape)

## Tech Stack

- **React** - Frontend framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework (via CDN)
- **Google Fonts** - Space Grotesk typography
- **Material Symbols** - Icon system

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
\`\`\`bash
cd dota2ireland-app
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open your browser and visit `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

\`\`\`
dota2ireland-app/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── Layout.jsx
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── Events.jsx
│   │   └── Merch.jsx
│   ├── App.jsx         # Main app component with routing
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template with Tailwind CDN
├── package.json
└── vite.config.js
\`\`\`

## Pages

### Home (`/`)
- Hero section with community tagline
- Three featured cards:
  - Upcoming Tournament
  - Irish Dota League
  - Latest Merch Drop

### Events (`/events`)
- Page header with description
- Upcoming Events section (3 cards with registration buttons)
- Past Events section (3 cards with grayscale images)

### Merch (`/merch`)
- Product images gallery
- Product details with pricing
- Size selector (S, M, L, XL)
- Quantity selector
- Add to cart functionality
- Product description and community support message

## Customization

To modify the color scheme, update the Tailwind config in `index.html`:

\`\`\`javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        "primary": "#13ec5b",
        "accent-orange": "#f97316",
        // ... other colors
      }
    }
  }
}
\`\`\`

## Future Enhancements

- Add backend API integration
- Implement shopping cart functionality
- Add user authentication
- Create admin panel for event management
- Add Irish Dota League standings page
- Implement responsive mobile menu
- Add image optimization

## License

© 2024 Dota2Ireland. All rights reserved.

## Contact

For questions or feedback, please reach out through our Discord or Twitter channels.
