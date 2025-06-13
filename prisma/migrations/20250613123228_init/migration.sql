/*
  Warnings:

  - You are about to drop the column `name` on the `TrackTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `TrackTranslation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Track` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Track` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `TrackTranslation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `TrackTranslation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrackTranslation" DROP COLUMN "name",
DROP COLUMN "slug",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Track_slug_key" ON "Track"("slug");
