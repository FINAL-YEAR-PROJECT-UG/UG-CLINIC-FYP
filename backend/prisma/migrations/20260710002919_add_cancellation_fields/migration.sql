-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancellationNote" VARCHAR(1000),
ADD COLUMN     "cancellationReason" VARCHAR(100);
