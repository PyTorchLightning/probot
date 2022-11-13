/**
 * @module Core
 */
 import * as core from '@actions/core'
 import {
  generateProgressDetailsCLI,
  commentOnPr,
} from "./generate_progress";
import { matchFilenamesToSubprojects } from "./subproj_matching";
import { satisfyExpectedChecks } from "./satisfy_expected_checks";
import { fetchConfig } from "./config_getter";
import type { CheckGroupConfig, CheckResult, SubProjConfig } from "../types";
import type { Context } from "probot";

/**
 * The orchestration class.
 */
export class CheckGroup {
  pullRequestNumber: number;
  config: CheckGroupConfig;
  context: Context;
  sha: string;

  intervalTimer: ReturnType<typeof setTimeout> = setTimeout(() => '', 0);
  timeoutTimer: ReturnType<typeof setTimeout> = setTimeout(() => '', 0);
  inputs: Record<string, any> = {};

  constructor(
    pullRequestNumber: number,
    config: CheckGroupConfig,
    context: Context,
    sha: string,
  ) {
    this.pullRequestNumber = pullRequestNumber;
    this.config = config;
    this.context = context;
    this.sha = sha;
  }

  async run(): Promise<void> {
    const filenames = await this.files();
    core.info(`Files are: ${JSON.stringify(filenames)}`);

    const subprojs = matchFilenamesToSubprojects(filenames, this.config.subProjects);
    core.debug(`Matching subprojects are: ${JSON.stringify(subprojs)}`);

    if (core.isDebug()) {
      const expectedChecks = collectExpectedChecks(subprojs);
      core.debug(`Expected checks are: ${JSON.stringify(expectedChecks)}`);
    }

    const maintainers = core.getInput('maintainers')
    this.inputs.maintainers = maintainers

    const owner = core.getInput('owner')
    this.inputs.owner = owner

    const interval = parseInt(core.getInput('interval'))
    this.inputs.interval = interval
    core.info(`Check interval: ${interval}`);
    this.runCheck(subprojs, 1, interval * 1000)

    const timeout = parseInt(core.getInput('timeout'))
    this.inputs.timeout = timeout
    core.info(`Timeout: ${timeout}`);
    // set a timeout that will stop the job to avoid polling the GitHub API infinitely
    this.timeoutTimer = setTimeout(
      () => {
        clearTimeout(this.intervalTimer)
        core.setFailed(
          `The timeout of ${timeout} minutes has triggered but not all required jobs were passing.`
          + ` This job will need to be re-run to merge your PR.`
          + ` If you do not have write access to the repository you can ask ${maintainers} to re-run it for you.`
          + ` If you have any other questions, you can reach out to ${owner} for help.`
        )
      }, timeout * 60 * 1000 
    )
  }

  async runCheck(subprojs: SubProjConfig[], tries: number, interval: number): Promise<void> {
    try {
      // print in a group to reduce verbosity
      core.startGroup(`Check ${tries}`);
      const postedChecks = await getPostedChecks(this.context, this.sha);
      core.debug(`postedChecks: ${JSON.stringify(postedChecks)}`);
      const conclusion = satisfyExpectedChecks(subprojs, postedChecks);
      this.notifyProgress(subprojs, postedChecks, conclusion)
      core.endGroup();
    
      if (conclusion === "all_passing") {
        core.info("All required checks were successful!")
        clearTimeout(this.intervalTimer)
        clearTimeout(this.timeoutTimer)
      } else {
        this.intervalTimer = setTimeout(() => this.runCheck(subprojs, tries + 1, interval), interval);
      }
      
    } catch (error) {
      // bubble up the error to the job
      core.setFailed(error);
      clearTimeout(this.intervalTimer)
      clearTimeout(this.timeoutTimer)
    }
  }

  async notifyProgress(
    subprojs: SubProjConfig[],
    postedChecks: Record<string, string>,
    conclusion: CheckResult
  ): Promise<void> {
    const details = generateProgressDetailsCLI(subprojs, postedChecks)
    core.info(
      `${this.config.customServiceName} conclusion: '${conclusion}':\n${details}`
    )
    commentOnPr(this.context, conclusion, this.inputs, subprojs, postedChecks)
  } 

  /**
   * Gets a list of files that are modified in
   * a pull request.
   */
  async files(): Promise<string[]> {
    const pullRequestFiles = await this.context.octokit.paginate(
      this.context.octokit.pulls.listFiles,
      this.context.repo({"pull_number": this.pullRequestNumber}),
      (response) => response.data,
    );
    const filenames: string[] = [];
    pullRequestFiles.forEach((pullRequestFile: any) => {
        filenames.push(pullRequestFile.filename);
      },
    );
    return filenames;
  }
}

export {fetchConfig};

/**
 * Fetches a list of already finished
 * checks.
 */
const getPostedChecks = async (context: Context, sha: string): Promise<Record<string, string>> => {
  const checkRuns = await context.octokit.paginate(
    context.octokit.checks.listForRef,
    context.repo({ref: sha}),
    (response) => response.data,
  );
  core.debug(`checkRuns: ${JSON.stringify(checkRuns)}`)
  const checkNames: Record<string, string> = {};
  checkRuns.forEach(
    (checkRun: any) => {
      const conclusion = checkRun.conclusion ? checkRun.conclusion : "pending";
      checkNames[checkRun.name] = conclusion;
    },
  );
  return checkNames;
}

const collectExpectedChecks = (configs: SubProjConfig[]): Record<string, string[]> => {
  // checks: subprojects[]
  const requiredChecks: Record<string, string[]> = {};
  configs.forEach((config) => {
    config.checks.forEach((check) => {
      if (check.id in requiredChecks) {
        requiredChecks[check.id].push(config.id)
      } else {
        requiredChecks[check.id] = [config.id]
      }
    });
  });
  return requiredChecks;
};
