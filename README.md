# MCI Delivery Management System

A comprehensive enterprise-grade delivery management system built with modern web technologies.

## Features

- **Delivery Booking System**: Intuitive calendar interface for booking deliveries
- **Analytics Dashboard**: Comprehensive business insights with data visualizations
- **Active Deliveries Tracking**: Real-time monitoring of ongoing deliveries
- **Delivery History**: Complete record of past deliveries
- **Customer Management**: Manage customer information and relationships
- **Warehouse Management**: Track warehouse locations and capacities
- **User Settings**: Customize system preferences

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **UI Framework**: Bootstrap 5.3 with Material Design elements
- **Data Visualization**: Chart.js
- **Backend**: Supabase (PostgreSQL database, authentication, and edge functions)
- **Hosting**: Netlify

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Supabase CLI](https://supabase.com/docs/guides/getting-started/installing-the-cli)
- Netlify account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/johnmangawang-git/mci-delivery-tracker.git
   cd mci-delivery-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Initialize Supabase (if not already done):
   ```bash
   npx supabase init
   ```

5. Start the development server:
   ```bash
   npm start
   ```

## Deployment

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Update your environment variables with the Supabase credentials
4. Push the database schema:
   ```bash
   npx supabase db push
   ```

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `echo 'No build needed for static site'`
   - Publish directory: `public`
3. Add environment variables in Netlify dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy!

## Project Structure

```
mci-delivery-tracker/
├── public/                 # Static files
│   ├── index.html         # Main application
│   ├── assets/            # CSS, JS, images
│   └── manifest.json      # PWA manifest
├── supabase/              # Supabase configuration
│   ├── config/            # Supabase client config
│   └── migrations/        # Database migrations
├── package.json           # Dependencies and scripts
├── netlify.toml          # Netlify configuration
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details