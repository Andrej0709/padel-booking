import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// All login traffic (sign in, sign up, Google redirect, email links) goes through here.
export const { GET, POST } = toNextJsHandler(auth);
