// 业务枚举（对齐 mysql.md / logic.md）

export enum Role {
  Child = 'child',
  Admin = 'admin',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
}

export enum TaskStatus {
  Pending = 'pending',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Expired = 'expired',
}

export enum ActivityType {
  Homework = 'homework',
  Game = 'game',
  Reading = 'reading',
  Exercise = 'exercise',
  Other = 'other',
}

export enum TimeSource {
  Timer = 'timer',
  Manual = 'manual',
}

export enum TimerStatus {
  Running = 'running',
  Paused = 'paused',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum ProductCategory {
  Toy = 'toy',
  GameTime = 'game_time',
  Activity = 'activity',
  Food = 'food',
  Book = 'book',
  Other = 'other',
}

export enum RedemptionStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum PointSourceType {
  TaskComplete = 'task_complete',
  Redemption = 'redemption',
  AdminAdjust = 'admin_adjust',
  Bonus = 'bonus',
  Penalty = 'penalty',
  System = 'system',
}

export enum NotificationType {
  TaskReminder = 'task_reminder',
  TimeTargetReached = 'time_target_reached',
  TimeWarning = 'time_warning',
  RedemptionApproved = 'redemption_approved',
  RedemptionRejected = 'redemption_rejected',
  RedemptionCompleted = 'redemption_completed',
  System = 'system',
}

export enum ConfigType {
  String = 'string',
  Int = 'int',
  Boolean = 'boolean',
  Json = 'json',
}
