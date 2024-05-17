/*
  Warnings:

  - The values [function] on the enum `ChatMessageRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChatMessageRole_new" AS ENUM ('user', 'assistant', 'system');
ALTER TABLE "ChatMessage" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "ChatMessage" ALTER COLUMN "role" TYPE "ChatMessageRole_new" USING ("role"::text::"ChatMessageRole_new");
ALTER TYPE "ChatMessageRole" RENAME TO "ChatMessageRole_old";
ALTER TYPE "ChatMessageRole_new" RENAME TO "ChatMessageRole";
DROP TYPE "ChatMessageRole_old";
ALTER TABLE "ChatMessage" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;
