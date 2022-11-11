import { CheckGroupConfig } from "../types";
import { Context } from "probot";
import { parseUserConfig } from "../utils";
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
  const params = context.repo({path: `.github/${filename}`})
  const repoFullName = `${params.owner}/${params.repo}`;
  const githubRepository = process.env['GITHUB_REPOSITORY']
  core.debug(`fetchConfig ${repoFullName} ${githubRepository}`)
  if (repoFullName == githubRepository) {
    const prBranch =  process.env['GITHUB_HEAD_REF'];
    core.info(`The PR is from a branch in the repository. Reading the config in ${prBranch}`)
    configData = await context.octokit.config.get({...params, branch: prBranch}) as Record<string, unknown>;
  } else {
    // this will pull the config from master
    configData = await context.config(filename) as Record<string, unknown>;  
  }
  core.debug(`configData: ${JSON.stringify(configData)}`)
  return parseUserConfig(configData);
};
