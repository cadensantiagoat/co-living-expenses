
-- ==================================================
-- Property Expense Tracker
-- Migration 001: Initial PostgreSQL Schema
-- ==================================================

-- Enable UUID generation if needed.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================================================
-- 1. PROPERTIES
-- Each property belongs to one user.
-- ==================================================

CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT NOT NULL
        CHECK (char_length(trim(name)) BETWEEN 1 AND 200),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (id, user_id)
);

-- ==================================================
-- 2. EXPENSE CATEGORIES
-- Each user manages their own categories.
-- ==================================================

CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT NOT NULL
        CHECK (char_length(trim(name)) BETWEEN 1 AND 60),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (id, user_id)
);

-- Prevent duplicate category names for a user,
-- ignoring uppercase/lowercase differences.
CREATE UNIQUE INDEX expense_categories_unique_name
ON public.expense_categories (
    user_id,
    lower(trim(name))
);

-- ==================================================
-- 3. EXPENSES
-- Each row represents one category for one month.
-- ==================================================

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    property_id UUID NOT NULL,

    category_id UUID NOT NULL,

    year INTEGER NOT NULL
        CHECK (year BETWEEN 2000 AND 2100),

    month INTEGER NOT NULL
        CHECK (month BETWEEN 1 AND 12),

    amount NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (amount >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT expenses_property_fk
        FOREIGN KEY (property_id, user_id)
        REFERENCES public.properties(id, user_id)
        ON DELETE CASCADE,

    CONSTRAINT expenses_category_fk
        FOREIGN KEY (category_id, user_id)
        REFERENCES public.expense_categories(id, user_id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_monthly_expense
        UNIQUE (property_id, category_id, year, month)
);

-- ==================================================
-- 4. PERFORMANCE INDEXES
-- ==================================================

CREATE INDEX properties_user_id_idx
ON public.properties(user_id);

CREATE INDEX categories_user_id_idx
ON public.expense_categories(user_id);

CREATE INDEX expenses_user_year_idx
ON public.expenses(user_id, year);

CREATE INDEX expenses_property_year_idx
ON public.expenses(property_id, year);

-- ==================================================
-- 5. ROW LEVEL SECURITY
-- Limit each user to their own records.
-- ==================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Properties
CREATE POLICY "Users manage their own properties"
ON public.properties
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Expense Categories
CREATE POLICY "Users manage their own categories"
ON public.expense_categories
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Expenses
CREATE POLICY "Users manage their own expenses"
ON public.expenses
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
