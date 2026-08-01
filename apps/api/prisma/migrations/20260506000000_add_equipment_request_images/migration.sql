-- CreateTable
CREATE TABLE "equipment_request_images" (
    "id"         TEXT         NOT NULL,
    "url"        TEXT         NOT NULL,
    "requestId"  TEXT         NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_request_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_request_images_requestId_idx" ON "equipment_request_images"("requestId");

-- AddForeignKey
ALTER TABLE "equipment_request_images"
    ADD CONSTRAINT "equipment_request_images_requestId_fkey"
    FOREIGN KEY ("requestId")
    REFERENCES "equipment_requests"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
