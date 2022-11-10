import autoCcBot from "./auto-cc/auto-cc-bot";
import checkGroupApp from "./check-group/index";
import { Probot } from "probot";
import * as core from "@actions/core";

export default function botSteps(app: Probot): void {
  const job = core.getInput("job");
  if (job === "auto-cc") {
    autoCcBot(app);
  } else if (job === "check-group") {
    checkGroupApp(app);
  } else {
    throw new Error(`Job ${job} should be one of ['auto-cc', 'check-group']`);
  }
}
