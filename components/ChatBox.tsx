"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Give me 3 ideas to sell more this week",
  "How should I price delivery outside my city?",
  "Write a polite message reminding a customer to pay",
];

export default function ChatBox({ conversationId, initial }: { conversationId: string | null; initial: Msg[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const convRef = useRef(conversationId);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setError("");
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convRef.current, message }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      const newId = res.headers.get("X-Conversation-Id");
      // Read the stream and append each piece to the last (assistant) message.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + piece };
          return copy;
        });
      }
      if (!convRef.current && newId) {
        convRef.current = newId;
        router.replace(`/chat/${newId}`, { scroll: false });
      }
      router.refresh(); // update the sidebar and the usage counter
    } catch (e) {
      setMessages((m) => m.slice(0, -1)); // drop the empty assistant bubble
      setError(e instanceof Error ? e.message : "Something went wrong");
      setInput(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex-1 space-y-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="card">
            <p className="eyebrow">Start with</p>
            <div className="mt-3 flex flex-col gap-2">
              {STARTERS.map((s) => (
                <button key={s} type="button" className="btn-ghost text-left" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "bubble-user" : "bubble-ai"}>
            <p className="eyebrow mb-1">{m.role === "user" ? "You" : "Ìrànwọ́"}</p>
            <p className="whitespace-pre-wrap leading-relaxed">
              {m.content || (busy && i === messages.length - 1 ? <span className="cursor">Thinking</span> : "")}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <p role="alert" className="alert mt-4">{error}</p>}

      <form
        className="sticky bottom-0 mt-4 flex gap-2 border-t-2 border-[var(--ink)] bg-[var(--paper)] py-3"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <label htmlFor="msg" className="sr-only">Message</label>
        <textarea
          id="msg"
          className="input min-h-12 flex-1 resize-none"
          rows={2}
          maxLength={4000}
          value={input}
          placeholder="Ask about your business…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
        />
        <button className="btn self-stretch" disabled={busy || !input.trim()}>{busy ? "…" : "Send"}</button>
      </form>
    </div>
  );
}
