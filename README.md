# Trackmanager — Your Personal Bicycle Track Archive

Trackmanager is a self-hosted web application for storing, viewing, and analyzing your bicycle GPS tracks. Upload GPX and Garmin FIT files, explore your ride history on interactive maps, and track your mileage progress over the years.

## Features

### Upload & Import

- **Drag & drop** GPX and Garmin FIT files directly onto the upload page
- Track names are automatically derived from the file; rename them anytime with inline editing
- Uploaded tracks are parsed and stored with full geographic detail

### Interactive Map

- View **all your tracks on a single map** — filter by year or show everything at once
- Powered by OpenStreetMap with smooth panning, zooming, and a "zoom to all tracks" control
- Click on a track to see its details in a popover

### Track List

- Browse your rides in a **list view grouped by year**
- See key stats for each track: distance, ascent, and ride duration
- Open any track to view it individually on the map

### Progress Chart

- Visualize your **cumulative mileage over time** with an interactive chart
- Compare the current year against previous years at a glance
- Zoom and pan to focus on specific time ranges

### Authentication

- Passwordless **passkey / WebAuthn** login — no passwords to remember
- Secure session management backed by the database

### Mobile Friendly

- Responsive layout that works on phones and tablets

## Getting Started

### Prerequisites

- **Node.js** ~24
- **PostgreSQL** with the **PostGIS** extension

### Installation

```bash
# Clone the repository
git clone https://github.com/bonham/trackmanager.git
cd trackmanager

# Install dependencies (npm workspaces)
npm install

# Configure the server
cp server/env.dist server/.env
# Edit server/.env with your PostgreSQL connection details and other settings
```

### Running in Development

```bash
# Start the backend (auto-restarts on changes)
cd server && npm run start

# In a separate terminal, start the frontend dev server
cd client && npm run dev
```

The frontend dev server runs on **port 4000** and proxies API requests to the backend on **port 3000**.

### Building for Production

```bash
cd client && npm run build
cd ../server && npm run build
```

## Further Reading

- [IMPLEMENTATION.md](IMPLEMENTATION.md) — High-level overview of the architecture and main components
