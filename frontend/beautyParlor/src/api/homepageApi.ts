import type { HomepageStat } from "../types/homepage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function getHomepageStats(): Promise<HomepageStat[]> {
  const response = await fetch(`${API_BASE_URL}/homepage/stats`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not load homepage stats");
  }

  return data;
}
