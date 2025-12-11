export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@example.com",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  // Cloudflare R2 Storage
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "categorymanagement",
  r2Endpoint: process.env.R2_ENDPOINT ?? "https://14a73ec296e8619d856c15bf5290a433.r2.cloudflarestorage.com",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
};
