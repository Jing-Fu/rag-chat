# Dashboard Homepage Design

## Task
Create the first frontend page for the RAG developer platform: a dashboard homepage that acts as the primary entry point into the five MVP modules defined in the design spec.

## Goal
Deliver a distinctive, production-grade dashboard homepage for the frontend application that:
- matches the product definition in `docs/design-spec.md`
- prioritizes navigation into the five MVP modules
- includes a small amount of actionable platform status
- establishes the reusable visual and layout language for later dashboard pages

## Scope
This design covers only the first frontend page: the dashboard homepage.

Included:
- fixed left sidebar navigation
- homepage hero section
- module entry cards for Chat, Knowledge, Endpoints, Models, and Prompts
- lightweight system summary strip
- recent activity panel
- quick start panel
- responsive behavior for desktop and mobile
- mock data structure and UI states for future API integration

Excluded:
- full data integration with backend APIs
- implementation of `/chat`, `/knowledge`, `/endpoints`, `/models`, or `/prompts`
- authentication, analytics, or multi-tenant concerns
- advanced dashboard monitoring beyond MVP summary states

## Product Context
The platform is a self-hosted, local-first RAG developer tool with five core capabilities:
- knowledge base management
- chat with SSE streaming responses
- API endpoint management
- Ollama model management
- prompt template management

The homepage should not behave like a marketing landing page or a dense operations console. Its role is to help a developer immediately understand the platform structure, see whether the system is basically ready, and move into the correct workflow with minimal friction.

## Selected Approach
Chosen approach: mixed control homepage.

Rationale:
- preserves the homepage as a strong navigation surface
- adds enough system context to feel like a real developer platform
- avoids becoming a cluttered monitoring dashboard
- creates a clean foundation for later live API integration

## Information Architecture

### Overall Layout
- left: fixed sidebar navigation
- right: main content column

The page is divided into four vertical sections in the main content area:

1. Hero panel
2. Module entry grid
3. System summary strip
4. Lower utility section with recent activity and quick start

### Sidebar Navigation
Sidebar items map directly to the five MVP modules:
- Chat
- Knowledge
- Endpoints
- Models
- Prompts

Homepage behavior:
- the root dashboard view is the default page in the content area
- sidebar remains consistent so later inner pages can reuse it unchanged

Sidebar responsibilities:
- establish product structure
- give persistent access to each module
- visually anchor the dashboard shell for the rest of the frontend

### Hero Panel
Purpose:
- identify the product immediately
- explain the platform in one short line
- surface primary actions without creating feature overload

Content:
- product label or small eyebrow text
- large title for the dashboard homepage
- short supporting description describing the local-first RAG platform
- compact system state badges such as backend ready or local mode
- two primary actions:
  - go to chat
  - create knowledge base

Behavior:
- actions route to module pages, not embedded forms
- state badges communicate readiness without becoming a monitoring widget

### Module Entry Grid
Five module cards represent the five platform areas.

Each card includes:
- module name
- short operational description
- one concise indicator or micro-metric
- directional affordance that implies navigation

Card intent by module:
- Chat: ask questions against indexed knowledge
- Knowledge: upload files and control chunk settings
- Endpoints: publish API-ready RAG endpoints and manage keys
- Models: inspect, pull, and remove Ollama models
- Prompts: manage reusable prompt templates and defaults

Priority:
- this is the main action layer of the homepage
- cards should be highly legible and visually differentiated without breaking cohesion

### System Summary Strip
Purpose:
- show a small set of high-value platform facts
- reinforce that this is an operating tool, not a static landing page

Suggested summary items:
- knowledge base count
- synced model count
- active endpoint count
- recent chat activity count or latest session marker

Constraints:
- keep summary light and scannable
- avoid charts or heavy operational telemetry in the first version

### Recent Activity Panel
Purpose:
- provide continuity for returning users
- hint at what has happened recently without requiring a full audit view

Examples:
- most recent chat session
- last indexed knowledge base
- latest pulled model
- latest endpoint updated

If no activity exists:
- render a deliberate empty state instead of blank space
- empty state should explain that activity will appear after setup and first usage

### Quick Start Panel
Purpose:
- guide first-time users toward the correct setup order

Recommended sequence:
1. Create a knowledge base
2. Sync or choose a model
3. Start a chat session

Presentation:
- short checklist or numbered progression
- each step links to the relevant module

## Interaction Design

