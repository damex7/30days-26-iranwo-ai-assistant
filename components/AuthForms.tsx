"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup, type FormState } from "@/app/actions";
import { Field, Submit } from "./Form";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <p role="alert" className="alert">{state.message}</p>}
      <Field name="email" label="Email" type="email" autoComplete="email" required error={state.errors?.email} />
      <Field name="password" label="Password" type="password" autoComplete="current-password" required error={state.errors?.password} />
      <Submit pending="Logging in…">Log in</Submit>
      <p className="text-sm">New here? <Link className="underline" href="/signup">Create an account</Link></p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<FormState, FormData>(signup, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <p role="alert" className="alert">{state.message}</p>}
      <Field name="name" label="Your name" autoComplete="name" required error={state.errors?.name} />
      <Field name="email" label="Email" type="email" autoComplete="email" required error={state.errors?.email} />
      <Field name="password" label="Password" type="password" autoComplete="new-password" required hint="At least 8 characters" error={state.errors?.password} />
      <Submit pending="Creating…">Create account</Submit>
      <p className="text-sm">Have an account? <Link className="underline" href="/login">Log in</Link></p>
    </form>
  );
}
