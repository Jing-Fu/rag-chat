# Ollama-Inspired Frontend Redesign Spec

## Scope

Redesign the existing Next.js frontend so the entire product aligns with the grayscale, shadowless, pill-first visual system defined in [DESIGN.md](d:/workspace/playground/rag-chat/DESIGN.md), while preserving the current information architecture and backend integrations.

This redesign applies to:

- Chat home page
- Shared shell and navigation
- Knowledge bases page
- Models page
- Prompt templates page
- API endpoints page
- Shared UI primitives that currently enforce dark cards, mixed radii, or visual elevation

## Working Assumptions

- The user wants the frontend restyled now without changing backend APIs or product capabilities.
- Existing routes remain the same: `/`, `/knowledge`, `/models`, `/prompts`, `/endpoints`.
- Current React Query data flows, Zustand state, and API clients remain intact.
- The design system in [DESIGN.md](d:/workspace/playground/rag-chat/DESIGN.md) is the source of truth when it conflicts with current styling.
- No licensed font files for SF Pro Rounded will be added to the repo. The implementation will use an Apple-first rounded system stack and clean sans-serif fallbacks.

## Problem Statement

The current frontend is visually coherent, but it is optimized around a dense dark dashboard aesthetic:

- Global tokens are dark-first in [frontend/src/app/globals.css](d:/workspace/playground/rag-chat/frontend/src/app/globals.css)
- The shell in [frontend/src/components/layout/dashboard-shell.tsx](d:/workspace/playground/rag-chat/frontend/src/components/layout/dashboard-shell.tsx) and [frontend/src/components/layout/app-sidebar.tsx](d:/workspace/playground/rag-chat/frontend/src/components/layout/app-sidebar.tsx) creates a control-room feel
- Chat and admin pages rely on rounded cards, dark surfaces, and accent states that do not match the provided minimal monochrome direction

The result is a mismatch between the intended product personality and the shipped interface. The redesign needs to fix the visual system at the root instead of repainting individual pages in isolation.

## Goals

1. Establish a single grayscale design language across the full frontend.
2. Replace the current dark dashboard shell with a white, minimal, Ollama-inspired layout.
3. Preserve all current workflows and data behavior.
4. Make the empty and first-run chat experience feel intentional, sparse, and approachable.
5. Normalize all interactive elements to pill geometry and all containers to 12px radius.
6. Remove decorative depth: no shadows, no gradients, no chromatic accents except focus.

## Non-Goals

- No backend schema or API changes.
- No feature expansion beyond the redesign.
- No animation-heavy marketing layer.
- No visual brand divergence from the grayscale system.

## Approaches Considered

### Approach A: Token-Only Restyle

Update color tokens and leave page structures mostly intact.

Pros:

- Lowest implementation cost
- Minimal risk to page logic

Cons:

- Keeps the current dense dashboard composition
- Preserves component shapes and spacing that conflict with the new spec
- Produces a partial visual match at best

### Approach B: Shared Shell + Shared Primitives + Page Recomposition

Create a new white shell, redefine shared primitives, and recompose each page around the new layout language while reusing existing data logic.

Pros:

- Fixes the root visual mismatch
- Keeps business logic stable
- Produces a consistent system instead of page-by-page exceptions

Cons:

- Touches more files
- Requires coordinated updates to layout, page structure, and tests

### Approach C: New Landing Layer on Top of Current App

Keep the current dashboard behind the scenes and add a new homepage aesthetic while leaving secondary screens mostly unchanged.

Pros:

- Fastest path to a better first impression

Cons:

- Inconsistent product experience after navigation
- Does not satisfy the request to redesign the frontend pages as a whole

## Recommendation

Use Approach B.

It is the only option that aligns the product with the supplied design system without discarding the working frontend logic. The redesign should be structural at the shell and shared-component level, then applied consistently across all existing routes.

## Design Direction

The product should feel like a local AI workbench stripped down to essentials:

- Pure white canvas
- Black text hierarchy
- Flat borders instead of elevation
- Generous whitespace
- Rounded pills for every control
- Monospace used as functional identity, not ornament

The overall impression should be quieter, lighter, and more deliberate than the current interface. The UI should look like a tool that gets out of the way.

## Information Architecture

The current route map is correct and should remain intact. The redesign changes presentation, not navigation depth.

### Primary Surfaces

- Chat remains the default workspace at `/`
- Knowledge bases, models, prompts, and endpoints remain secondary management surfaces

### Navigation Strategy

- Desktop: slim left rail with product mark, New Chat action, session list, and route links
- Mobile: top bar with menu trigger and compact route switcher
- Route links remain persistent but visually quieter than the current heavy sidebar blocks

## Layout System

### Global Shell

Replace the current full-height dark app shell with a white shell that uses:

- White page background
- Thin light-gray dividers only where necessary
- A restrained left rail on desktop
- A top content frame that never feels boxed-in

### Spacing

- Base rhythm: 8px
- Default horizontal page padding: 20px mobile, 32px tablet, 40px desktop
- Section spacing should be generous enough that each block feels isolated and readable

### Radius Rules

- Containers: 12px only
- Interactive controls: 9999px only

No intermediate radii should remain after the redesign.

## Typography

### Font Strategy

- Display stack: `"SF Pro Rounded", "ui-rounded", system-ui, -apple-system, sans-serif`
- Body stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Monospace: existing system monospace stack

### Usage Rules

- Headings use medium weight only
- Body copy uses regular weight
- Avoid bold-heavy hierarchy
- Empty states and terminal snippets use monospace sparingly but intentionally

## Color and Surface Tokens

The frontend token layer should be rebuilt around the grayscale values in [DESIGN.md](d:/workspace/playground/rag-chat/DESIGN.md).

