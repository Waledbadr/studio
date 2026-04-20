import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  name: "estatecare-materials",
  compatibilityDate: "2024-12-18",
  nodejsCompat: true,
  edgeHooks: {
    // any needed edge hooks
  },
  // externalizing heavy packages to prevent them blowing up bundle
  external: [
    "firebase",
    "firebase-admin",
    "xlsx",
    "html2canvas",
  ],
  d1: {
    binding: "D1",
    databaseName: "estatecare",
  },
  r2: {
    binding: "R2_BUCKET",
    bucketName: "estatecare-storage",
  },
});
