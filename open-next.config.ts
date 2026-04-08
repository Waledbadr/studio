import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  name: "estatecare-cloudflare",
  compatibilityDate: "2024-12-18",
  nodejsCompat: true,
  d1: {
    binding: "D1",
    databaseName: "estatecare",
  },
  r2: {
    binding: "R2_BUCKET",
    bucketName: "estatecare-storage",
  },
});
