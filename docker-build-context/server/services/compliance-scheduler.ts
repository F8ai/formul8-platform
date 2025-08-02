import { regulatoryDataService } from './regulatory-data-service';
import { storage } from '../storage';

export class ComplianceScheduler {
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startDailyUpdates();
  }

  // Start the daily update scheduler
  startDailyUpdates(): void {
    if (this.isRunning) {
      console.log('Compliance scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Compliance Agent regulatory data scheduler...');

    // Initialize regulatory data service
    regulatoryDataService.startDailyUpdates();

    // Schedule the daily updates
    this.scheduleNextUpdate();
  }

  private scheduleNextUpdate(): void {
    // Calculate time until next 2 AM
    const now = new Date();
    const next2AM = new Date(now);
    next2AM.setDate(next2AM.getDate() + 1);
    next2AM.setHours(2, 0, 0, 0);

    const msUntil2AM = next2AM.getTime() - now.getTime();

    this.updateInterval = setTimeout(async () => {
      await this.performDailyUpdate();
      this.scheduleNextUpdate();
    }, msUntil2AM);

    console.log(`Next compliance data update scheduled for: ${next2AM.toLocaleString()}`);
  }

  private async performDailyUpdate(): Promise<void> {
    console.log('🏛️ Starting daily compliance regulatory update...');
    
    try {
      // Log system activity
      await this.logSystemActivity('daily_update_started');

      // Check for regulation updates
      const updates = await regulatoryDataService.checkForUpdates();
      
      console.log(`📋 Daily compliance update completed: ${updates.length} changes detected`);

      // Log update results
      await this.logSystemActivity('daily_update_completed', {
        updatesFound: updates.length,
        timestamp: new Date().toISOString()
      });

      // If significant updates found, log details
      if (updates.length > 0) {
        const statesWithUpdates = [...new Set(updates.map(u => u.state))];
        await this.logSystemActivity('regulatory_changes_detected', {
          affectedStates: statesWithUpdates,
          changeTypes: updates.map(u => u.changeType),
          totalChanges: updates.length
        });

        console.log(`📊 Regulatory changes detected in states: ${statesWithUpdates.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Error during daily compliance update:', error);
      
      await this.logSystemActivity('daily_update_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async logSystemActivity(activityType: string, details?: any): Promise<void> {
    try {
      // Log as system user activity (we'll use a system user ID)
      await storage.logUserActivity({
        userId: 'system-compliance-scheduler',
        activityType,
        details: details || {},
        agentType: 'compliance'
      });
    } catch (error) {
      console.error('Error logging compliance scheduler activity:', error);
    }
  }

  // Force an immediate update
  async forceUpdate(): Promise<void> {
    console.log('🔄 Forcing immediate compliance regulatory update...');
    await this.performDailyUpdate();
  }

  // Stop the scheduler
  stop(): void {
    if (this.updateInterval) {
      clearTimeout(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('Compliance scheduler stopped');
  }

  // Get scheduler status
  getStatus(): {
    isRunning: boolean;
    nextUpdate: Date | null;
    lastUpdate: Date;
  } {
    const now = new Date();
    const next2AM = new Date(now);
    next2AM.setDate(next2AM.getDate() + 1);
    next2AM.setHours(2, 0, 0, 0);

    return {
      isRunning: this.isRunning,
      nextUpdate: this.isRunning ? next2AM : null,
      lastUpdate: regulatoryDataService.getStatistics().lastUpdate
    };
  }
}

// Create singleton instance
export const complianceScheduler = new ComplianceScheduler();