import {Probot, Context} from 'probot';

export function repoKey(context: Context): string {
  const repo = context.repo();
  return `${repo.owner}/${repo.repo}`;
}

export class CachedConfigTracker {
  repoConfigs = {};

  constructor(app: Probot) {
    app.on('push', async context => {
      if (context.payload.ref === 'refs/heads/master') {
        await this.loadConfig(context, /* force */ true);
      }
    });
  }

  async loadConfig(context: Context, force = false): Promise<object> {
    const key = repoKey(context);
    if (!(key in this.repoConfigs) || force) {
      context.log({key}, 'loadConfig');
      this.repoConfigs[key] = await context.config('lightning-probot.yml');
    }
    return this.repoConfigs[key];
  }
}

export class CachedIssueTracker extends CachedConfigTracker {
  repoIssues = {};
  configName: string;
  issueParser: (data: string) => object;

  constructor(
    app: Probot,
    configName: string,
    issueParser: (data: string) => object
  ) {
    super(app);
    this.configName = configName;
    this.issueParser = issueParser;

    app.on('issues.edited', async context => {
      const config = await this.loadConfig(context);
      const issue = context.issue();
      if (config[this.configName] === issue.issue_number) {
        await this.loadIssue(context, /* force */ true);
      }
    });
  }

  async loadIssue(context: Context, force = false): Promise<object> {
    const key = repoKey(context);
    if (!(key in this.repoIssues) || force) {
      context.log({key}, 'loadIssue');
      const config = await this.loadConfig(context);
      if (config != null && this.configName in config) {
        const subsPayload = await context.octokit.issues.get(
          context.repo({issue_number: config[this.configName]})
        );
        const subsText = subsPayload.data['body'];
        context.log({subsText});
        this.repoIssues[key] = this.issueParser(subsText);
      } else {
        context.log(
          `${this.configName} is not found in config, initializing with empty string`
        );
        this.repoIssues[key] = this.issueParser('');
      }
      context.log({parsedIssue: this.repoIssues[key]});
    }
    return this.repoIssues[key];
  }
}

export function parseSubscriptions(rawSubsText): object {
  const subsText = rawSubsText.replace('\r', '');
  const subsRows = subsText.match(/^\*.+/gm);
  const subscriptions = {};
  if (subsRows == null) {
    return subscriptions;
  }
  subsRows.forEach((row: string) => {
    const labelMatch = row.match(/^\* +([^@]+)/);
    if (labelMatch) {
      const label = labelMatch[1].trim();
      const users = row.match(/@[a-zA-Z0-9-/]+/g);
      if (users) {
        subscriptions[label] = users.map(u => u.substring(1));
      }
    }
  });
  return subscriptions;
}
