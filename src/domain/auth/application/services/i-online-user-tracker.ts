// src/domain/auth/application/services/i-online-user-tracker.ts

export interface OnlineUserInfo {
  userId: string;
  email: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

export interface OnlineUserStats {
  totalOnline: number;
  usersByRole: {
    admin: number;
    tutor: number;
    student: number;
  };
  recentLogins: number; // Last 5 minutes
}

/**
 * Interface for tracking online users
 * 
 * This service manages the state of currently logged in users,
 * tracking their activity and providing statistics.
 */
export abstract class IOnlineUserTracker {
  /**
   * Add a user to the online users list
   */
  abstract addUser(info: OnlineUserInfo): Promise<void>;

  /**
   * Remove a user from the online users list
   */
  abstract removeUser(userId: string): Promise<void>;

  /**
   * Update the last activity timestamp for a user
   */
  abstract updateActivity(userId: string): Promise<void>;

  /**
   * Get the count of currently active users
   * Users are considered inactive after 15 minutes without activity
   */
  abstract getActiveUsersCount(): Promise<number>;

  /**
   * Get detailed statistics about online users
   */
  abstract getOnlineStats(): Promise<OnlineUserStats>;

  /**
   * Get list of online users with pagination
   */
  abstract getOnlineUsers(page: number, pageSize: number): Promise<OnlineUserInfo[]>;

  /**
   * Check if a specific user is online
   */
  abstract isUserOnline(userId: string): Promise<boolean>;

  /**
   * Clean up inactive users (called periodically)
   */
  abstract cleanupInactiveUsers(): Promise<number>;
}