CREATE TABLE `agent_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`documentVersionId` int,
	`userId` int NOT NULL,
	`agentType` enum('director','voice_analyst','critic') NOT NULL,
	`agentName` varchar(128),
	`prompt` text,
	`response` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`documentVersionId` int,
	`userId` int NOT NULL,
	`format` enum('pdf','docx') NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`wordCount` int DEFAULT 0,
	`charCount` int DEFAULT 0,
	`versionLabel` varchar(128),
	`isAutosave` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`genre` varchar(128),
	`description` text,
	`status` enum('draft','in_review','completed','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
