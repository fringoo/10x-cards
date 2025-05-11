import { createSupabaseServerClient } from '../db/supabase.client';
import { defineMiddleware } from 'astro:middleware';
import type { User } from '@supabase/supabase-js';

// Ścieżki chronione - użytkownik musi być zalogowany
const protectedRoutes = ['/generate', '/flashcards', '/sessions/new', '/profile', '/admin/metrics']; 
// Ścieżki publiczne związane z autentykacją - dostępne dla niezalogowanych
// Zalogowani użytkownicy próbujący uzyskać do nich dostęp zostaną przekierowani do '/'
const authFlowRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
// Inne ścieżki publiczne (np. strona główna, /verify-email)
const otherPublicRoutes = ['/', '/auth/verify-email'];

// Endpointy API są obsługiwane oddzielnie i nie powinny być tutaj blokowane, 
// ich własna logika będzie decydować o dostępie.

export const onRequest = defineMiddleware(
  async (context, next) => {
    const { locals, cookies, url, request, redirect } = context;
    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

    locals.supabase = supabase; // Udostępnienie klienta Supabase w Astro.locals

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    locals.user = user as User | null; // Użycie pełnego typu User z Supabase

    const currentPath = url.pathname;

    // Logika przekierowań:
    if (user) {
      // Jeśli użytkownik jest zalogowany i próbuje uzyskać dostęp do ścieżek procesu autentykacji
      if (authFlowRoutes.some(path => currentPath.startsWith(path))) {
        return redirect('/'); // Przekieruj na stronę główną
      }
    } else {
      // Jeśli użytkownik jest niezalogowany i próbuje uzyskać dostęp do chronionej ścieżki
      if (protectedRoutes.some(path => currentPath.startsWith(path))) {
        return redirect('/auth/login');
      }
    }

    // Strony /auth/verify-email i /auth/reset-password (oraz inne w otherPublicRoutes)
    // powinny być dostępne niezależnie od stanu logowania, 
    // ich logika wewnętrzna obsłuży ewentualne tokeny/kontekst.
    // API routes również są pomijane w tej logice przekierowań.

    return next();
  },
);
