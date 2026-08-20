CREATE TABLE `cashFlowImportEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importRunId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`debitCents` int NOT NULL,
	CONSTRAINT `cashFlowImportEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cashFlowImportRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditEventId` int,
	`fileName` varchar(255),
	`mappedColumns` text NOT NULL,
	`entryCount` int NOT NULL,
	`periodStart` varchar(10) NOT NULL,
	`periodEnd` varchar(10) NOT NULL,
	`totalDebitCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashFlowImportRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditEvents` MODIFY COLUMN `eventType` enum('access','import','confirmation','simulation') NOT NULL;--> statement-breakpoint
ALTER TABLE `cashFlowImportEntries` ADD CONSTRAINT `cashFlowImportEntries_importRunId_cashFlowImportRuns_id_fk` FOREIGN KEY (`importRunId`) REFERENCES `cashFlowImportRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cashFlowImportRuns` ADD CONSTRAINT `cashFlowImportRuns_auditEventId_auditEvents_id_fk` FOREIGN KEY (`auditEventId`) REFERENCES `auditEvents`(`id`) ON DELETE no action ON UPDATE no action;