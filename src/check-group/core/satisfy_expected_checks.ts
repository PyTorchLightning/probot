import { CheckResult, CheckRunData, SubProjConfig } from "../types";

export const getCheckResult = (
  checks: string[],
  postedChecks: Record<string, CheckRunData>,
): CheckResult => {
  let result: CheckResult = "all_passing";
  checks.forEach((check) => {
    const relevant = check in postedChecks
    if (
      relevant &&
      postedChecks[check].conclusion !== "success" &&
      postedChecks[check].conclusion !== null
    ) {
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

export const satisfyExpectedChecks = (
  subProjs: SubProjConfig[],
  postedChecks: Record<string, CheckRunData>,
): CheckResult => {
  let result: CheckResult = "all_passing";
  subProjs.forEach((subProj) => result = getCheckResult(subProj.checks, postedChecks));
  return result;
};
