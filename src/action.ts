// Require your Probot app's entrypoint, usually this is just index.js
import botSteps from "./index";
// Require the adapter
import probot from "@probot/adapter-github-actions";

// Adapt the Probot app for Actions
// This also acts as the main entrypoint for the Action
probot.run(botSteps);