### Interaction Model
The homepage is intentionally light on direct editing. It should guide users into workflows rather than collapsing all workflows into the root page.

Interaction rules:
- hero CTA buttons are prominent and route directly to deeper pages
- module cards are fully clickable
- summary items may be clickable but should remain secondary to module cards
- recent activity rows may link to their destination when data exists
- quick start items act as guided shortcuts

### Motion
Motion should be sparse and intentional.

Allowed motion:
- staggered entrance on initial page load
- subtle card translation and shadow shift on hover
- badge or pill transitions for state changes

Avoid:
- constant pulsing
- decorative motion unrelated to information hierarchy
- dense micro-interactions across every surface

## Visual Direction

### Tone
Editorial product interface with a refined, technical character.

The page should feel closer to a technical annual report or product journal than a generic SaaS admin template.

### Color System
Base palette:
- warm white background tones
- limestone or muted gray surfaces
- near-black text and structural accents

Accent palette:
- either deep sea green or copper-orange emphasis depending on implementation balance

Rules:
- avoid purple-on-white SaaS defaults
- use accent color with restraint for actions, highlights, and emphasis
- maintain strong contrast and readable hierarchy

### Typography
Typography must establish identity.

Guidance:
- use a more expressive display face for major headings
- pair it with a restrained, highly readable body face
- avoid default-feeling stacks such as Arial, Roboto, Inter-only styling, or generic system presentation

### Background and Texture
The background should provide atmosphere without reducing clarity.

Allowed treatments:
- faint grid structures
- soft gradient fields
- low-intensity grain or texture overlays
- large compositional shapes with low opacity

### Spatial Composition
Layout priorities:
- strong top rhythm in the hero
- generous spacing around major content groups
- crisp alignment inside cards and summary units
- slight asymmetry where it improves editorial character

## State Design
The homepage UI must be ready for real platform conditions from the first version.

Each data-driven section should support:
- `loading`
- `ready`
- `empty`
- `error`

Examples:
- no knowledge bases yet
- no local models available
- no recent chat history
- backend unavailable
- Ollama unavailable

Error states should be explicit, actionable, and developer-friendly.
Do not allow silent failures or empty surfaces that provide no explanation.

## Component Boundaries
The page should be implemented as a reusable dashboard shell with focused homepage sections.

Suggested components:
- `SidebarNav`
- `HeroPanel`
- `ModuleCardGrid`
- `ModuleCard`
- `StatsStrip`
- `ActivityFeed`
- `QuickStartPanel`

Component design requirements:
- clear single responsibility
- reusable styling tokens and layout primitives
- easy replacement of mock data with API-backed data later
- no monolithic page component that mixes all concerns

## Data Strategy
First version may use structured mock data, but the rendering model should anticipate future API integration.

Planned backend sources:
- `/api/knowledge`
- `/api/models`
- `/api/endpoints`
- `/api/chat/sessions`

Frontend data guidance:
- keep static presentation components separate from data-fetching containers
- shape mock data to resemble eventual API responses where reasonable
- reserve summary and activity sections for lightweight query surfaces

## Technical Constraints
Implementation must align with the repository design spec:
- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- structure compatible with shadcn/ui adoption later

Performance and maintainability guidance:
- keep the homepage lean and avoid unnecessary client-side state
- prepare for React Query integration without hard-coding fetch logic into purely visual components
- favor small client boundaries if interactivity is needed
- avoid over-bundling or introducing heavy dependencies for decorative effects

## Responsive Behavior

### Desktop
- fixed left sidebar remains visible
- main content uses multi-column layout where appropriate
- module grid may use two or three columns depending on width

### Tablet
- sidebar may collapse or reduce width
- hero and lower panels stack more aggressively
- system summary remains readable as wrapped cards

### Mobile
- navigation shifts to compact presentation
- hero actions stack vertically if needed
- module cards become a single-column flow
- recent activity and quick start stack with preserved spacing

## Validation Criteria
The first implementation is complete when:
- the homepage renders successfully in the frontend app
- navigation surfaces are present and clickable
- desktop and mobile layouts remain usable
- mock data states do not break the layout
- empty and error states are visibly intentional
- the layout establishes a reusable visual language for later module pages

## Risks and Follow-ups
- if the frontend scaffold is missing, setup work is required before page implementation
- font selection may need adjustment based on available Next.js font strategy
- once backend APIs exist, summary and activity data contracts should be aligned with actual response shapes
- if live status indicators are added later, they should remain lightweight to preserve the homepage's navigational role