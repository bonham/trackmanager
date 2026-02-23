# Implementation Overview

This document describes the high-level architecture and main components of Trackmanager.

## Project Structure

Trackmanager is an **npm workspaces monorepo** with three packages:

```
trackmanager/
├── client/    — Vue 3 single-page application (frontend)
├── server/    — Express 5 REST API (backend)
└── shared/    — Shared Zod schemas and TypeScript types
```

All packages use **ESM** (`"type": "module"`) and **TypeScript**.

## Tech Stack at a Glance

| Layer              | Technology                                                     |
| ------------------ | -------------------------------------------------------------- |
| Frontend framework | Vue 3 + Vue Router + Pinia                                     |
| UI library         | Bootstrap 5 via bootstrap-vue-next                             |
| Maps               | OpenLayers with OpenStreetMap tiles                            |
| Charts             | Chart.js with Luxon date adapter and zoom plugin               |
| Build tool         | Vite 7                                                         |
| Backend framework  | Express 5                                                      |
| Database           | PostgreSQL with PostGIS                                        |
| Authentication     | WebAuthn / Passkeys (SimpleWebAuthn)                           |
| Validation         | Zod (shared between client and server)                         |
| Testing            | Vitest + Testing Library (client), Vitest + Supertest (server) |

## Multi-Tenant Architecture

Data isolation is achieved through **PostgreSQL schemas**. Each tenant is identified by a **Schema ID** (`:sid` in routes). A middleware on the server resolves the SID parameter to a PostgreSQL schema name, so all queries are scoped to the correct tenant without needing separate databases.

## Client

### Pages (Views)

| Page                 | Route                        | Purpose                                         |
| -------------------- | ---------------------------- | ----------------------------------------------- |
| `NoSidPage`          | `/`                          | Landing page when no session/schema is selected |
| `TrackMapPage`       | `/:sid`                      | Main map showing all tracks, filterable by year |
| `TrackOverviewPage`  | `/toverview/sid/:sid`        | List of tracks grouped by year                  |
| `ProgressChart`      | `/progress/sid/:sid`         | Cumulative mileage chart comparing years        |
| `UploadPage`         | `/upload/sid/:sid`           | Drag & drop file upload                         |
| `TrackMultiEditPage` | `/track_multi_edit/sid/:sid` | Bulk editing of track names                     |
| `TrackDetailPage`    | `/track/:id/sid/:sid`        | Single track detail view on map                 |

### Key Components

- **TrackManagerNavBar** — Top navigation bar with links to pages, year selector, and login/logout controls.
- **MapComponent** — Wraps an OpenLayers map instance. Used by the map page and detail page.
- **DropField** — Drag & drop zone used on the upload page to accept GPX/FIT files.
- **TrackCard** — Displays a single track's summary (name, distance, date) in the list/overview.
- **TrackSection** — Groups tracks under a heading (e.g. by year) in the overview page.
- **EditableText** — Inline-editable text field used for renaming tracks.
- **UploadItem** — Shows the status of an individual file during upload.
- **LoginModal / LogoutForm** — Passkey authentication UI.

### Stores (Pinia)

| Store         | Responsibility                                            |
| ------------- | --------------------------------------------------------- |
| `configstore` | Application configuration fetched from the server         |
| `mapstate`    | Current map state — selected year, visible tracks, extent |
| `search`      | Search/filter state                                       |
| `userlogin`   | Authentication state — current user, login status         |

### Map Services (`lib/mapservices/`)

The map layer is built around a **`ManagedMap`** class that orchestrates OpenLayers:

- **ManagedMap** — Creates and manages the OL map, layers, and interactions.
- **createLayerFromGeoJson** — Converts a GeoJSON object into an OpenLayers vector layer with appropriate styling.
- **ExtentCollection** — Tracks the combined bounding box of all loaded tracks for "zoom to fit" behaviour.
- **GeoJsonCollection** — Manages a collection of GeoJSON features loaded from the API.
- **PopoverManager** — Handles click-triggered popovers on map features showing track info.
- **ZoomToTracksControl** — Custom OL control button that zooms the map to fit all visible tracks.

### Upload Pipeline (Client Side)

1. User drops files onto `DropField`.
2. `FileUploadQueue` manages concurrency and ordering.
3. `uploadFile` sends each file to the server's upload endpoint.
4. `UploadItem` components reflect per-file progress and status.

## Server

### API Route Groups

Routes are organized into three groups, all mounted under `/api`:

#### Track Routes (`/api/tracks`)

Provide CRUD operations for tracks and spatial queries:

- **Read** — Get all track metadata, get tracks by ID / year / bounding box, get GeoJSON geometries.
- **Write** (authenticated) — Upload new track files, update track metadata, rename from source filename, delete tracks.

#### Auth Routes (`/api/v1/auth`)

Implement the full WebAuthn/Passkey flow:

- Registration options and verification
- Authentication options and verification
- Session check, user info, and logout

Credentials are stored in PostgreSQL (`cred_authenticators` table).

#### Config Routes (`/api/config`)

Serve application configuration values from the database, keyed by type and key.

### File Processing Pipeline (Server Side)

When a track file is uploaded:

1. **`processUpload`** receives the file via `formidable` and determines the file type.
2. **GPX path**: `processGpxFile` → `Gpx2Track` parses XML using `@xmldom/xmldom` and `xpath`, then converts to GeoJSON via `@tmcw/togeojson`.
3. **FIT path**: `processFitFile` → `FitFile` parses the binary Garmin FIT format using `@garmin/fitsdk`, then joins segments and converts to GeoJSON.
4. A `Track` model object is created with metadata (name, distance, ascent, timestamps).
5. **`Track2DbWriter`** writes the GeoJSON geometry into PostGIS and the metadata into the tracks table.

Distance and ascent are calculated using **geodesic math** (`geographiclib-geodesic`) for accuracy.

### Key Server Libraries

| Module                   | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `getPgPool`              | Creates and caches PostgreSQL connection pools                            |
| `sidResolverMiddleware`  | Resolves `:sid` route param to a PostgreSQL schema name                   |
| `getSession`             | Configures Express sessions with a PostgreSQL-backed store                |
| `analyzeString`          | Extracts dates and cleans track names from filenames                      |
| `asyncMiddlewareWrapper` | Wraps async Express handlers so errors are forwarded to the error handler |

## Shared Package

The `trackmanager-shared` package contains **Zod schemas** used by both client and server for runtime validation:

- **GeoJSON schemas** — `Feature`, `FeatureCollection`, `MultiLineString`, geometry types, bounding boxes, and positions.
- **Track metadata schema** — `TrackMetadata` with fields like `id`, `name`, `length`, `time`, `ascent`, etc.
- **Utility schemas** — `TrackIdList`, `MultiLineStringWithTrackId`.

TypeScript types are inferred from the Zod schemas and exported for use across both packages, ensuring a single source of truth for data shapes.

## Development

### Testing

Both client and server use **Vitest** for unit and integration tests. Test runners are configured to watch for changes during development.

- **Client tests** use `jsdom`, `@testing-library/vue`, and `@vue/test-utils`.
- **Server tests** use `supertest` for HTTP-level integration tests.

### Linting & Formatting

- **ESLint** with `typescript-eslint` and `eslint-plugin-vue` (client).
- **Prettier** for code formatting.

### Build

- **Client**: Vite builds a static SPA with manual chunk splitting (lodash, bootstrap-vue-next, OpenLayers, ManagedMap).
- **Server**: `esbuild` bundles the server for production deployment.
