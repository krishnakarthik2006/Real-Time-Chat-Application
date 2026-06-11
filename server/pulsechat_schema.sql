-- =============================================================
-- PulseChat - Complete MySQL Schema
-- Run this in phpMyAdmin to set up the database from scratch
-- =============================================================

CREATE DATABASE IF NOT EXISTS `real_time_chat_app`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `real_time_chat_app`;

-- ---------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT           AUTO_INCREMENT PRIMARY KEY,
  `name`          VARCHAR(80)   NOT NULL,
  `email`         VARCHAR(120)  NOT NULL UNIQUE,
  `password_hash` VARCHAR(255)  NOT NULL,
  `avatar_seed`   VARCHAR(80)   NOT NULL,
  `last_seen`     DATETIME      NULL,
  `created_at`    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 2. conversations
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `id`         INT          AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(120) NULL,
  `type`       ENUM('direct','group') NOT NULL,
  `created_by` INT          NULL,
  `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_conversations_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 3. conversation_participants
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `conversation_id`      INT    NOT NULL,
  `user_id`              INT    NOT NULL,
  `role`                 ENUM('member','admin') NOT NULL DEFAULT 'member',
  `joined_at`            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_read_message_id` BIGINT NULL,
  PRIMARY KEY (`conversation_id`, `user_id`),
  INDEX `idx_conversation_participants_user_id` (`user_id`),
  CONSTRAINT `fk_cp_conversation`
    FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cp_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 4. messages
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id`                  BIGINT        AUTO_INCREMENT PRIMARY KEY,
  `conversation_id`     INT           NOT NULL,
  `sender_id`           INT           NOT NULL,
  `content`             TEXT          NULL,
  `message_type`        ENUM('text','file') NOT NULL DEFAULT 'text',
  `file_name`           VARCHAR(255)  NULL,
  `file_url`            VARCHAR(500)  NULL,
  `file_size`           INT           NULL,
  `mime_type`           VARCHAR(120)  NULL,
  `status`              ENUM('sent','delivered','seen') NOT NULL DEFAULT 'sent',
  `reply_to_message_id` BIGINT        NULL,
  `is_deleted`          TINYINT(1)    NOT NULL DEFAULT 0,
  `deleted_at`          DATETIME      NULL,
  `edited_at`           DATETIME      NULL,
  `created_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_messages_conversation_id` (`conversation_id`, `id`),
  INDEX `idx_messages_sender_id` (`sender_id`),
  INDEX `idx_messages_reply_to_message_id` (`reply_to_message_id`),
  CONSTRAINT `fk_messages_conversation`
    FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender`
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 5. message_reactions
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `message_reactions` (
  `id`         INT       AUTO_INCREMENT PRIMARY KEY,
  `message_id` BIGINT    NOT NULL,
  `user_id`    INT       NOT NULL,
  `emoji`      VARCHAR(10) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_reaction` (`message_id`, `user_id`, `emoji`),
  INDEX `idx_reactions_message_id` (`message_id`),
  INDEX `idx_reactions_user_id` (`user_id`),
  CONSTRAINT `fk_reactions_message`
    FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reactions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- Done! Database: real_time_chat_app
-- Tables: users, conversations, conversation_participants,
--         messages, message_reactions
-- =============================================================
