-- CreateEnum
CREATE TYPE "ConfirmationType" AS ENUM ('DELETE', 'CHANGEPASSWORD');

-- CreateTable
CREATE TABLE "confirmation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ConfirmationType" NOT NULL,

    CONSTRAINT "confirmation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "confirmation" ADD CONSTRAINT "confirmation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
