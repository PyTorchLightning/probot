import { CheckResult, SubProjConfig } from "../types";
import { Context } from "probot";
import { parse } from "path";


const statusToMark = (
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

export const generateProgressDetailsCLI = (
  subprojects: SubProjConfig[],
  postedChecks: Record<string, string>,
): string => {
  let progress = "";

  // these are the required subprojects
  subprojects.forEach((subproject) => {
    progress += `Summary for sub-project ${subproject.id}\n`;
    // for padding
    const longestLength = Math.max(...(subproject.checks.map(check => check.id.length)));
    subproject.checks.forEach((check) => {
      const mark = statusToMark(check.id, postedChecks);
      let status = (check.id in postedChecks) ? postedChecks[check.id] : 'no_status'
      status = status || 'undefined';
      progress += `${check.id.padEnd(longestLength, ' ')} | ${mark} | ${status.padEnd(12, ' ')}\n`;
    });
    progress += "\n\n";
  });
  progress += "\n";

  progress += "## Currently received checks\n";
  let longestLength = 1;
  for (const availableCheck in postedChecks) {
    longestLength = Math.max(longestLength, availableCheck.length);
  }
  for (const availableCheck in postedChecks) {
    const mark = statusToMark(availableCheck, postedChecks);
    let status = (availableCheck in postedChecks) ? postedChecks[availableCheck] : 'no_status'
    status = status || 'undefined';
    progress += `${availableCheck.padEnd(longestLength, ' ')} | ${mark} | ${status.padEnd(12, ' ')}\n`;
  }
  progress += "\n";
  return progress;
};

export const generateProgressDetailsMarkdown = (
  subprojects: SubProjConfig[],
  postedChecks: Record<string, string>,
): string => {
  let progress = "## Groups summary\n";
  subprojects.forEach((subproject) => {
    progress += `### ${subproject.id}\n`;
    progress += "| Check ID | Status |\n";
    progress += "| -------- | ------ |\n";
    subproject.checks.forEach((check) => {
      const mark = statusToMark(check.id, postedChecks);
      let status = (check.id in postedChecks) ? postedChecks[check.id] : 'no_status'
      status = status || 'undefined';
      progress += `| ${check.id} | ${mark}: ${status} |\n`;
    });
    progress += "\n";
  });
  progress += "\n";
  return progress;
};

const PR_COMMENT_START = "<!-- checkgroup-comment-start -->";

function formPrComment(
  conclusion: CheckResult,
  inputs: Record<string, any>,
  subprojects: SubProjConfig[],
  postedChecks: Record<string, string>
): string {
  let parsedConclusion = conclusion.replace("_", " ")
  // capitalize
  parsedConclusion = parsedConclusion.charAt(0).toUpperCase() + parsedConclusion.slice(1);
  const hasFailed = conclusion === "has_failure"
  const conclusionEmoji = (conclusion === "all_passing") ? "🟢": (hasFailed) ? "🔴" : "🟡"
  const failedMesage = (
    `\n> This job will need to be re-run to merge your PR.`
    + ` If you do not have write access to the repository you can ask ${inputs.maintainers} to re-run it for you.`
    + ` If you have any other questions, you can reach out to ${inputs.owner} for help.`
  )
  const progressDetails = generateProgressDetailsMarkdown(subprojects, postedChecks)
  return (
    PR_COMMENT_START
    + `\n# ⚡ Required checks status: ${parsedConclusion} ${conclusionEmoji}`
    + ((hasFailed) ? failedMesage : "")
    + ((subprojects.length) ? `\n${progressDetails}` : "\nNo groups match the files changed in this PR.")
    + "\n\n---"
    + `\nThis comment was automatically generated and updates for ${inputs.timeout} minutes `
    + `every ${inputs.interval} seconds.`
  )
}

async function getPrComment(context: Context): Promise<{id: number; body: string}> {
  const params = context.issue()
  const commentsRes = await context.octokit.rest.issues.listComments(params);
  for (const comment of commentsRes.data) {
    if (comment.body!.includes(PR_COMMENT_START)) {
      return {id: comment.id, body: comment.body!};
    }
  }
  return {id: 0, body: ""};
}


export async function commentOnPr(
  context: Context,
  conclusion: CheckResult,
  inputs: Record<string, any>,
  subprojects: SubProjConfig[],
  postedChecks: Record<string, string>,
) {
  const existingData = await getPrComment(context);
  context.log.debug(`existingData: ${JSON.stringify(existingData)}`)
  const newComment = formPrComment(conclusion, inputs, subprojects, postedChecks);
  if (existingData.body === newComment) {
    return;
  }
  if (existingData.id === 0) {
    await context.octokit.issues.createComment(context.issue({body: newComment}));
  } else {
    await context.octokit.issues.updateComment(
      context.repo({body: newComment, comment_id: existingData.id})
    );
  }
}