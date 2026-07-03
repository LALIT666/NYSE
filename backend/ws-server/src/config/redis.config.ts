export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Hum sab exchange channels ko pattern subscribe karenge
// Jaise:
// depth@TATA_INR
// trades@TATA_INR
// orders@user-xyz
export const REDIS_CHANNEL_PATTERN = "*@*";
