"use client";

import { useCallback, useState } from "react";
import { WeeklySummary } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface DbWeeklySummary {
  id: number;
  user_id: string;
  week_start: string;
  summary: WeeklySummary;
  created_at: string;
}

export function useWeeklySummary(userId: string) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);

  const fetchSummary = useCallback(
    async (weekStart: string): Promise<WeeklySummary | null> => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("daystack_weekly_summaries")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .single();

      setLoading(false);

      if (error || !data) {
        setSummary(null);
        return null;
      }

      const row = data as DbWeeklySummary;
      setSummary(row.summary);
      return row.summary;
    },
    [userId]
  );

  const fetchLatest = useCallback(async (): Promise<WeeklySummary | null> => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("daystack_weekly_summaries")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(1)
      .single();

    setLoading(false);

    if (error || !data) {
      setSummary(null);
      return null;
    }

    const row = data as DbWeeklySummary;
    setSummary(row.summary);
    return row.summary;
  }, [userId]);

  const fetchAvailableWeeks = useCallback(async (): Promise<string[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("daystack_weekly_summaries")
      .select("week_start")
      .eq("user_id", userId)
      .order("week_start", { ascending: false });

    if (error || !data) {
      setAvailableWeeks([]);
      return [];
    }

    const weeks = data.map((d: { week_start: string }) => d.week_start);
    setAvailableWeeks(weeks);
    return weeks;
  }, [userId]);

  return { summary, loading, availableWeeks, fetchSummary, fetchLatest, fetchAvailableWeeks };
}
