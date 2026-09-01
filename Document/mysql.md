/*创建数据库*/
CREATE DATABASE study_job_system

/*选择数据库*/
USE study_job_system

/*创建用户表*/
CREATE TABLE `users` (
  `user_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `avatar_url` VARCHAR(500) COMMENT '头像URL',
  `total_points` INT NOT NULL DEFAULT 0 COMMENT '总积分',
  `role` ENUM('child', 'admin') NOT NULL DEFAULT 'child' COMMENT '角色',
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active' COMMENT '状态',
  `homework_target_minutes` INT NOT NULL DEFAULT 60 COMMENT '作业目标分钟数',
  `game_target_minutes` INT NOT NULL DEFAULT 30 COMMENT '游戏目标分钟数',
  `daily_task_reminder` BOOLEAN DEFAULT TRUE COMMENT '每日任务提醒开关',
  `last_login_at` DATETIME COMMENT '最后登录时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

/*创建任务模板表*/
CREATE TABLE `task_templates` (
  `template_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `title` VARCHAR(100) NOT NULL COMMENT '任务标题',
  `description` TEXT COMMENT '任务描述',
  `default_points` INT NOT NULL DEFAULT 10 COMMENT '默认积分',
  `category` VARCHAR(50) COMMENT '分类（家务/学习/运动/习惯等）',
  `is_daily_repeat` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否每日重复',
  `icon` VARCHAR(50) COMMENT '图标标识',
  `color` VARCHAR(20) COMMENT '颜色标识',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
  `created_by` CHAR(36) COMMENT '创建人（管理员ID）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_is_active` (`is_active`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务模板表';

/*创建任务表*/
CREATE TABLE `tasks` (
  `task_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL COMMENT '所属用户',
  `template_id` CHAR(36) NULL COMMENT '关联模板ID（如果来自模板）',
  `title` VARCHAR(100) NOT NULL COMMENT '任务标题',
  `description` TEXT COMMENT '任务描述',
  `points` INT NOT NULL DEFAULT 10 COMMENT '积分值',
  `status` ENUM('pending', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `date` DATE NOT NULL COMMENT '任务日期',
  `completed_at` DATETIME COMMENT '完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_date` (`user_id`, `date`),
  INDEX `idx_user_status` (`user_id`, `status`),
  INDEX `idx_date` (`date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`template_id`) REFERENCES `task_templates`(`template_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';

/*创建时间记录表*/
CREATE TABLE `time_records` (
  `record_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL COMMENT '所属用户',
  `activity_type` ENUM('homework', 'game', 'reading', 'exercise', 'other') NOT NULL COMMENT '活动类型',
  `duration_minutes` INT NOT NULL COMMENT '持续分钟数',
  `date` DATE NOT NULL COMMENT '记录日期',
  `start_time` TIME COMMENT '开始时间',
  `end_time` TIME COMMENT '结束时间',
  `is_target_reached` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否达标',
  `target_minutes` INT NOT NULL COMMENT '当时的目标分钟数（快照）',
  `note` VARCHAR(200) COMMENT '备注',
  `source` ENUM('timer', 'manual') NOT NULL DEFAULT 'manual' COMMENT '记录来源',
  `session_id` CHAR(36) COMMENT '计时会话ID（用于关联开始结束）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_date` (`user_id`, `date`),
  INDEX `idx_user_type_date` (`user_id`, `activity_type`, `date`),
  INDEX `idx_date` (`date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='时间记录表';

/*计时会话表*/
CREATE TABLE `timer_sessions` (
  `session_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL COMMENT '所属用户',
  `activity_type` ENUM('homework', 'game', 'reading', 'exercise', 'other') NOT NULL COMMENT '活动类型',
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `ended_at` DATETIME COMMENT '结束时间',
  `status` ENUM('running', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'running' COMMENT '状态',
  `paused_duration_seconds` INT NOT NULL DEFAULT 0 COMMENT '已暂停总秒数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_status` (`user_id`, `status`),
  INDEX `idx_user_started` (`user_id`, `started_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计时会话表';

/*创建商品表*/
CREATE TABLE `products` (
  `product_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(100) NOT NULL COMMENT '商品名称',
  `description` TEXT COMMENT '商品描述',
  `price_points` INT NOT NULL COMMENT '所需积分',
  `category` ENUM('toy', 'game_time', 'activity', 'food', 'book', 'other') NOT NULL COMMENT '商品分类',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '库存数量（-1表示无限）',
  `image_url` VARCHAR(500) COMMENT '商品图片URL',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否上架',
  `is_virtual` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否虚拟商品',
  `virtual_value` INT COMMENT '虚拟商品值（如游戏分钟数）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序权重',
  `created_by` CHAR(36) COMMENT '创建人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category_active` (`category`, `is_active`),
  INDEX `idx_price` (`price_points`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

/*创建购物车表*/
CREATE TABLE `carts` (
  `cart_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL UNIQUE COMMENT '所属用户（一个用户一个购物车）',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车主表';

/*创建购物车项表*/
CREATE TABLE `cart_items` (
  `cart_item_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `cart_id` CHAR(36) NOT NULL COMMENT '所属购物车',
  `product_id` CHAR(36) NOT NULL COMMENT '商品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_cart_product` (`cart_id`, `product_id`),
  INDEX `idx_product` (`product_id`),
  FOREIGN KEY (`cart_id`) REFERENCES `carts`(`cart_id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车项表';

/*创建兑换记录表*/
CREATE TABLE `redemptions` (
  `redemption_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL COMMENT '兑换用户',
  `product_id` CHAR(36) NOT NULL COMMENT '商品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `total_points_used` INT NOT NULL COMMENT '使用的总积分',
  `status` ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `reject_reason` VARCHAR(200) COMMENT '拒绝原因',
  `admin_notes` TEXT COMMENT '管理员备注',
  `processed_by` CHAR(36) COMMENT '处理人（管理员ID）',
  `processed_at` DATETIME COMMENT '处理时间',
  `delivered_at` DATETIME COMMENT '发放时间（实物）',
  `virtual_activated_at` DATETIME COMMENT '虚拟商品激活时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_status` (`user_id`, `status`),
  INDEX `idx_status_created` (`status`, `created_at`),
  INDEX `idx_processed_by` (`processed_by`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT,
  FOREIGN KEY (`processed_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='兑换记录表';

/*创建积分流失表*/
CREATE TABLE `point_logs` (
  `log_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL COMMENT '所属用户',
  `change_amount` INT NOT NULL COMMENT '变动金额（正数增加，负数减少）',
  `balance_after` INT NOT NULL COMMENT '变动后余额',
  `source_type` ENUM('task_complete', 'redemption', 'admin_adjust', 'bonus', 'penalty', 'system') NOT NULL COMMENT '来源类型',
  `source_id` CHAR(36) COMMENT '来源ID（如任务ID、兑换ID）',
  `description` VARCHAR(200) COMMENT '描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_created` (`user_id`, `created_at`),
  INDEX `idx_source` (`source_type`, `source_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分流水表';

/*创建系统配置表*/
CREATE TABLE `system_configs` (
  `config_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  `config_value` TEXT NOT NULL COMMENT '配置值',
  `config_type` ENUM('string', 'int', 'boolean', 'json') NOT NULL DEFAULT 'string' COMMENT '配置类型',
  `description` VARCHAR(200) COMMENT '描述',
  `is_public` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否前端可读',
  `updated_by` CHAR(36) COMMENT '更新人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

/*创建通知表*/
CREATE TABLE `notifications` (
  `notification_id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL COMMENT '接收用户',
  `type` ENUM('task_reminder', 'time_target_reached', 'time_warning', 'redemption_approved', 'redemption_rejected', 'redemption_completed', 'system') NOT NULL COMMENT '通知类型',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已读',
  `read_at` DATETIME COMMENT '阅读时间',
  `action_url` VARCHAR(500) COMMENT '跳转链接',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_read` (`user_id`, `is_read`),
  INDEX `idx_user_created` (`user_id`, `created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

/*今日概览视图*/
CREATE VIEW `v_user_today_overview` AS
SELECT
  u.user_id,
  u.username,
  u.total_points,
  -- 今日任务统计
  COALESCE(t.today_tasks, 0) AS today_tasks,
  COALESCE(t.today_completed, 0) AS today_completed,
  COALESCE(t.today_completed_points, 0) AS today_earned_points,
  -- 今日时间统计
  COALESCE(hw.today_homework_minutes, 0) AS today_homework_minutes,
  COALESCE(g.today_game_minutes, 0) AS today_game_minutes,
  -- 达标状态
  CASE WHEN COALESCE(hw.today_homework_minutes, 0) >= u.homework_target_minutes
       THEN 1 ELSE 0 END AS homework_target_reached,
  CASE WHEN COALESCE(g.today_game_minutes, 0) >= u.game_target_minutes
       THEN 1 ELSE 0 END AS game_target_reached,
  -- 完成率
  CASE WHEN COALESCE(t.today_tasks, 0) > 0
       THEN ROUND(COALESCE(t.today_completed, 0) * 100.0 / t.today_tasks, 1)
       ELSE 0 END AS completion_rate,
  -- 今日兑换数
  COALESCE(r.today_redemptions, 0) AS today_redemptions,
  -- 未读通知数
  COALESCE(n.unread_count, 0) AS unread_notifications
FROM `users` u
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS today_tasks,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS today_completed,
    SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END) AS today_completed_points
  FROM `tasks`
  WHERE date = CURDATE()
  GROUP BY user_id
) t ON u.user_id = t.user_id
LEFT JOIN (
  SELECT user_id, SUM(duration_minutes) AS today_homework_minutes
  FROM `time_records`
  WHERE date = CURDATE() AND activity_type = 'homework'
  GROUP BY user_id
) hw ON u.user_id = hw.user_id
LEFT JOIN (
  SELECT user_id, SUM(duration_minutes) AS today_game_minutes
  FROM `time_records`
  WHERE date = CURDATE() AND activity_type = 'game'
  GROUP BY user_id
) g ON u.user_id = g.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS today_redemptions
  FROM `redemptions`
  WHERE DATE(created_at) = CURDATE()
  GROUP BY user_id
) r ON u.user_id = r.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS unread_count
  FROM `notifications`
  WHERE is_read = FALSE
  GROUP BY user_id
) n ON u.user_id = n.user_id
WHERE u.role = 'child';

/*本周趋势图*/
CREATE VIEW `v_user_weekly_stats` AS
SELECT
  u.user_id,
  u.username,
  DATE(d.date) AS stat_date,
  DAYOFWEEK(d.date) AS day_of_week,
  -- 当日任务
  COALESCE(t.daily_tasks, 0) AS daily_tasks,
  COALESCE(t.daily_completed, 0) AS daily_completed,
  COALESCE(t.daily_points, 0) AS daily_points,
  -- 当日时间
  COALESCE(hw.daily_homework, 0) AS daily_homework_minutes,
  COALESCE(g.daily_game, 0) AS daily_game_minutes,
  -- 当日积分变化（净增）
  COALESCE(pl.daily_point_change, 0) AS daily_point_change,
  -- 截止当日的累计积分
  (SELECT total_points FROM users WHERE user_id = u.user_id) -
  COALESCE((
    SELECT SUM(change_amount) FROM point_logs
    WHERE user_id = u.user_id AND DATE(created_at) > d.date
  ), 0) AS cumulative_points_at_date,
  -- 当日兑换数
  COALESCE(r.daily_redemptions, 0) AS daily_redemptions,
  -- 作业达标天数（本周累计）
  CASE WHEN COALESCE(hw.daily_homework, 0) >= u.homework_target_minutes THEN 1 ELSE 0 END AS homework_target_met
FROM `users` u
CROSS JOIN (
  -- 生成本周7天的日期
  SELECT DATE_ADD(CURDATE(), INTERVAL -6 DAY) AS date UNION ALL
  SELECT DATE_ADD(CURDATE(), INTERVAL -5 DAY) UNION ALL
  SELECT DATE_ADD(CURDATE(), INTERVAL -4 DAY) UNION ALL
  SELECT DATE_ADD(CURDATE(), INTERVAL -3 DAY) UNION ALL
  SELECT DATE_ADD(CURDATE(), INTERVAL -2 DAY) UNION ALL
  SELECT DATE_ADD(CURDATE(), INTERVAL -1 DAY) UNION ALL
  SELECT CURDATE()
) d
LEFT JOIN (
  SELECT user_id, date,
    COUNT(*) AS daily_tasks,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS daily_completed,
    SUM(CASE WHEN status = 'completed' THEN points ELSE 0 END) AS daily_points
  FROM tasks
  WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
  GROUP BY user_id, date
) t ON u.user_id = t.user_id AND d.date = t.date
LEFT JOIN (
  SELECT user_id, date,
    SUM(CASE WHEN activity_type = 'homework' THEN duration_minutes ELSE 0 END) AS daily_homework,
    SUM(CASE WHEN activity_type = 'game' THEN duration_minutes ELSE 0 END) AS daily_game
  FROM time_records
  WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
  GROUP BY user_id, date
) hw ON u.user_id = hw.user_id AND d.date = hw.date
LEFT JOIN (
  SELECT user_id, date,
    SUM(CASE WHEN activity_type = 'game' THEN duration_minutes ELSE 0 END) AS daily_game
  FROM time_records
  WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
  GROUP BY user_id, date
) g ON u.user_id = g.user_id AND d.date = g.date
LEFT JOIN (
  SELECT user_id, DATE(created_at) AS date, SUM(change_amount) AS daily_point_change
  FROM point_logs
  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
  GROUP BY user_id, DATE(created_at)
) pl ON u.user_id = pl.user_id AND d.date = pl.date
LEFT JOIN (
  SELECT user_id, DATE(created_at) AS date, COUNT(*) AS daily_redemptions
  FROM redemptions
  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
  GROUP BY user_id, DATE(created_at)
) r ON u.user_id = r.user_id AND d.date = r.date
WHERE u.role = 'child';

/*月度汇总图*/
CREATE VIEW `v_user_monthly_stats` AS
SELECT
  u.user_id,
  u.username,
  DATE_FORMAT(m.month_date, '%Y-%m') AS month,
  -- 月度任务统计
  COALESCE(t.monthly_tasks, 0) AS monthly_tasks,
  COALESCE(t.monthly_completed, 0) AS monthly_completed,
  COALESCE(t.monthly_points_earned, 0) AS monthly_points_earned,
  -- 月度时间统计
  COALESCE(hw.monthly_homework_minutes, 0) AS monthly_homework_minutes,
  COALESCE(hw.monthly_game_minutes, 0) AS monthly_game_minutes,
  -- 月度兑换统计
  COALESCE(r.monthly_redemptions, 0) AS monthly_redemptions,
  COALESCE(r.monthly_points_spent, 0) AS monthly_points_spent,
  -- 月度净积分变化
  COALESCE(pl.monthly_net_change, 0) AS monthly_net_points_change,
  -- 月度完成率
  CASE WHEN COALESCE(t.monthly_tasks, 0) > 0
       THEN ROUND(COALESCE(t.monthly_completed, 0) * 100.0 / t.monthly_tasks, 1)
       ELSE 0 END AS monthly_completion_rate,
  -- 月度达标天数
  COALESCE(hw.homework_target_days, 0) AS homework_target_days,
  COALESCE(hw.game_under_limit_days, 0) AS game_under_limit_days
FROM `users` u
CROSS JOIN (
  SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m-01') AS month_date
  FROM (
    SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
    UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
    UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
  ) numbers
) m
LEFT JOIN (
  SELECT
    t.user_id,
    DATE_FORMAT(t.date, '%Y-%m') AS month,
    COUNT(*) AS monthly_tasks,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS monthly_completed,
    SUM(CASE WHEN t.status = 'completed' THEN t.points ELSE 0 END) AS monthly_points_earned
  FROM tasks t
  WHERE t.date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
  GROUP BY t.user_id, DATE_FORMAT(t.date, '%Y-%m')
) t ON u.user_id = t.user_id AND DATE_FORMAT(m.month_date, '%Y-%m') = t.month
LEFT JOIN (
  SELECT
    tr.user_id,
    DATE_FORMAT(tr.date, '%Y-%m') AS month,
    SUM(CASE WHEN tr.activity_type = 'homework' THEN tr.duration_minutes ELSE 0 END) AS monthly_homework_minutes,
    SUM(CASE WHEN tr.activity_type = 'game' THEN tr.duration_minutes ELSE 0 END) AS monthly_game_minutes,
    COUNT(DISTINCT CASE
      WHEN tr.activity_type = 'homework' AND tr.duration_minutes >= u2.homework_target_minutes
      THEN tr.date
    END) AS homework_target_days,
    COUNT(DISTINCT CASE
      WHEN tr.activity_type = 'game' AND tr.duration_minutes <= u2.game_target_minutes
      THEN tr.date
    END) AS game_under_limit_days
  FROM time_records tr
  JOIN users u2 ON tr.user_id = u2.user_id
  WHERE tr.date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
  GROUP BY tr.user_id, DATE_FORMAT(tr.date, '%Y-%m')
) hw ON u.user_id = hw.user_id AND DATE_FORMAT(m.month_date, '%Y-%m') = hw.month
LEFT JOIN (
  SELECT
    r.user_id,
    DATE_FORMAT(r.created_at, '%Y-%m') AS month,
    COUNT(*) AS monthly_redemptions,
    SUM(r.total_points_used) AS monthly_points_spent
  FROM redemptions r
  WHERE r.created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
    AND r.status IN ('completed', 'approved')
  GROUP BY r.user_id, DATE_FORMAT(r.created_at, '%Y-%m')
) r ON u.user_id = r.user_id AND DATE_FORMAT(m.month_date, '%Y-%m') = r.month
LEFT JOIN (
  SELECT
    pl.user_id,
    DATE_FORMAT(pl.created_at, '%Y-%m') AS month,
    SUM(pl.change_amount) AS monthly_net_change
  FROM point_logs pl
  WHERE pl.created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
  GROUP BY pl.user_id, DATE_FORMAT(pl.created_at, '%Y-%m')
) pl ON u.user_id = pl.user_id AND DATE_FORMAT(m.month_date, '%Y-%m') = pl.month
WHERE u.role = 'child' AND m.month_date <= CURDATE()
ORDER BY u.user_id, m.month_date DESC;

/*积分收支明细*/
CREATE VIEW `v_user_point_detail` AS
SELECT
  pl.log_id,
  pl.user_id,
  u.username,
  pl.change_amount,
  pl.balance_after,
  pl.source_type,
  -- 友好描述
  CASE pl.source_type
    WHEN 'task_complete' THEN CONCAT('✅ 完成任务: ', t.title)
    WHEN 'redemption' THEN CONCAT('🛒 兑换商品: ', p.name)
    WHEN 'admin_adjust' THEN CONCAT('⚙️ 管理员调整: ', pl.description)
    WHEN 'bonus' THEN '🎁 奖励积分'
    WHEN 'penalty' THEN '⚠️ 扣除积分'
    WHEN 'system' THEN '📢 系统操作'
  END AS display_description,
  pl.created_at,
  DATE(pl.created_at) AS date,
  -- 分类汇总标识
  CASE WHEN pl.change_amount > 0 THEN 'income' ELSE 'expense' END AS type
FROM point_logs pl
LEFT JOIN users u ON pl.user_id = u.user_id
LEFT JOIN tasks t ON pl.source_type = 'task_complete' AND pl.source_id = t.task_id
LEFT JOIN redemptions r ON pl.source_type = 'redemption' AND pl.source_id = r.redemption_id
LEFT JOIN products p ON r.product_id = p.product_id
ORDER BY pl.created_at DESC;

/*兑换统计视图*/
CREATE VIEW `v_user_redemption_stats` AS
SELECT
  u.user_id,
  u.username,
  -- 总体统计
  COUNT(r.redemption_id) AS total_redemptions,
  SUM(r.total_points_used) AS total_points_spent,
  -- 按状态统计
  SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
  SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
  SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
  SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
  -- 按类别统计
  SUM(CASE WHEN p.category = 'toy' THEN r.quantity ELSE 0 END) AS toy_count,
  SUM(CASE WHEN p.category = 'game_time' THEN r.quantity ELSE 0 END) AS game_time_count,
  SUM(CASE WHEN p.category = 'activity' THEN r.quantity ELSE 0 END) AS activity_count,
  SUM(CASE WHEN p.category = 'food' THEN r.quantity ELSE 0 END) AS food_count,
  SUM(CASE WHEN p.category = 'book' THEN r.quantity ELSE 0 END) AS book_count,
  -- 最近兑换
  MAX(r.created_at) AS last_redemption_at,
  MIN(r.created_at) AS first_redemption_at,
  -- 平均每次兑换积分
  CASE WHEN COUNT(r.redemption_id) > 0
       THEN ROUND(AVG(r.total_points_used), 0)
       ELSE 0 END AS avg_points_per_redemption
FROM users u
LEFT JOIN redemptions r ON u.user_id = r.user_id
LEFT JOIN products p ON r.product_id = p.product_id
WHERE u.role = 'child'
GROUP BY u.user_id, u.username;

/*时间使用分析*/
DROP VIEW IF EXISTS `v_user_time_analysis`;

CREATE VIEW `v_user_time_analysis` AS
SELECT
  u.user_id,
  u.username,
  -- 本月时间统计
  DATE_FORMAT(NOW(), '%Y-%m') AS current_month,
  COALESCE(hm.monthly_homework_minutes, 0) AS monthly_homework_minutes,
  COALESCE(hm.monthly_game_minutes, 0) AS monthly_game_minutes,

  -- 本月目标完成天数
  COALESCE(hw_days.homework_target_days, 0) AS homework_target_days_this_month,
  COALESCE(game_days.game_under_limit_days, 0) AS game_under_limit_days_this_month,

  -- 平均每日时间
  ROUND(COALESCE(hm.monthly_homework_minutes, 0) /
        GREATEST(DAY(LAST_DAY(NOW())), 1), 1) AS avg_daily_homework,
  ROUND(COALESCE(hm.monthly_game_minutes, 0) /
        GREATEST(DAY(LAST_DAY(NOW())), 1), 1) AS avg_daily_game,

  -- 时间效率（作业时间 vs 游戏时间比）
  CASE
    WHEN COALESCE(hm.monthly_game_minutes, 0) > 0 AND COALESCE(hm.monthly_homework_minutes, 0) > 0
    THEN ROUND(COALESCE(hm.monthly_homework_minutes, 0) / COALESCE(hm.monthly_game_minutes, 0), 1)
    ELSE 0
  END AS homework_game_ratio,

  -- 时间利用率（作业时间占比）
  CASE
    WHEN COALESCE(hm.monthly_homework_minutes, 0) + COALESCE(hm.monthly_game_minutes, 0) > 0
    THEN ROUND(COALESCE(hm.monthly_homework_minutes, 0) * 100.0 /
               (COALESCE(hm.monthly_homework_minutes, 0) + COALESCE(hm.monthly_game_minutes, 0)), 1)
    ELSE 0
  END AS homework_time_percentage,

  -- 与上月对比
  COALESCE(last_month.last_month_homework, 0) AS last_month_homework,
  COALESCE(last_month.last_month_game, 0) AS last_month_game,
  CASE
    WHEN COALESCE(last_month.last_month_homework, 0) > 0
    THEN ROUND((COALESCE(hm.monthly_homework_minutes, 0) - COALESCE(last_month.last_month_homework, 0)) * 100.0 /
               COALESCE(last_month.last_month_homework, 0), 1)
    ELSE 0
  END AS homework_change_percent

FROM users u
LEFT JOIN (
  SELECT
    tr.user_id,
    SUM(CASE WHEN tr.activity_type = 'homework' THEN tr.duration_minutes ELSE 0 END) AS monthly_homework_minutes,
    SUM(CASE WHEN tr.activity_type = 'game' THEN tr.duration_minutes ELSE 0 END) AS monthly_game_minutes
  FROM time_records tr
  WHERE DATE_FORMAT(tr.date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
  GROUP BY tr.user_id
) hm ON u.user_id = hm.user_id
LEFT JOIN (
  SELECT
    tr.user_id,
    COUNT(DISTINCT CASE
      WHEN tr.activity_type = 'homework' AND tr.duration_minutes >= u2.homework_target_minutes
      THEN tr.date
    END) AS homework_target_days,
    COUNT(DISTINCT CASE
      WHEN tr.activity_type = 'game' AND tr.duration_minutes <= u2.game_target_minutes
      THEN tr.date
    END) AS game_under_limit_days
  FROM time_records tr
  JOIN users u2 ON tr.user_id = u2.user_id
  WHERE DATE_FORMAT(tr.date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
  GROUP BY tr.user_id
) hw_days ON u.user_id = hw_days.user_id
LEFT JOIN (
  SELECT
    tr.user_id,
    COUNT(DISTINCT CASE
      WHEN tr.activity_type = 'game' AND tr.duration_minutes <= u2.game_target_minutes
      THEN tr.date
    END) AS game_under_limit_days
  FROM time_records tr
  JOIN users u2 ON tr.user_id = u2.user_id
  WHERE DATE_FORMAT(tr.date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
  GROUP BY tr.user_id
) game_days ON u.user_id = game_days.user_id
LEFT JOIN (
  SELECT
    tr.user_id,
    SUM(CASE WHEN tr.activity_type = 'homework' THEN tr.duration_minutes ELSE 0 END) AS last_month_homework,
    SUM(CASE WHEN tr.activity_type = 'game' THEN tr.duration_minutes ELSE 0 END) AS last_month_game
  FROM time_records tr
  WHERE DATE_FORMAT(tr.date, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')
  GROUP BY tr.user_id
) last_month ON u.user_id = last_month.user_id
WHERE u.role = 'child';