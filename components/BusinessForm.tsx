"use client";

import { useActionState } from "react";
import { saveBusiness, type FormState } from "@/app/actions";
import { Field, Submit } from "./Form";
import { STATES } from "@/lib/states";
import type { Business } from "@/lib/auth";

export default function BusinessForm({ business, from }: { business?: Business; from: "onboarding" | "settings" }) {
  const [state, action] = useActionState<FormState, FormData>(saveBusiness, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="from" value={from} />
      {state.message && <p role="status" className="ok">{state.message}</p>}

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-2">The basics</legend>
        <Field name="name" label="Business name" defaultValue={business?.name} required error={e.name} />
        <Field name="what_we_sell" label="What do you sell?" as="textarea" rows={2} defaultValue={business?.what_we_sell}
          hint="e.g. Ankara fabrics, gele and ready-made outfits for women" required error={e.what_we_sell} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="city" label="City" defaultValue={business?.city} required error={e.city} />
          <Field name="state" label="State" as="select" defaultValue={business?.state ?? "Lagos"} error={e.state}>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="whatsapp" label="WhatsApp number" type="tel" inputMode="tel" defaultValue={business?.whatsapp} placeholder="08031234567" required error={e.whatsapp} />
          <Field name="tone" label="How should replies sound?" as="select" defaultValue={business?.tone ?? "friendly"} error={e.tone}>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="playful">Playful</option>
            <option value="pidgin-friendly">Friendly, a little Pidgin</option>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-2">Shown on invoices (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="bank_name" label="Bank" defaultValue={business?.bank_name ?? ""} error={e.bank_name} />
          <Field name="account_name" label="Account name" defaultValue={business?.account_name ?? ""} error={e.account_name} />
          <Field name="account_no" label="Account number" inputMode="numeric" maxLength={10} defaultValue={business?.account_no ?? ""} error={e.account_no} />
        </div>
        <Field name="policies" label="Delivery, returns, opening hours" as="textarea" rows={3} defaultValue={business?.policies ?? ""}
          hint="The assistant uses this when answering customers, and never makes up policies you haven't written." error={e.policies} />
      </fieldset>

      <Submit pending="Saving…">{from === "onboarding" ? "Finish setup" : "Save changes"}</Submit>
    </form>
  );
}
