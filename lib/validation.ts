import { z } from "zod";

const phone = z.string().trim().regex(/^(\+?234|0)[789][01]\d{8}$/, "Use a Nigerian number, e.g. 08031234567");

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(8, "At least 8 characters").max(100),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password"),
});

export const BusinessSchema = z.object({
  name: z.string().trim().min(2, "Enter the business name").max(80),
  what_we_sell: z.string().trim().min(3, "Say what you sell").max(300),
  city: z.string().trim().min(2, "Enter a city").max(60),
  state: z.string().trim().min(2, "Pick a state").max(40),
  tone: z.enum(["friendly", "formal", "playful", "pidgin-friendly"]),
  whatsapp: phone,
  bank_name: z.string().trim().max(60).optional().transform((v) => v || null),
  account_name: z.string().trim().max(80).optional().transform((v) => v || null),
  account_no: z.string().trim().regex(/^(\d{10})?$/, "Account number is 10 digits").optional().transform((v) => v || null),
  policies: z.string().trim().max(600).optional().transform((v) => v || null),
});

export const ChatSchema = z.object({
  conversationId: z.uuid().nullable(),
  message: z.string().trim().min(1, "Type a message").max(4000, "Keep it under 4,000 characters"),
});

export const InvoiceTextSchema = z.object({
  text: z.string().trim().min(10, "Describe the order in a sentence or two").max(2000),
});

export const InvoiceEditSchema = z.object({
  id: z.uuid(),
  customer_name: z.string().trim().min(1, "Customer name is required").max(80),
  customer_phone: z.string().trim().max(20).optional().transform((v) => v || null),
  delivery_naira: z.coerce.number().min(0).max(10_000_000),
  notes: z.string().trim().max(500).optional().transform((v) => v || null),
  items: z.array(z.object({
    description: z.string().trim().min(1, "Every item needs a description").max(120),
    quantity: z.coerce.number().int("Quantity must be a whole number").min(1).max(10_000),
    unit_naira: z.coerce.number().min(0).max(100_000_000),
  })).min(1, "Add at least one item").max(50),
});

export const StatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["draft", "sent", "paid", "cancelled"]),
});

export const ReplySchema = z.object({
  customer_message: z.string().trim().min(3, "Paste the customer's message").max(2000),
  goal: z.enum(["answer the question", "close the sale", "handle a complaint", "say no politely", "ask for payment"]),
});

export const PostSchema = z.object({
  product: z.string().trim().min(2, "Name the product").max(120),
  details: z.string().trim().max(600).default(""),
});

export const AdminUserSchema = z.object({
  userId: z.uuid(),
  daily_limit: z.coerce.number().int().min(0).max(1000).optional(),
  suspended: z.enum(["true", "false"]).optional(),
});

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
