/**
 * Check Group data types
 * @module CheckGroupTypes
 */
export interface SubProjConfig {
  /**
   * The ID for the sub-project
   */
  id: string;
  /**
   * The paths that defines
   * this sub-project within
   * the repository.
   */
  paths: string[];
  /**
   * A list of check IDs that
   * are expected to pass for
   * the sub-project.
   */
  checks: string[];
}

export interface CheckGroupConfig {
  /**
   * The sub-project configurations.
   */
  subProjects: SubProjConfig[];
  /**
   * The name that will be displayed on the GitHub
   * pull request check list. This requested to be
   * customizable in #457 to make it more informative
   * for developers that are less familiar with the
   * workflows.
   */
  customServiceName: string;
}

/**
 * The result of the processing pipeline.
 */
export type CheckResult = 'all_passing' | 'has_failure' | 'pending';
export type Conclusion =  "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required" | null;
export type Status = "completed" | "in_progress" | "queued";

export interface CheckRunData {
  name: string;
  status: Status;
  conclusion: Conclusion;
  details_url: string;
  completed_at: Date,
}
