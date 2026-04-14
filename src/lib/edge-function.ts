import { supabase } from "@/integrations/supabase/client";

interface EdgeFunctionOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  /** Max retry attempts on auth failure (default: 1) */
  maxRetries?: number;
}

/**
 * Call a Supabase edge function with automatic token refresh and retry on 401.
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  options: EdgeFunctionOptions = {}
): Promise<T> {
  const { method = "POST", body, headers = {}, maxRetries = 1 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Always get fresh session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      // Try refreshing session once
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !refreshed.session) {
        throw new Error("Not authenticated. Please sign in again.");
      }
      // Use the refreshed token
      const token = refreshed.session.access_token;
      return await doFetch<T>(functionName, method, token, body, headers);
    }

    try {
      return await doFetch<T>(functionName, method, session.access_token, body, headers);
    } catch (err: any) {
      lastError = err;

      // Only retry on auth errors
      if (err?.status === 401 && attempt < maxRetries) {
        // Force refresh the session before retrying
        const { error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
          throw new Error("Session expired. Please sign in again.");
        }
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error("Edge function call failed");
}

async function doFetch<T>(
  functionName: string,
  method: string,
  accessToken: string,
  body: unknown,
  extraHeaders: Record<string, string>
): Promise<T> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const error: any = new Error(errData?.error || `Edge function failed with status ${response.status}`);
    error.status = response.status;
    error.data = errData;
    throw error;
  }

  return (await response.json()) as T;
}
