# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm test` - Run Jest test suite
- `npm run eject` - Eject from Create React App (NOT RECOMMENDED)

## Architecture Overview

This is a React-based data planning application built with Create React App, Firebase, and Tailwind CSS. The app manages personnel, data products, roles, and skills with calendar integration.

### Core Technologies
- **React 18** - Frontend framework with functional components and hooks
- **Firebase** - Authentication and Firestore database
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart components for analytics
- **ical.js** - Calendar parsing for vacation/absence tracking

### Application Structure

**Authentication Flow:**
- App.js handles auth state and renders either AuthPage or MainAppContent
- Firebase Authentication with email/password
- Auth state is managed globally and passed down to components

**Data Management:**
- DataProvider (context/DataProvider.js) - Central state management using React Context
- Manages all CRUD operations for: personen (people), datenprodukte (data products), rollen (roles), skills, zuordnungen (assignments)
- Real-time Firestore subscriptions with automatic UI updates
- Read-only mode support for restricted access

**Page Structure:**
- MainAppContent.js - Main navigation and page routing
- Pages: PersonenVerwaltung, DatenproduktVerwaltung, RollenVerwaltung, SkillsVerwaltung, Auswertungen
- All pages are single-page with tab-based navigation

**Calendar Integration:**
- Fetches vacation/absence data from Confluence calendar via proxy
- Calendar data is processed and mapped to personnel for availability tracking
- Uses api/calendar.js for calendar event processing

### Firestore Data Structure

Data is stored under `/artifacts/${appId}/public/data/` with collections:
- `personen` - Personnel records with skills and contact info
- `datenprodukte` - Data products with metadata
- `rollen` - Role definitions
- `skills` - Skill definitions with color coding
- `zuordnungen` - Assignment relationships between people, products, and roles
- `urlaube` - Vacation/absence records

### Environment Configuration

Required environment variables for Firebase and calendar integration:
- `REACT_APP_FIREBASE_*` - Firebase configuration
- `REACT_APP_CONFLUENCE_CALENDAR_URL` - Direct calendar URL
- `REACT_APP_CALENDAR_PROXY_URL` - Proxy server URL (defaults to /api/calendar)
- `REACT_APP_LOG_SERVER_URL` - Logging endpoint (defaults to /api/log)

### API Endpoints

- `/api/calendar` - Vercel serverless function for calendar proxy (30s timeout)
- Handles CORS and fetches calendar data from external sources

### Key Patterns

- All data operations go through DataProvider context methods
- Error handling with user-friendly messages via error state
- Optimistic UI updates with real-time Firestore sync
- Defensive programming with null checks and fallbacks
- German language interface and variable naming