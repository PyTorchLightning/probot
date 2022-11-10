import { ProgressReport, SubProjConfig } from "../types";

export const generateProgressReport = (
  subprojects: SubProjConfig[],
  checksStatusLookup: Record<string, string>,
): ProgressReport => {
  const report: ProgressReport = {
    completed: [],
    expected: [],
    failed: [],
    missing: [],
    needAction: [],
    running: [],
    succeeded: [],
  };
  const lookup: Record<string, boolean> = {};
  subprojects.forEach((proj) => {
    proj.checks.forEach((check) => {
      /* eslint-disable security/detect-object-injection */
      if (!(check.id in lookup)) {
        lookup[check.id] = true;
        report.expected?.push(check.id);
        if (check.id in checksStatusLookup) {
          const status = checksStatusLookup[check.id];
          if (status === "success") {
            report.completed?.push(check.id);
            report.succeeded?.push(check.id);
          }
          if (status === "failure") {
            report.completed?.push(check.id);
            report.failed?.push(check.id);
          }
          if (status === "pending") {
            report.running?.push(check.id);
          }
        }
      }
      /* eslint-enable security/detect-object-injection */
    });
  });
  return report;
};

export const generateProgressSummary = (
  subprojects: SubProjConfig[],
  checksStatusLookup: Record<string, string>,
): string => {
  const report = generateProgressReport(subprojects, checksStatusLookup);
  const message = `Progress: ${report.completed?.length} completed, ${report.running?.length} pending`;
  return message;
};

export const statusToMark = (
  check: string,
  checksStatusLookup: Record<string, string>,
): string => {
  if (check in checksStatusLookup) {
    if (checksStatusLookup[check] == "success") {
      return "✅";
    }
    if (checksStatusLookup[check] == "failure") {
      return "❌";
    }
  } else {
    return "⌛";
  }
  return "❓";
};

/**
 * Generates a progress report for currently finished checks
 * which will be posted in the status check report.
 *
 * @param subprojects The subprojects that the PR matches.
 * @param checksStatusLookup The lookup table for checks status.
 */
export const generateProgressDetails = (
  subprojects: SubProjConfig[],
  checksStatusLookup: Record<string, string>,
): string => {
  let progress = "";

  // these are the required subprojects
  subprojects.forEach((subproject) => {
    progress += `Summary for sub-project ${subproject.id}\n`;
    // for padding
    const longestLength = Math.max(...(subproject.checks.map(check => check.id.length)));
    subproject.checks.forEach((check) => {
      const mark = statusToMark(check.id, checksStatusLookup);
      let status = (check.id in checksStatusLookup) ? checksStatusLookup[check.id] : 'no_status'
      status = status || 'undefined';
      progress += `${check.id.padEnd(longestLength, ' ')} | ${mark} | ${status.padEnd(12, ' ')}\n`;
    });
    progress += "\n\n";
  });
  progress += "\n";

  progress += "## Currently received checks\n";
  let longestLength = 1;
  for (const availableCheck in checksStatusLookup) {
    longestLength = Math.max(longestLength, availableCheck.length);
  }
  for (const availableCheck in checksStatusLookup) {
    const mark = statusToMark(availableCheck, checksStatusLookup);
    let status = (availableCheck in checksStatusLookup) ? checksStatusLookup[availableCheck] : 'no_status'
    status = status || 'undefined';
    progress += `${availableCheck.padEnd(longestLength, ' ')} | ${mark} | ${status.padEnd(12, ' ')}\n`;
  }
  progress += "\n";
  return progress;
};
