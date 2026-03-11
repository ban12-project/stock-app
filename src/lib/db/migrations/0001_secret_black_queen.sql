ALTER TABLE `stock_alert` ADD `notifyInterval` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `stock_alert` ADD `lastNotifiedAt` text;