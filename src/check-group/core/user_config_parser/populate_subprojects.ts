/**
 * @module PopulateSubProjects
 */

import {
  CheckGroupConfig,
  SubProjConfig,
} from "../../types";
import * as core from '@actions/core'

export function parseProjectId(subprojData: Record<string, unknown>): string {
  if (!("id" in subprojData)) {
    core.setFailed("Essential field missing from config: sub-project ID");
  }
  return subprojData["id"] as string;
}

export function parseProjectPaths(subprojData: Record<string, unknown>): string[] {
  if (!("paths" in subprojData) || subprojData["paths"] == null) {
    core.setFailed(`The list of paths for the '${subprojData["id"]}' group is not defined`);
  }
  const projPaths: string[] = subprojData["paths"] as string[];
  if (projPaths.length == 0) {
    core.setFailed(`The list of paths for the '${subprojData["id"]}' group is empty`);
  }
  return projPaths;
}

export function parseProjectChecks(subprojData: Record<string, unknown>): string[] {
  if (!("checks" in subprojData) || subprojData["checks"] == null) {
    core.setFailed(`The list of checks for the '${subprojData["id"]}' group is not defined`);
  }
  // workaround for https://stackoverflow.com/questions/24090177/how-to-merge-yaml-arrays
  // by manually flattening multidimensional arrays
  type RecursiveArray = Array<RecursiveArray | string>;
  const checksData: RecursiveArray = subprojData["checks"] as RecursiveArray;
  const projChecks: string[] = checksData.flat(100) as string[]  // 100 levels deep
  core.debug(
    `checksData for '${subprojData["id"]}' before flatten: ${JSON.stringify(checksData)})`
    + ` and after flatten: ${JSON.stringify(projChecks)}`
  );
  if (projChecks.length == 0) {
    core.setFailed(`The list of checks for the '${subprojData["id"]}' group is empty`);
  }
  return projChecks;
}

/**
 * Parse user config file and populate subprojects
 * @param {Record<string, unknown>} configData
 * @param {CheckGroupConfig} config
 **/
export function populateSubprojects(
  configData: Record<string, unknown>,
  config: CheckGroupConfig,
): void {
  if (!("subprojects" in configData)) {
    core.setFailed("configData has no subprojects");
  }
  const subProjectsData = configData["subprojects"] as Record<string, unknown>[];
  subProjectsData.forEach((subprojData) => {
    const subprojConfig: SubProjConfig = {
      checks: parseProjectChecks(subprojData),
      id: parseProjectId(subprojData),
      paths: parseProjectPaths(subprojData),
    };
    config.subProjects.push(subprojConfig);
  });
}
