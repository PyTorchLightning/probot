import {CachedIssueTracker, parseSubscriptions} from './utils';
import {Probot, Context} from 'probot';

function myBot(app: Probot): void {
  const tracker = new CachedIssueTracker(
    app,
    'tracking_issue',
    parseSubscriptions
  );

  async function loadSubscriptions(context: Context): Promise<object> {
    return tracker.loadIssue(context);
  }

  async function runBotForLabels(context: Context): Promise<void> {
    const subscriptions = await loadSubscriptions(context);
    const contextName = context.name;
    if (!['pull_request', 'issues'].includes(contextName)) {
      throw new Error(
        `name ${contextName} should be one of ['pull_request', 'issues']`
      );
    }
    // the context and payload names do not match
    const name = contextName === 'issues' ? 'issue' : contextName;
    const labels = context.payload[name]['labels'].map(e => e['name']);
    context.log({labels});
    const cc = new Set();
    labels.forEach(l => {
      if (l in subscriptions) {
        subscriptions[l].forEach(u => cc.add(u));
      }
    });
    context.log({cc: Array.from(cc)}, 'from subscriptions');
    if (cc.size) {
      const body = context.payload[name]['body'];
      const reCC = /cc( +@[a-zA-Z0-9-/]+)+/;
      const oldCCMatch = body ? body.match(reCC) : null;
      const prevCC = new Set();
      if (oldCCMatch) {
        const oldCCString = oldCCMatch[0];
        context.log({oldCCString}, 'previous cc string');
        let m;
        const reUsername = /@([a-zA-Z0-9-/]+)/g;
        while ((m = reUsername.exec(oldCCString)) !== null) {
          prevCC.add(m[1]);
          cc.add(m[1]);
        }
        context.log({prevCC: Array.from(prevCC)}, 'pre-existing ccs');
      }
      // Invariant: prevCC is a subset of cc
      if (prevCC.size !== cc.size) {
        let newCCString = 'cc';
        cc.forEach(u => {
          newCCString += ` @${u}`;
        });
        const newBody = body
          ? oldCCMatch
            ? body.replace(reCC, newCCString)
            : `${body}\n\n${newCCString}`
          : newCCString;
        context.log({newBody});
        if (name === 'issue') {
          await context.octokit.issues.update(context.issue({body: newBody}));
        } else if (name === 'pull_request') {
          await context.octokit.pulls.update(
            context.pullRequest({body: newBody})
          );
        }
      } else {
        context.log('no action: no change from existing cc list on issue');
      }
    } else {
      context.log('no action: cc list from subscription is empty');
    }
  }

  app.on(
    [
      'issues.labeled',
      'pull_request.labeled',
      // If the bot is disabled for draft PRs, we want to run it when the PR is marked as ready
      'pull_request.ready_for_review'
    ],
    async context => await runBotForLabels(context)
  );
}

export default myBot;
