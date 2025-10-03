-- Create submission table
CREATE TABLE IF NOT EXISTS "Submission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" VARCHAR(320),
  "payload" JSONB NOT NULL,
  "consent" BOOLEAN NOT NULL,
  "ipHash" VARCHAR(128),
  "userAgent" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index to speed up chronological queries
CREATE INDEX IF NOT EXISTS "Submission_createdAt_idx" ON "Submission" ("createdAt");
