CREATE TABLE `cashFlowEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`debitCents` int NOT NULL,
	`source` enum('imported','manual') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashFlowEntries_id` PRIMARY KEY(`id`)
);
