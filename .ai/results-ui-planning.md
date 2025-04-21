<conversation_summary>
<decisions>
1. Admin section will be accessible via conditional display of links in NavBar, no separate layout path.  
2. Navigation will be a simple top navbar with distinct items per role, displaying the logged-in user's name.  
3. Routing will use Astro's file-based routing with dynamic pages.  
4. Flashcards list will support arrow-based pagination ("Poprzednia"/"Następna") with a limit of 10 cards per page.  
5. JWT will be stored in localStorage and attached to requests via axios interceptors.  
6. Session token refresh beyond MVP is out of scope; expired sessions force logout.  
7. Spinner will be a local indicator on buttons/components for long‑running operations.  
8. SessionView will send "correct"/"incorrect" immediately after each card.  
9. Inline edit of flashcards directly in the list.  
10. Unimplemented features (e.g., Profile) will appear as disabled links with a Shadcn/ui Tooltip "Coming soon."
</decisions>

<matched_recommendations>
1. Use Shadcn/ui components to build `NavBar`, conditionally rendering links and showing username; disabled links get a Tooltip.  
2. Configure `axios` in `src/lib/api` with interceptors that read JWT from localStorage.  
3. Implement `AuthContext` (React Context) to manage global session state and protect routes.  
4. Employ React Query for fetching/mutating data (`flashcards`, `generate`, `sessions`, `adminService`) with cache, retry, and invalidation.  
5. Create a local `Spinner` component using Shadcn/ui for button‑level loading indicators.  
6. Apply Shadcn/ui `Pagination` or button set for arrow‑based pagination.  
7. Use Shadcn/ui `Input` and `Button` for inline flashcard editing, coupled with a local Spinner during PATCH.  
8. Build `SessionView` with Shadcn/ui `Card` and `ButtonGroup` to display flashcards and send immediate PATCH on evaluation.  
9. Display inline validation errors via Shadcn/ui `FormMessage` and API errors as Shadcn/ui `Alert` near relevant components.  
10. Structure the API layer in `src/lib/api` into services: `authService`, `flashcardService`, `sessionService`, `adminService`, each wrapping HTTP calls and unifying error handling.
</matched_recommendations>

<ui_architecture_planning_summary>
We will use Astro's file‑based routing with dynamic `[id].tsx` pages under `src/pages`. A single layout hosts a top `NavBar` built with Shadcn/ui that shows user‑specific links and the username, hiding admin links via a disabled state and Tooltip. JWTs live in localStorage and are injected into all requests by axios interceptors. Global session state and route guards are managed by an `AuthContext`. React Query handles all data interactions—fetching, caching, retries, and cache invalidation on mutations—for flashcards, AI generation, learning sessions, and admin metrics. The flashcards list is paginated with 10 items per page via arrow buttons. The `SessionView` component uses Shadcn/ui Cards and ButtonGroups to present one flashcard at a time, sending a PATCH after each "correct"/"incorrect" action. Inline editing of flashcards uses Shadcn/ui Inputs and Buttons with a local Spinner indicator. Unimplemented MVP features (Profile) remain as disabled NavBar links with "Coming soon" tooltips. Inline errors are shown via Shadcn/ui `FormMessage` for form validation and `Alert` for API errors. All API calls are abstracted into dedicated services under `src/lib/api`.
</ui_architecture_planning_summary>

<unresolved_issues>
1. UX for disabled‑feature clicks beyond Tooltip: should there be a placeholder view or toast?  
2. Confirmation flow for destructive actions (e.g., deleting a flashcard) needs detailed design.  
3. Responsive breakpoints and mobile layout specifics require additional guidelines.
</unresolved_issues>
</conversation_summary>
