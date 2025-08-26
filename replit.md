# Mission Logic Prototype

## Overview

Mission Logic is a real-time security response management system that simulates three interconnected user interfaces: an Operator Dashboard, Client Portal, and Guard Interface. The system enables clients to request security assistance, operators to assign agents, and guards to accept missions through a live map-based interface with real-time WebSocket communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query for server state management and built-in React state for local UI state
- **Routing**: Wouter for lightweight client-side routing
- **Map Integration**: Leaflet.js with OpenStreetMap tiles for geographical visualization
- **Real-time Communication**: WebSocket client for bidirectional communication with the server

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Real-time Engine**: WebSocket Server (ws library) for live updates between all user interfaces
- **Data Storage**: In-memory storage using Map data structures (no database required)
- **API Design**: RESTful endpoints for initial data loading with WebSocket events for real-time updates
- **Build System**: ESBuild for production bundling with TypeScript compilation

### Data Storage Solutions
- **Storage Pattern**: Repository pattern with IStorage interface for potential future database integration
- **Current Implementation**: MemStorage class using JavaScript Map objects for agents and missions
- **Data Models**: Shared TypeScript types between client and server using Drizzle schemas
- **Session Management**: Stateless WebSocket connections with client type registration

### Authentication and Authorization
- **Current State**: No authentication implemented (prototype-level security)
- **Client Types**: Three distinct user roles (operator, client, guard) registered via WebSocket connection
- **Access Control**: Role-based interface restrictions handled at the component level

### External Dependencies
- **Database**: Drizzle ORM with PostgreSQL dialect configured but using in-memory storage
- **Map Service**: OpenStreetMap tiles (no API key required)
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tools**: Vite for development and production builds with TypeScript support
- **Development**: Replit-specific plugins for runtime error handling and cartographer integration

### Key Design Patterns
- **Event-Driven Architecture**: WebSocket messages trigger state updates across all connected clients
- **Component Composition**: Modular UI components with clear separation of concerns
- **Type Safety**: Full TypeScript coverage with shared schemas between frontend and backend
- **Real-time Synchronization**: All mission and agent state changes broadcast to relevant client types
- **Responsive Design**: Mobile-first approach with adaptive layouts for different screen sizes

### Mission Flow Architecture
1. **Client Request**: Random coordinates generated around Paris for security requests
2. **Operator Assignment**: Visual map interface for selecting and assigning available agents
3. **Guard Response**: Push notifications to assigned guards with accept/decline options
4. **Status Updates**: Real-time status propagation across all connected interfaces
5. **Mission Completion**: Workflow tracking from request to resolution