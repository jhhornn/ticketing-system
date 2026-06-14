-- CreateTable
CREATE TABLE "audit_logs" (
    "audit_log_id" BIGSERIAL NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "changes" TEXT,
    "performed_by" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(45),
    "metadata" TEXT,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_user" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "idx_audit_timestamp" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "audit_logs"("action");
