/**
 * @module PopulateSubProjects
 */

import {
  CheckGroupConfig,
  SubProjCheck,
  SubProjConfig,
  SubProjPath,
} from "../../types";
import * as core from '@actions/core'

/**
 * Parses the structured ID into sub-project data from the raw user config.
 *
 * The ID is required for the sub-project since it is hard to give the user
 * any useful information for debugging if the ID that is used to identify the
 * location of the issue is missing. In this case, it will be better to bail.
 *
 * @param subprojData The raw data from the config file.
 * @param subprojConfig The structured data for the sub-project.
 */
export function parseProjectId(
  subprojData: Record<string, unknown>,
  subprojConfig: SubProjConfig,
): void {
  if ("id" in subprojData) {
    subprojConfig.id = subprojData["id"] as string;
  } else {
    throw Error("Essential field missing from config: sub-project ID");
  }
}

export function parseProjectPaths(
  subprojData: Record<string, unknown>,
  subprojConfig: SubProjConfig,
  config: CheckGroupConfig,
): void {
  if ("paths" in subprojData && subprojData["paths"] !== null) {
    const projPaths: SubProjPath[] = [];
    const locations: string[] = subprojData["paths"] as string[];
    locations.forEach((loc) => {
      projPaths.push({
        location: loc,
      });
    });
    const minPathCnt = 0;
    if (projPaths.length > minPathCnt) {
      subprojConfig.paths = projPaths;
    } else {
      config.debugInfo.push({
        configError: true,
        configErrorMsg: "Paths is empty.",
      });
    }
  } else {
    config.debugInfo.push({
      configError: true,
      configErrorMsg: `:warning: Essential fields missing from config for project ${subprojConfig.id}: paths`,
    });
  }
}

export function parseProjectChecks(subprojData: Record<string, unknown>): SubProjCheck[] {
  if (!("checks" in subprojData) || subprojData["checks"] == null) {
    core.setFailed(`The list of checks for the '${subprojData["id"]}' group is not defined`);
  }
  const projChecks: SubProjCheck[] = [];
  // workaround for https://stackoverflow.com/questions/24090177/how-to-merge-yaml-arrays
  // by manually flattening multidimensional arrays
  type RecursiveArray = Array<RecursiveArray | string>;
  const checksData: RecursiveArray = subprojData["checks"] as RecursiveArray;
  const flattened: string[] = checksData.flat(100) as string[]  // 100 levels deep
  core.debug(
    `checksData for '${subprojData["id"]}' before flatten: ${JSON.stringify(checksData)})`
    + ` and after flatten: ${JSON.stringify(flattened)}`
  );
  flattened.forEach((checkId) => projChecks.push({id: checkId}))
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
  if ("subprojects" in configData) {
    const subProjectsData = configData["subprojects"] as Record<
      string,
      unknown
    >[];
    subProjectsData.forEach((subprojData) => {
      const subprojConfig: SubProjConfig = {
        checks: [],
        id: "Unknown",
        paths: [],
      };
      try {
        parseProjectId(subprojData, subprojConfig);
        parseProjectPaths(subprojData, subprojConfig, config);
        subprojConfig.checks = parseProjectChecks(subprojData);
        config.subProjects.push(subprojConfig);
      } catch (err) {
        config.debugInfo.push({
          configError: true,
          configErrorMsg: `Error adding sub-project from data:\n ${JSON.stringify(
            subprojData,
          )}`,
        });
      }
    });
  } else {
    throw Error("subprojects not found in the user configuration file");
  }
}
