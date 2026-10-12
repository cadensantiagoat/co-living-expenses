
import { supabase } from "../lib/supabase";
import { CATEGORIES } from "../data/expenseConfig";

// Retrieve the authenticated user from Supabase.
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  if (!data.user) {
    throw new Error("You must be signed in.");
  }

  return data.user;
}

// -------------------------------------------
// PROPERTIES
// -------------------------------------------

export async function getProperties() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}

export async function createProperty(name) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("properties")
    .insert({
      user_id: user.id,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// -------------------------------------------
// EXPENSE CATEGORIES
// -------------------------------------------

export async function getCategories() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}

export async function createCategory(name) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("expense_categories")
    .insert({
      user_id: user.id,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function renameCategory(id, name) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("expense_categories")
    .update({ name: name.trim() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Add default categories only when an account
// has no category records yet.
export async function initializeCategories() {
  const existing = await getCategories();

  if (existing.length > 0) {
    return existing;
  }

  const user = await getCurrentUser();

  const rows = CATEGORIES.map((name) => ({
    user_id: user.id,
    name,
  }));

  const { error } = await supabase
    .from("expense_categories")
    .insert(rows);

  // Another session may have inserted the defaults.
  // The unique-name constraint prevents duplicates.
  if (error && error.code !== "23505") {
    throw error;
  }

  return getCategories();
}

// -------------------------------------------
// MONTHLY EXPENSES
// -------------------------------------------

export async function getExpenses(year) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .order("month", { ascending: true });

  if (error) throw error;

  return data;
}

export async function saveExpense({
  propertyId,
  categoryId,
  year,
  month,
  amount,
}) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("expenses")
    .upsert(
      {
        user_id: user.id,
        property_id: propertyId,
        category_id: categoryId,
        year,
        month,
        amount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict:
          "property_id,category_id,year,month",
      }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}
