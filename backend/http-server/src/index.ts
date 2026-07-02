import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createClient, type RedisClientType } from "redis";
import { getPrisma } from "db";

// ==================== CONFIG ====================
const PORT = 3000;
const JWT_SECRET = "super-secret-key-change-in-env";
const REDIS_URL = "redis://localhost:6379";
const MESSAGES_QUEUE = "messages";
const RESPONSE_TIMEOUT = 5;

// ==================== TYPES ====================
interface JwtPayload {
  userId: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

interface EngineSuccess<T = unknown> {
  ok: true;
  data: T;
}
interface EngineError {
  ok: false;
  message: string;
}
type EngineResponse<T = unknown> = EngineSuccess<T> | EngineError;

// ==================== PRISMA ====================
const prisma = getPrisma();

// ==================== REDIS CLIENTS ====================
const publisher: RedisClientType = createClient({ url: REDIS_URL });
const subscriber: RedisClientType = createClient({ url: REDIS_URL });

publisher.on("error", (err) => console.error("Publisher error:", err));
subscriber.on("error", (err) => console.error("Subscriber error:", err));

// ==================== ZOD SCHEMAS ====================
const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const OrderSchema = z.object({
  kind: z.enum(["buy", "sell"]),
  type: z.enum(["limit", "market"]),
  price: z.number().positive(),
  quantity: z.number().positive(),
  market: z.enum(["TATA_INR", "PAYTM_INR", "ZOMATO_INR"]),
});

const DepositSchema = z.object({
  asset: z.enum(["INR", "TATA", "PAYTM", "ZOMATO"]),
  amount: z.number().positive(),
});

const WithdrawSchema = z.object({
  asset: z.enum(["INR", "TATA", "PAYTM", "ZOMATO"]),
  amount: z.number().positive(),
});

const KlineQuerySchema = z.object({
  interval: z.enum(["1m", "5m", "1h", "1d"]).default("1h"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
});

// ==================== ENGINE COMMUNICATION ====================
const sendAndWait = async <T = unknown>(
  type: string,
  data: Record<string, unknown>,
): Promise<EngineResponse<T>> => {
  const clientId = uuidv4();
  const message = JSON.stringify({ type, clientId, data });

  await publisher.lPush(MESSAGES_QUEUE, message);

  const responseQueue = `response-${clientId}`;
  const result = await subscriber.brPop(responseQueue, RESPONSE_TIMEOUT);

  if (!result) {
    return { ok: false, message: "Engine timeout - no response" };
  }

  try {
    return JSON.parse(result.element) as EngineResponse<T>;
  } catch {
    return { ok: false, message: "Invalid engine response" };
  }
};

// ==================== APP SETUP ====================
const app = express();
app.use(express.json());

// ==================== MIDDLEWARE ====================
const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token missing" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token!, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ==================== AUTH ROUTES ====================

// 1. Signup - ab DB me save hoga
app.post(
  "/api/v1/auth/signup",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const { email, password } = parsed.data;

    try {
      // Check exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ message: "User already exists" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: { email, passwordHash },
      });

      // Engine ko balance init karne ko bolo (DB me 4 entries banayega)
      await sendAndWait("INIT_BALANCE", { userId: newUser.userId });

      res.status(201).json({
        message: "User created",
        userId: newUser.userId,
      });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// 2. Signin
app.post(
  "/api/v1/auth/signin",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = SigninSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const { email, password } = parsed.data;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const payload: JwtPayload = { userId: user.userId, email: user.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

      res.json({ token });
    } catch (err) {
      console.error("Signin error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// 3. Current user
app.get(
  "/api/v1/auth/me",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { userId: req.user!.userId },
        select: { userId: true, email: true, createdAt: true },
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json(user);
    } catch (err) {
      console.error("Me error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ==================== BALANCE ROUTES ====================

app.get(
  "/api/v1/balance",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_BALANCE", {
      userId: req.user!.userId,
    });
    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

app.post(
  "/api/v1/balance/deposit",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = DepositSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const result = await sendAndWait("DEPOSIT", {
      userId: req.user!.userId,
      asset: parsed.data.asset,
      amount: parsed.data.amount,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json({ message: "Deposit successful", ...(result.data as object) });
  },
);

app.post(
  "/api/v1/balance/withdraw",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = WithdrawSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const result = await sendAndWait("WITHDRAW", {
      userId: req.user!.userId,
      asset: parsed.data.asset,
      amount: parsed.data.amount,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json({ message: "Withdraw successful", ...(result.data as object) });
  },
);

// ==================== ORDER ROUTES ====================

app.post(
  "/api/v1/order",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = OrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid input", errors: parsed.error.issues });
      return;
    }

    const result = await sendAndWait("CREATE_ORDER", {
      userId: req.user!.userId,
      kind: parsed.data.kind,
      orderType: parsed.data.type,
      price: parsed.data.price,
      quantity: parsed.data.quantity,
      market: parsed.data.market,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.status(201).json(result.data);
  },
);

app.get(
  "/api/v1/order/:orderId",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_ORDER", {
      userId: req.user!.userId,
      orderId: req.params.orderId,
    });

    if (!result.ok) {
      const code = result.message === "Order not found" ? 404 : 403;
      res.status(code).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

app.delete(
  "/api/v1/order/:orderId",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("CANCEL_ORDER", {
      userId: req.user!.userId,
      orderId: req.params.orderId,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json({ message: "Order cancelled", ...(result.data as object) });
  },
);

app.get(
  "/api/v1/orders/open",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_OPEN_ORDERS", {
      userId: req.user!.userId,
    });
    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

app.get(
  "/api/v1/orders/history",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_ORDER_HISTORY", {
      userId: req.user!.userId,
    });
    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

// ==================== MARKET DATA ROUTES ====================

app.get("/api/v1/markets", (_req: Request, res: Response): void => {
  res.json({ markets: ["TATA_INR", "PAYTM_INR", "ZOMATO_INR"] });
});

app.get(
  "/api/v1/depth/:market",
  async (req: Request, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_DEPTH", {
      market: req.params.market,
    });
    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

app.get(
  "/api/v1/ticker/:market",
  async (req: Request, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_TICKER", {
      market: req.params.market,
    });
    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

app.get(
  "/api/v1/trades/:market",
  async (req: Request, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_TRADES", {
      market: req.params.market,
    });
    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

app.get(
  "/api/v1/user/trades",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await sendAndWait("GET_USER_TRADES", {
      userId: req.user!.userId,
    });
    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

app.get(
  "/api/v1/klines/:market",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = KlineQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid query", errors: parsed.error.issues });
      return;
    }

    const result = await sendAndWait("GET_KLINES", {
      market: req.params.market,
      interval: parsed.data.interval,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      limit: parsed.data.limit,
    });

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }
    res.json(result.data);
  },
);

// ==================== START ====================
const start = async (): Promise<void> => {
  await publisher.connect();
  await subscriber.connect();
  console.log("✅ Redis connected");

  await prisma.$connect();
  console.log("✅ Prisma (Postgres) connected");

  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  await publisher.quit();
  await subscriber.quit();
  process.exit(0);
});
