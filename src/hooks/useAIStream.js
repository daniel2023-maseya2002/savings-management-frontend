// src/hooks/useAIStream.js
import { useCallback, useRef } from "react";

/**
 * useAIStream
 *
 * Handles sending a message to a streaming AI endpoint (SSE) via fetch + ReadableStream.
 * This approach supports POST requests properly (unlike EventSourcePolyfill).
 * Returns { sendMessage, abort }.
 */
export default function useAIStream() {
  const abortControllerRef = useRef(null);
  const readerRef = useRef(null);

  const maskToken = (t) => {
    if (!t) return null;
    if (t.length <= 12) return t.replace(/.(?=.{4})/g, "*");
    return `${t.slice(0, 6)}…${t.slice(-4)}`;
  };

  /**
   * Resolve a relative URL into a full absolute URL using env config.
   * - Supports VITE_API_BASE or VITE_API_BASE_URL environment variable.
   * - Avoids duplicating "/api" if base already contains it and rel starts with it.
   */
  const resolveFullUrl = (rel) => {
    // Try both common env names
    const envBase =
      import.meta.env.VITE_API_BASE ??
      import.meta.env.VITE_API_BASE_URL ??
      window.location.origin;

    const base = String(envBase || window.location.origin).trim();

    // If rel is already absolute, return it untouched
    if (/^https?:\/\//i.test(rel)) return rel;

    // Strip trailing slashes from base and leading slashes from rel
    const cleanBase = base.replace(/\/+$/, "");
    const cleanRel = rel.replace(/^\/+/, "");

    // Avoid duplicating 'api' segment
    if (/\/api$/i.test(cleanBase) && /^api\//i.test(cleanRel)) {
      const relWithoutApi = cleanRel.replace(/^api\//i, "");
      return `${cleanBase}/${relWithoutApi}`;
    }

    return `${cleanBase}/${cleanRel}`;
  };

  /**
   * Parse a single SSE frame string like:
   * data: {"type":"chunk","text":"..."}\n\n
   */
  const parseSSEFrame = (frame) => {
    const lines = frame.split("\n");
    const dataLines = lines
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim());
    
    if (dataLines.length === 0) return null;
    
    const joined = dataLines.join("\n");
    try {
      return JSON.parse(joined);
    } catch {
      // If not JSON, treat as plain text chunk
      return { type: "chunk", text: joined };
    }
  };

  /**
   * Fallback to non-streaming POST endpoint
   */
  const postNonStream = async ({ url, accessToken, body, onDone, onError }) => {
    try {
      const full = resolveFullUrl(url);
      const headers = { "Content-Type": "application/json" };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const resp = await fetch(full, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        const err = new Error(errJson?.detail ?? `Non-stream failed: ${resp.status}`);
        onError?.(err);
        return { ok: false, error: err };
      }

      const data = await resp.json();
      const finalText = data.reply ?? data.text ?? data.message ?? JSON.stringify(data);
      onDone?.({ text: finalText, model: data.model ?? data.used_model ?? null, raw: data });
      return { ok: true, response: data };
    } catch (err) {
      onError?.(err);
      return { ok: false, error: err };
    }
  };

  /**
   * Main streaming function using fetch + ReadableStream
   */
  const sendMessage = useCallback(
    async ({
      accessToken,
      message,
      mode = "general",
      conversationId = null,
      onChunk = () => {},
      onMeta = () => {},
      onDone = () => {},
      onError = () => {},
      url = "/api/ai/assistant/stream/",
    }) => {
      // Abort any previous stream
      abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const body = { mode, message };
      if (conversationId) body.conversation_id = conversationId;

      const streamUrl = resolveFullUrl(url);

      try {
        console.debug(
          "[useAIStream] starting fetch POST to:",
          streamUrl,
          "token:",
          maskToken(accessToken)
        );

        const headers = { "Content-Type": "application/json" };
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch(streamUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          // Handle HTTP errors
          const errorText = await response.text().catch(() => "");
          let errorMessage = `Stream request failed: ${response.status}`;
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }

          const err = new Error(errorMessage);
          onError(err);

          // Try fallback to non-streaming endpoint
          console.debug("[useAIStream] stream failed, trying non-stream fallback");
          return await postNonStream({
            url: "/api/ai/assistant/",
            accessToken,
            body,
            onDone,
            onError,
          });
        }

        // Check if response is actually SSE
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/event-stream")) {
          console.warn(
            "[useAIStream] Expected text/event-stream but got:",
            contentType
          );
          // Try to parse as regular JSON response
          try {
            const data = await response.json();
            const finalText = data.reply ?? data.text ?? data.message ?? JSON.stringify(data);
            onDone({ text: finalText, model: data.model ?? data.used_model ?? null });
            return { ok: true, response: data };
          } catch {
            // Fall through to stream processing anyway
          }
        }

        // Process the SSE stream
        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.debug("[useAIStream] stream completed (done=true)");
              break;
            }

            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE frames (separated by \n\n)
            const frames = buffer.split("\n\n");
            // Keep the last incomplete frame in the buffer
            buffer = frames.pop() || "";

            for (const frame of frames) {
              if (!frame.trim()) continue;

              // Skip comment lines (heartbeat)
              if (frame.startsWith(":")) {
                continue;
              }

              const parsed = parseSSEFrame(frame);
              if (!parsed) continue;

              // Handle different event types
              if (parsed.type === "chunk") {
                onChunk(parsed.text || "");
              } else if (parsed.type === "meta") {
                onMeta(parsed);
              } else if (parsed.type === "done") {
                onDone(parsed);
              } else if (parsed.type === "error") {
                onError(new Error(parsed.message || "AI streaming error"));
              } else {
                // Unknown type, treat as chunk
                onChunk(JSON.stringify(parsed));
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            const parsed = parseSSEFrame(buffer);
            if (parsed && parsed.type === "done") {
              onDone(parsed);
            }
          }

          return { ok: true };
        } finally {
          // Clean up reader
          try {
            reader.releaseLock();
          } catch {}
          readerRef.current = null;
        }
      } catch (err) {
        // Handle abort or network errors
        if (err.name === "AbortError") {
          console.debug("[useAIStream] Stream aborted by user");
          return { ok: false, error: new Error("Stream aborted"), aborted: true };
        }

        console.error("[useAIStream] Stream error:", err);

        // Try fallback to non-streaming endpoint
        console.debug("[useAIStream] attempting non-stream fallback after error");
        const fallback = await postNonStream({
          url: "/api/ai/assistant/",
          accessToken,
          body,
          onDone,
          onError,
        });

        if (!fallback.ok) {
          return { ok: false, error: fallback.error };
        }

        return { ok: true, fallback: true, response: fallback.response };
      }
    },
    []
  );

  /**
   * Abort any active stream
   */
  const abort = useCallback(() => {
    // Cancel the reader if active
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch (err) {
        console.warn("[useAIStream] Error cancelling reader:", err);
      }
      readerRef.current = null;
    }

    // Abort the fetch request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (err) {
        console.warn("[useAIStream] Error aborting controller:", err);
      }
      abortControllerRef.current = null;
    }
  }, []);

  return { sendMessage, abort };
}