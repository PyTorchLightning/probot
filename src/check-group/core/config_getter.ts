import { CheckGroupConfig } from "../types";
import { Context } from "probot";
import { parseUserConfig } from "./user_config_parser";
import { PullRequestEvent } from '@octokit/webhooks-types';
import * as core from '@actions/core'

/**
 * Fetches the app configuration from the user's repository.
 *
 * @param context The base Probot context which is even independent.
 * @returns The configuration or default configuration if non exists.
 */
export const fetchConfig = async (context: Context): Promise<CheckGroupConfig> => {
  let configData: Record<string, unknown> = undefined
  const filename = "checkgroup.yml"
  const payload = context.payload as PullRequestEvent;
  const repoFullName = payload.pull_request.head.repo.full_name
  const githubRepository = payload.pull_request.base.repo.full_name
  core.debug(`fetchConfig ${repoFullName} ${githubRepository}`)
  if (repoFullName == githubRepository) {
    const prBranch = payload.pull_request.head.ref;
    core.info(`The PR is from a branch in the repository. Reading the config in ${prBranch}`)
    const params = context.repo({path: `.github/${filename}`})
    // https://github.com/probot/octokit-plugin-config
    const { config } = await context.octokit.config.get({...params, branch: prBranch})
    configData = config
  } else {
    // this will pull the config from master
    configData = await context.config(filename);  
  }
  core.debug(`configData: ${JSON.stringify(configData)}`)
  return parseUserConfig(configData);
};
