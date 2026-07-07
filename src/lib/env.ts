import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // ⚠ next-runtime: NODE_ENV darf NICHT gesetzt sein während `next dev`, sonst:
  //   "non-standard NODE_ENV value" — wir inferieren aus dem Runner.
  //   Falls process.env.NODE_ENV nicht in den 3 Werten: fallback auf 'development'.
});

const rawNodeEnv = process.env.NODE_ENV;
const candidate =
  rawNodeEnv === "development" || rawNodeEnv === "test" || rawNodeEnv === "production"
    ? rawNodeEnv
    : "development";

const parsed = schema.safeParse({ ...process.env, NODE_ENV: candidate });
if (!parsed.success) {
  console.error("[env] ❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
