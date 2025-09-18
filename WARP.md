# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

**Core Development:**
- `npm start` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm test` - Run Jest test suite (Create React App default)

**Specialized Commands:**
- `npm run generate-confluence` - Generate static Confluence integration files
- `npm run dev:readonly` - Run app with read-only API server concurrently
- `npm run start:readonly-api` - Start read-only API server on port 3002

**Single Test Execution:**
```bash
npm test -- --testPathPattern=<test-file-name>
npm test -- --testNamePattern="<test name pattern>"
```

## Architecture Overview

This is a React-based data planning application (Datenplaner) for managing personnel assignments, data products, roles, and skills with calendar integration. Built with Create React App, Firebase, and Tailwind CSS.

### Core Data Flow

**Authentication & State Management:**
- `App.js` handles Firebase auth state and conditionally renders `AuthPage` or `MainAppContent`
- `DataProvider` (React Context) manages all application state and CRUD operations
- Real-time Firestore subscriptions automatically update UI across all components
- Support for multi-tenancy with feature flags

**Data Architecture:**
- **Firebase Collections:** `personen`, `datenprodukte`, `rollen`, `skills`, `zuordnungen`, `urlaube`
- **Data Path Structure:** `/artifacts/${appId}/public/data/${collection}` (legacy) or `tenant-${tenantId}-${collection}` (multi-tenant)
- **Calendar Integration:** External Confluence calendar fetched via proxy API for vacation/absence tracking

### Key Application Patterns

**Data Provider Centralization:**
- All CRUD operations flow through `DataProvider` context methods
- Optimistic UI updates with real-time Firestore synchronization
- Read-only mode support prevents write operations when `isReadOnly=true`
- Error handling with user-friendly German messages via global error state

**Calendar Integration Flow:**
1. `api/calendar.js` (Vercel serverless function) proxies Confluence calendar with CORS headers
2. `DataProvider` fetches and processes ICS calendar data using `ical.js`
3. Maps vacation events to personnel by email/name matching
4. Updates vacation state triggers UI updates across personnel views

**Multi-Mode Operation:**
- **Full App Mode:** Complete CRUD functionality for authenticated users
- **Read-Only Mode:** View-only interface for Confluence integration
- **Static Generation:** `scripts/generate-static-confluence.js` creates standalone HTML

### Component Structure

**Page Components:**
- `PersonenVerwaltung` - Personnel management with skills, assignments, and workload
- `DatenproduktVerwaltung` - Data product management and assignment oversight  
- `RollenVerwaltung` - Role definitions with color coding
- `SkillsVerwaltung` - Skill management with color-coded tags
- `Auswertungen` - Analytics dashboard with charts and filtering

**Shared Components:**
- `DataProvider` - Central state management and Firebase operations
- `MainAppContent` - Navigation and page routing
- UI components in `components/ui/` for modals, forms, and common elements

### Environment Configuration

**Required Variables (.env):**
```
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=

# Calendar Integration
REACT_APP_CONFLUENCE_CALENDAR_URL=
REACT_APP_CALENDAR_PROXY_URL=

# Multi-Tenancy (optional)
REACT_APP_MULTI_TENANCY_STATUS=disabled
REACT_APP_DEFAULT_TENANT_ID=datenplaner-app-v3
```

### Data Model Relationships

**Core Entities:**
- **Personen:** Personnel with skills, working hours, M13 status, categories
- **Skills:** Tagged capabilities with color coding
- **Datenprodukte:** Data products requiring personnel assignments
- **Rollen:** Roles defining responsibilities in data products
- **Zuordnungen:** Assignment relationships linking person + role + data product + hours
- **Urlaube:** Vacation/absence records from calendar integration

**Key Relationships:**
- Person ↔ Skills (many-to-many via `skillIds`)
- Person ↔ DataProduct ↔ Role (via `zuordnungen` junction table)
- Calendar events mapped to personnel via email/name matching

### API & Serverless Functions

**Vercel API Routes:**
- `/api/calendar` - Proxy for Confluence calendar with CORS handling (30s timeout)
- Handles authentication headers and ICS format validation
- Implements caching with `s-maxage=300, stale-while-revalidate=600`

### Feature Flags & Multi-Tenancy

Controlled via `utils/featureFlags.js`:
- `MULTI_TENANCY` - Enables tenant-based data isolation
- `TENANT_MANAGEMENT` - Administrative tenant operations
- Data paths automatically switch based on feature flag status

### Confluence Integration

**Read-Only Deployment:**
- Static HTML files in `/public/` for iframe embedding
- `readonly-live.html` connects to live Firebase data
- `readonly-static.html` uses generated static data
- `scripts/generate-static-confluence.js` creates standalone versions

**Integration Methods:**
1. **iframe:** Direct embedding of read-only views
2. **JavaScript Widget:** Standalone component mounting
3. **Confluence User Macro:** Native Confluence integration

### Development Patterns

**German Language Interface:**
- UI text and variable names use German terminology
- Collection names: `personen`, `datenprodukte`, `rollen`, `skills`, `zuordnungen`
- Error messages displayed in German

**Defensive Programming:**
- Extensive null checks and fallback values
- Default working hours (31), color assignments, and empty arrays
- Graceful degradation when calendar or Firebase operations fail

**Real-time Updates:**
- Firestore `onSnapshot` subscriptions for all collections
- Automatic UI synchronization across browser tabs/users
- Last change tracking with user attribution and timestamps

### Testing Strategy

Uses Create React App's built-in Jest configuration. No custom test files currently exist - tests would follow CRA patterns in `src/**/*.test.js` files.

### Deployment Architecture

**Vercel Integration:**
- `vercel.json` configures serverless function routing
- Environment variables managed via Vercel dashboard
- Static file serving from `/public/` directory
- API routes automatically deployed as serverless functions