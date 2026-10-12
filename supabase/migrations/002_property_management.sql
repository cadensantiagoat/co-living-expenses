
-- Migration 002: Property Management

BEGIN;

-- Add an optional address.
ALTER TABLE public.properties
ADD COLUMN address TEXT;

-- Add the date/time when a property is archived.
ALTER TABLE public.properties
ADD COLUMN archived_at TIMESTAMPTZ;

-- Prevent extremely long addresses.
ALTER TABLE public.properties
ADD CONSTRAINT property_address_length
CHECK (
  address IS NULL
  OR char_length(address) <= 500
);

-- Optimize queries for a user's active properties.
CREATE INDEX properties_active_user_idx
ON public.properties (user_id, created_at)
WHERE archived_at IS NULL;

COMMIT;
