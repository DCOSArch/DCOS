# Global Project Context

## User Profile System
The application uses the `public.users` table as the single source of truth for user profiles (not `public.profiles`). A Postgres trigger on `auth.users` replicates metadata (`full_name`, `role`, `lab_id`/`lab_name`) into `public.users` upon sign-up.

## Row-Level Security (RLS)
The database tables (`cases`, `timeline_events`, `inventory_items`, `spatial_annotations`, etc.) have Row-Level Security enabled. All policies filter access based on the user's `role` and `lab_id` from the `public.users` table:
- **Dentists:** Access cases where `dentist_id = auth.uid()`.
- **Labs:** Access cases where `lab_id` matches the user's `lab_id` from `public.users`.

## Dark Mode Theme
Dark mode is activated by adding the `.dark` class to the root `<html>` element (managed via `src/components/Navbar.tsx`). The theme is defined in `src/app/globals.css` using custom Tailwind CSS v4 variables mapping to a Monokai color palette:
- Background: `#272822`
- Foreground: `#F8F8F2`
- Primary (Pink): `#F92672`
- Secondary/Muted (Cyan): `#66D9EF`
- Accent (Green): `#A6E22E`
- Destructive (Orange): `#FD971F`
- Card/Sidebar BG: `#1E1F1C`
- Border: `#3E3D32`