Required semantic mapping:

- Background: white
- Foreground: black
- Card: white or snow
- Border: light gray
- Muted foreground: stone or silver depending on depth
- Primary actions: black fill with white text
- Secondary actions: white fill with border
- Neutral actions: light-gray fill with dark text
- Focus ring: blue only on focus states

## Shared Components

### Buttons

Update [frontend/src/components/ui/button.tsx](d:/workspace/playground/rag-chat/frontend/src/components/ui/button.tsx) so variants map to the new system:

- `default`: black pill CTA
- `secondary`: light-gray pill
- `outline`: white pill with light border
- `ghost`: borderless text action for low-emphasis controls

### Shell Components

Refactor [frontend/src/components/layout/dashboard-shell.tsx](d:/workspace/playground/rag-chat/frontend/src/components/layout/dashboard-shell.tsx) and [frontend/src/components/layout/app-sidebar.tsx](d:/workspace/playground/rag-chat/frontend/src/components/layout/app-sidebar.tsx):

- Remove dark backgrounds and blue accents
- Make session rows flatter and lighter
- Add mobile navigation behavior
- Standardize spacing and border treatment

### Chat Controls

Refine [frontend/src/components/chat/chat-header.tsx](d:/workspace/playground/rag-chat/frontend/src/components/chat/chat-header.tsx), [frontend/src/components/chat/chat-input.tsx](d:/workspace/playground/rag-chat/frontend/src/components/chat/chat-input.tsx), and [frontend/src/components/chat/chat-message-list.tsx](d:/workspace/playground/rag-chat/frontend/src/components/chat/chat-message-list.tsx):

- Selector controls become pills with minimal chrome
- Composer becomes a large white pill with flat border
- Assistant and user message styling becomes quieter and less bubble-heavy
- Source citations become compact bordered metadata blocks

## Page-Level Designs

### Chat Home Page

The home page in [frontend/src/app/page.tsx](d:/workspace/playground/rag-chat/frontend/src/app/page.tsx) becomes the emotional center of the redesign.

#### Empty State

- Large centered heading with rounded display stack
- Brief monochrome explanation of the selected workspace state
- Small set of quick-start chips or command-style prompts
- Composer anchored visually near the bottom, but still responsive and scroll-safe

#### Active Conversation State

- Wider vertical breathing room between messages
- User messages appear as understated dark pills or compact dark bubbles
- Assistant messages live on a white surface with almost no chrome
- Streaming state is text-forward and subtle

#### Header Controls

- Model, prompt, and knowledge base selectors remain visible
- Present them as calm pill controls, not toolbar widgets
- Loading and error status should be reduced to tiny muted text

### Knowledge Bases Page

The current page is functionally rich but visually dense. Redesign it as a two-panel workspace:

- Left: searchable knowledge base list and create action
- Right: selected knowledge base detail and document list
- Upload and reindex actions become pill buttons
- Status badges become grayscale pills, with color reserved only when absolutely necessary for critical errors

### Models Page

Shift from dark admin table styling to a flat inventory view:

- Pull model form becomes a simple bordered panel
- Progress bar remains functional but visually monochrome
- Model list uses clean rows with restrained metadata
- Delete action remains low emphasis until hovered

### Prompt Templates Page

Adopt the same split-view structure as knowledge bases:

- Search and create actions in a quiet top bar
- Template list on the left
- Editor pane on the right
- Advanced template fields stay available but visually collapsed until needed

### API Endpoints Page

This page should feel more like a key management and query workbench than a dashboard:

- Create form in a bordered white panel
- Endpoint list as quiet rows or cards
- Selected endpoint detail with generated key, copy action, and test query area
- Query response presented in a monospace bordered block

## Responsive Behavior

### Mobile

- Collapse left rail into an overlay sheet or top navigation drawer
- Stack split-pane pages into single-column sections
- Keep composer, buttons, and selector pills comfortably tappable

### Desktop

- Preserve large whitespace and restrained max widths
- Avoid stretching forms or tables edge-to-edge unnecessarily

## Accessibility

- Keyboard focus must remain clearly visible through the blue focus ring only
- Color is not relied on as the only status signal
- Interactive pills must maintain adequate hit area
- Empty-state guidance should still be readable by assistive technology

## Testing Impact

Existing component tests will likely need updates where roles, labels, or text hierarchy change.

At minimum, verify:

- Chat input submit behavior still works
- Message list still renders streaming and source states correctly
- Sidebar or replacement navigation still exposes sessions and route links
- Page smoke flow still works after layout changes

## Risks and Mitigations

### Risk: Restyle leaks inconsistent tokens

Mitigation: update token sources first, then shell, then page components.

### Risk: Secondary pages diverge from chat visual language

Mitigation: create shared page-level primitives before restyling management pages.

### Risk: Mobile nav regresses while desktop improves

Mitigation: include mobile shell behavior as part of the shell refactor, not a later pass.

## Acceptance Criteria

1. The app presents a white, grayscale, shadowless interface across all routes.
2. Interactive elements use pill geometry consistently.
3. Containers use 12px radius consistently.
4. The chat experience feels sparse and centered instead of dense and dashboard-like.
5. Knowledge, models, prompts, and endpoints pages share the same visual language.
6. Existing user workflows continue to function without backend changes.
7. Core frontend tests and build checks pass after the redesign.

## Open Decisions Resolved for This Spec

- Use a system-based rounded display stack instead of bundling proprietary font assets.
- Preserve the current route structure instead of introducing a separate marketing homepage.
- Keep the left-side navigation pattern on desktop, but reduce its visual weight significantly.
- Reuse existing data hooks and mutate only layout and presentation concerns.