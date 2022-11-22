import { CheckResult, CheckRunData, SubProjConfig } from "../types";

export const getChecksResult = (
  checks: string[],
  postedChecks: Record<string, CheckRunData>,
): CheckResult => {
  let result: CheckResult = "all_passing";
  checks.forEach((check) => {
    const relevant = check in postedChecks
    if (relevant && postedChecks[check].conclusion !== "success") {
      // at least one check failed
      return "has_failure";
    }
    if (!relevant || postedChecks[check].conclusion === null) {
      // some checks are pending or missing
      result = "pending";
    }
  });
  return result;
}

export const getSubProjResult = (
  subProjs: SubProjConfig[],
  postedChecks: Record<string, CheckRunData>,
): CheckResult => {
  let result: CheckResult = "all_passing";
  subProjs.forEach((subProj) => {
    subProj.checks.forEach((check) => {
      const relevant = check in postedChecks
      if (relevant && postedChecks[check].conclusion !== "success") {
        // at least one check failed
        result = "has_failure";
        return // continue
      }
      if (!relevant || postedChecks[check].conclusion === null) {
        // some checks are pending or missing
        result = "pending";
      }
    });
  });
  return result;
};
