"use client";

import { useActionState, useState } from "react";
import { postAction, replyAction, type PostState, type ReplyState } from "@/app/actions";
import { Field, Submit } from "./Form";

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn-ghost text-sm" onClick={async () => {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }}>
      <span aria-live="polite">{done ? "Copied ✓" : "Copy"}</span>
    </button>
  );
}

function Result({ label, text }: { label: string; text: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">{label}</p>
        <CopyButton text={text} />
      </div>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

export function ReplyWriter() {
  const [state, action] = useActionState<ReplyState, FormData>(replyAction, {});
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={action} className="card space-y-4" noValidate>
        {state.message && <p role="alert" className="alert">{state.message}</p>}
        <Field name="customer_message" label="The customer's message" as="textarea" rows={5}
          placeholder="Good evening, is the blue Ankara still available? How much for 2? Do you deliver to Ikeja?" error={state.errors?.customer_message} />
        <Field name="goal" label="What do you want the reply to do?" as="select" defaultValue="answer the question" error={state.errors?.goal}>
          <option value="answer the question">Answer the question</option>
          <option value="close the sale">Close the sale</option>
          <option value="handle a complaint">Handle a complaint</option>
          <option value="say no politely">Say no politely</option>
          <option value="ask for payment">Ask for payment</option>
        </Field>
        <Submit pending="Writing replies…">Write 3 replies</Submit>
      </form>
      <section aria-live="polite" className="space-y-3">
        {state.result ? state.result.replies.map((r, i) => <Result key={i} label={r.label} text={r.text} />)
          : <p className="text-[var(--muted)]">Your replies will appear here. Anything in [brackets] is a fact the assistant didn't have, so fill it in.</p>}
      </section>
    </div>
  );
}

export function PostWriter() {
  const [state, action] = useActionState<PostState, FormData>(postAction, {});
  const r = state.result;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={action} className="card space-y-4" noValidate>
        {state.message && <p role="alert" className="alert">{state.message}</p>}
        <Field name="product" label="Product" placeholder="Hand-woven Aso-oke set" error={state.errors?.product} />
        <Field name="details" label="Price, colours, offer, anything to mention" as="textarea" rows={4}
          placeholder="₦65,000. Wine and gold. Free gele this week only." error={state.errors?.details} />
        <Submit pending="Writing posts…">Write posts</Submit>
      </form>
      <section aria-live="polite" className="space-y-3">
        {r ? <>
          <Result label="Instagram" text={`${r.instagram}\n\n${r.hashtags.join(" ")}`} />
          <Result label="WhatsApp status" text={r.whatsapp_status} />
          <Result label="X (Twitter)" text={r.x_post} />
        </> : <p className="text-[var(--muted)]">Captions for three platforms will appear here.</p>}
      </section>
    </div>
  );
}
