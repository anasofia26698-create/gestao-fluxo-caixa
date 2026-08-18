CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('access','import','confirmation') NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`userEmail` varchar(320),
	`ipAddress` varchar(64),
	`userAgent` varchar(1024),
	`route` varchar(255) NOT NULL,
	`entryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cashFlowEntries` ADD `auditEventId` int;--> statement-breakpoint
ALTER TABLE `auditEvents` ADD CONSTRAINT `auditEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cashFlowEntries` ADD CONSTRAINT `cashFlowEntries_auditEventId_auditEvents_id_fk` FOREIGN KEY (`auditEventId`) REFERENCES `auditEvents`(`id`) ON DELETE no action ON UPDATE no action;