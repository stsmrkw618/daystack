"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Category, DEFAULT_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useCategories(userId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("daystack_categories")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch categories:", error);
      setLoading(false);
      return;
    }

    // Seed defaults if user has no categories
    if (!data || data.length === 0) {
      const rows = DEFAULT_CATEGORIES.map((cat, i) => ({
        id: cat.id,
        user_id: userId,
        label: cat.label,
        color: cat.color,
        icon: cat.icon,
        sort_order: i,
      }));
      const { error: insertError } = await supabase
        .from("daystack_categories")
        .insert(rows);

      if (insertError) {
        console.error("Failed to seed categories:", insertError);
        setCategories(DEFAULT_CATEGORIES);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(
        data.map((row) => ({
          id: row.id,
          label: row.label,
          color: row.color,
          icon: row.icon,
        }))
      );
    }
    setLoading(false);
  }, [userId]);

  // Realtime subscription
  useEffect(() => {
    fetch();

    const supabase = createClient();
    channelRef.current = supabase
      .channel(`categories:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daystack_categories",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetch();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [userId, fetch]);

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Pick<Category, "label" | "color" | "icon">>) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("daystack_categories")
        .update(updates)
        .eq("user_id", userId)
        .eq("id", id);

      if (error) console.error("Failed to update category:", error);
      else {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
      }
    },
    [userId]
  );

  const addCategory = useCallback(
    async (cat: Category) => {
      const supabase = createClient();
      const { error } = await supabase.from("daystack_categories").insert({
        id: cat.id,
        user_id: userId,
        label: cat.label,
        color: cat.color,
        icon: cat.icon,
        sort_order: categories.length,
      });

      if (error) console.error("Failed to add category:", error);
      else {
        setCategories((prev) => [...prev, cat]);
      }
    },
    [userId, categories.length]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("daystack_categories")
        .delete()
        .eq("user_id", userId)
        .eq("id", id);

      if (error) console.error("Failed to delete category:", error);
      else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    },
    [userId]
  );

  const reorderCategories = useCallback(
    async (newOrder: Category[]) => {
      setCategories(newOrder);
      const supabase = createClient();
      const updates = newOrder.map((cat, i) => ({
        id: cat.id,
        user_id: userId,
        label: cat.label,
        color: cat.color,
        icon: cat.icon,
        sort_order: i,
      }));

      const { error } = await supabase
        .from("daystack_categories")
        .upsert(updates, { onConflict: "user_id,id" });

      if (error) console.error("Failed to reorder categories:", error);
    },
    [userId]
  );

  return {
    categories,
    loading,
    updateCategory,
    addCategory,
    deleteCategory,
    reorderCategories,
  };
}
