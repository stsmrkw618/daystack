"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TaskCard, todayStr } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface DbTask {
  id: number;
  user_id: string;
  title: string;
  category: string;
  minutes: number;
  start_time: string;
  end_time: string;
  date: string;
}

function dbToCard(row: DbTask): TaskCard {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    minutes: row.minutes,
    startTime: row.start_time,
    endTime: row.end_time,
    date: row.date,
  };
}

export function useTasks(userId: string, selectedDate?: string) {
  const date = selectedDate ?? todayStr();
  const [cards, setCards] = useState<TaskCard[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchTasks = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("daystack_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Failed to fetch tasks:", error);
    } else {
      setCards((data || []).map(dbToCard));
    }
    setLoading(false);
  }, [userId, date]);

  // Realtime subscription
  useEffect(() => {
    fetchTasks();

    const supabase = createClient();
    channelRef.current = supabase
      .channel(`tasks:${userId}:${date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daystack_tasks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as DbTask;
            if (row.date === date) {
              setCards((prev) => {
                if (prev.some((c) => c.id === row.id)) return prev;
                const newCard = dbToCard(row);
                const next = [...prev, newCard];
                next.sort((a, b) => a.startTime.localeCompare(b.startTime));
                return next;
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as DbTask;
            if (row.date === date) {
              setCards((prev) =>
                prev.map((c) => (c.id === row.id ? dbToCard(row) : c))
              );
            }
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: number };
            setCards((prev) => prev.filter((c) => c.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [userId, date, fetchTasks]);

  const addTask = useCallback(
    async (task: Omit<TaskCard, "date">) => {
      const supabase = createClient();
      const row = {
        id: task.id,
        user_id: userId,
        title: task.title,
        category: task.category,
        minutes: task.minutes,
        start_time: task.startTime,
        end_time: task.endTime,
        date,
      };
      // Optimistic update (sorted by startTime)
      setCards((prev) => {
        const next = [...prev, { ...task, date }];
        next.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return next;
      });

      const { error } = await supabase.from("daystack_tasks").insert(row);
      if (error) {
        console.error("Failed to add task:", error);
        // Rollback
        setCards((prev) => prev.filter((c) => c.id !== task.id));
      }
    },
    [userId, date]
  );

  const updateTask = useCallback(
    async (id: number, updates: Partial<Pick<TaskCard, "title" | "category" | "minutes" | "startTime" | "endTime">>) => {
      const supabase = createClient();
      // Optimistic update (re-sort if time changed)
      setCards((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
        if (updates.startTime !== undefined) {
          next.sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
        return next;
      });

      // Map camelCase to snake_case for DB
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.minutes !== undefined) dbUpdates.minutes = updates.minutes;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;

      const { error } = await supabase
        .from("daystack_tasks")
        .update(dbUpdates)
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to update task:", error);
        fetchTasks();
      }
    },
    [userId, fetchTasks]
  );

  const deleteTask = useCallback(
    async (id: number) => {
      const supabase = createClient();
      // Optimistic
      setCards((prev) => prev.filter((c) => c.id !== id));

      const { error } = await supabase
        .from("daystack_tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to delete task:", error);
        fetchTasks();
      }
    },
    [userId, fetchTasks]
  );

  const fetchWeek = useCallback(async (): Promise<TaskCard[]> => {
    const supabase = createClient();
    // Get Monday of current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    const fridayStr = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, "0")}-${String(friday.getDate()).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("daystack_tasks")
      .select("*")
      .eq("user_id", userId)
      .gte("date", mondayStr)
      .lte("date", fridayStr)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Failed to fetch week tasks:", error);
      return [];
    }
    return (data || []).map(dbToCard);
  }, [userId]);

  return { cards, loading, addTask, updateTask, deleteTask, fetchWeek };
}
