-- Add full_name column to profiles (alias for name, used by settings and admin)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Backfill from name where full_name is null
UPDATE public.profiles
SET full_name = name
WHERE full_name IS NULL AND name IS NOT NULL;
