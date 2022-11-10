/**
 * @module Core
 */

import {
  generateProgressDetails,
  generateProgressSummary,
} from "../utils";
import * as core from '@actions/core'
import type { CheckGroupConfig } from "../types";
import type { Context } from "probot";
import { fetchConfig } from "./config_getter";
import { matchFilenamesToSubprojects } from "../utils";
import { satisfyExpectedChecks } from "../utils";
import { SubProjConfig } from "../types";

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

    const interval = parseInt(core.getInput('interval'))
    core.info(`Check interval: ${interval}`);
    this.runCheck(subprojs, 1, interval * 1000)

    const timeout = parseInt(core.getInput('timeout'))
    core.info(`Timeout: ${timeout}`);
    // set a timeout that will stop the job to avoid polling the GitHub API infinitely
    this.timeoutTimer = setTimeout(
      () => {
        clearTimeout(this.intervalTimer)
        core.setFailed(`The timeout of ${timeout} minutes has triggered.`)
      }, timeout * 60 * 1000 
    )
  }

  async runCheck(subprojs, tries: number, interval: number) {
    try {
      // print in a group to reduce verbosity
      core.startGroup(`Check ${tries}`);
      const postedChecks = await getPostedChecks(this.context, this.sha);
      core.debug(`postedChecks: ${JSON.stringify(postedChecks)}`);
      
      const conclusion = satisfyExpectedChecks(subprojs, postedChecks);
      const summary = generateProgressSummary(subprojs, postedChecks)
      const details = generateProgressDetails(subprojs, postedChecks)
      core.info(
        `${this.config.customServiceName} conclusion: '${conclusion}':\n${summary}\n${details}`
      )
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
