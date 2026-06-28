// Engine ko message bhejne aur response wait karne ka helper
// Har route me baar baar same code na likhna pade isliye ye function banaya

import { v4 as uuidv4 } from "uuid";
import { publisher, subscriber } from "./redis.clients";
import { MESSAGES_QUEUE } from "../config/redis.config";
import { RESPONSE_TIMEOUT } from "../config/app.config";
import type { EngineResponse } from "../types/engine.types";

// sendAndWait: Engine ko message bhejo aur response ka wait karo
// T = response me kaunsa data aayega uska type
// type = message ka type jaise "CREATE_ORDER", "DEPOSIT", etc.
// data = message ke saath kya data bhejnaa hai
export const sendAndWait = async <T = unknown>(
  type: string,
  data: Record<string, unknown>,
): Promise<EngineResponse<T>> => {
  // Step 1: Ek unique clientId generate karo
  // Ye isliye zaroori hai taaki Engine ko pata chale
  // ki response kahan bhejnaa hai
  const clientId = uuidv4();

  // Step 2: Message ko JSON string me convert karo
  // Engine ko type, clientId aur data - ye teen cheezein bhejni hai
  const message = JSON.stringify({ type, clientId, data });

  // Step 3: Redis ke "messages" queue me message daalo (LPUSH)
  // Engine us queue pe BRPOP kar ke baithi hai, usko mil jayega
  await publisher.lPush(MESSAGES_QUEUE, message);

  // Step 4: Ab response ka wait karo
  // Engine kaam karke "response-{clientId}" queue me reply daalegi
  // BRPOP se wait karenge - RESPONSE_TIMEOUT seconds tak
  const responseQueue = `response-${clientId}`;
  const result = await subscriber.brPop(responseQueue, RESPONSE_TIMEOUT);

  // Step 5: Agar timeout ho gaya (Engine ne time pe reply nahi diya)
  if (!result) {
    return { ok: false, message: "Engine timeout - no response" };
  }

  // Step 6: Response ko JSON parse karo
  try {
    // result.element me JSON string hai, usko object me convert karo
    return JSON.parse(result.element) as EngineResponse<T>;
  } catch {
    // Agar parse fail hua toh error bhejo
    return { ok: false, message: "Invalid engine response" };
  }
};
