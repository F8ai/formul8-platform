/**
 * Duplicate Prevention Service
 * Comprehensive system to prevent duplicate GitHub issue creation
 */

import { Octokit } from '@octokit/rest';

export class DuplicatePreventionService {
  private static instance: DuplicatePreventionService;
  private isCleanupMode = false;
  private preventCreation = false;
  private creationLog: Map<string, Set<string>> = new Map();

  static getInstance(): DuplicatePreventionService {
    if (!DuplicatePreventionService.instance) {
      DuplicatePreventionService.instance = new DuplicatePreventionService();
    }
    return DuplicatePreventionService.instance;
  }

  /**
   * Enable cleanup mode - prevents all new issue creation
   */
  enableCleanupMode(): void {
    this.isCleanupMode = true;
    this.preventCreation = true;
    console.log('🛡️ CLEANUP MODE ENABLED: All issue creation is blocked');
  }

  /**
   * Disable cleanup mode - allows issue creation with duplicate checks
   */
  disableCleanupMode(): void {
    this.isCleanupMode = false;
    this.preventCreation = false;
    console.log('✅ CLEANUP MODE DISABLED: Issue creation allowed with duplicate prevention');
  }

  /**
   * Check if issue creation is currently allowed
   */
  isCreationAllowed(): boolean {
    return !this.preventCreation;
  }

  /**
   * Log an issue creation attempt
   */
  logCreationAttempt(agentName: string, issueTitle: string): void {
    if (!this.creationLog.has(agentName)) {
      this.creationLog.set(agentName, new Set());
    }
    this.creationLog.get(agentName)!.add(issueTitle);
  }

  /**
   * Check if issue was already created in this session
   */
  wasCreatedInSession(agentName: string, issueTitle: string): boolean {
    return this.creationLog.get(agentName)?.has(issueTitle) || false;
  }

  /**
   * Get creation statistics
   */
  getCreationStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [agent, titles] of this.creationLog.entries()) {
      stats[agent] = {
        issuesCreated: titles.size,
        titles: Array.from(titles)
      };
    }
    return stats;
  }

  /**
   * Reset creation log
   */
  resetLog(): void {
    this.creationLog.clear();
    console.log('📝 Creation log reset');
  }

  /**
   * Comprehensive duplicate check against GitHub
   */
  async checkForDuplicates(
    octokit: Octokit, 
    org: string, 
    repo: string, 
    issueTitle: string
  ): Promise<{ isDuplicate: boolean; existingIssue?: any; duplicateCount: number }> {
    try {
      // Get all feature issues
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: org,
        repo,
        state: 'all',
        per_page: 100
      });

      const duplicates = issues.filter(issue => issue.title === issueTitle);
      
      return {
        isDuplicate: duplicates.length > 0,
        existingIssue: duplicates[0],
        duplicateCount: duplicates.length
      };
    } catch (error) {
      console.error(`Error checking duplicates for ${repo}:`, error);
      return { isDuplicate: false, duplicateCount: 0 };
    }
  }

  /**
   * Safe issue creation with comprehensive duplicate prevention
   */
  async safeCreateIssue(
    octokit: Octokit,
    org: string,
    repo: string,
    issueData: { title: string; body: string; labels: string[] }
  ): Promise<{ success: boolean; action: string; message: string; data?: any }> {
    
    // Global prevention check
    if (!this.isCreationAllowed()) {
      return {
        success: false,
        action: 'blocked_cleanup_mode',
        message: 'Issue creation blocked - system in cleanup mode'
      };
    }

    // Session duplicate check
    if (this.wasCreatedInSession(repo, issueData.title)) {
      return {
        success: false,
        action: 'blocked_session_duplicate',
        message: 'Issue was already created in this session'
      };
    }

    // GitHub duplicate check
    const duplicateCheck = await this.checkForDuplicates(octokit, org, repo, issueData.title);
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        action: 'blocked_github_duplicate',
        message: `Issue already exists on GitHub (${duplicateCheck.duplicateCount} duplicates found)`,
        data: duplicateCheck.existingIssue
      };
    }

    // Safe to create
    try {
      const response = await octokit.rest.issues.create({
        owner: org,
        repo,
        ...issueData
      });

      // Log successful creation
      this.logCreationAttempt(repo, issueData.title);

      return {
        success: true,
        action: 'created',
        message: 'Issue created successfully',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        action: 'creation_failed',
        message: `Failed to create issue: ${error.message}`
      };
    }
  }
}

// Global instance
export const duplicatePreventionService = DuplicatePreventionService.getInstance();