import { CheckResult, CheckRunData, SubProjConfig } from "../types";

export const getChecksResult = (
  checks: string[],
  postedChecks: Record<string, CheckRunData>,
): CheckResult => {
  let result: CheckResult = "all_passing";
  for (const check of checks) {
    const relevant = check in postedChecks
    if (relevant && postedChecks[check].conclusion !== "success") {
      // at least one check failed
      return "has_failure";
    }
    if (!relevant || postedChecks[check].conclusion === null) {
      // some checks are pending or missing
      result = "pending";
    }
  };
  return result;
}

export const getSubProjResult = (
  subProjs: SubProjConfig[],
  postedChecks: Record<string, CheckRunData>,
): CheckResult => {
  let result: CheckResult = "all_passing";
  for (const subProj of subProjs) {
    for (const check of subProj.checks) {
      const relevant = check in postedChecks
      if (relevant && postedChecks[check].conclusion !== "success") {
        // at least one check failed
        return "has_failure";
      }
      if (!relevant || postedChecks[check].conclusion === null) {
        // some checks are pending or missing
        result = "pending";
      }
    };
  };
  return result;
};
