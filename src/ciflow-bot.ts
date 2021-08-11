import * as probot from 'probot';
import minimist from 'minimist';

// The CIFlowBot helps to dispatch labels and signal GitHub Action workflows to run.
// For more details about the design, please refer to the RFC: https://github.com/pytorch/pytorch/issues/61888
// Currently it supports strong validation and slow rollout, and it runs through a pipeline of dispatch strategies.
export class CIFlowBot {
  // Constructor required
  readonly ctx: probot.Context;

  // Static readonly configurations
  static readonly command_ciflow = 'ciflow';
  static readonly command_ciflow_rerun = 'rerun';
  static readonly allowed_commands: string[] = [CIFlowBot.command_ciflow];

  static readonly bot_assignee = 'pytorchbot';
  static readonly event_issue_comment = 'issue_comment';
  static readonly event_pull_request = 'pull_request';
  static readonly pr_label_prefix = 'ciflow/';
  static readonly rollout_users = ['zhouzhuojie']; // slow rollout to specific group of users first
  static readonly strategy_add_default_labels = 'strategy_add_default_labels';

  // Stateful instance variables
  command = '';
  command_args: minimist.ParsedArgs;
  comment_id = 0;
  comment_author = '';
  comment_author_permission = '';
  comment_body = '';
  dispatch_labels: string[] = [];
  dispatch_strategies = [CIFlowBot.strategy_add_default_labels];
  event = '';
  owner = '';
  pr_author = '';
  pr_labels: string[] = [];
  pr_number = 0;
  repo = '';

  constructor(ctx: probot.Context) {
    this.ctx = ctx;
  }

  valid(): boolean {
    if (
      this.event !== CIFlowBot.event_pull_request &&
      this.event !== CIFlowBot.event_issue_comment
    ) {
      this.ctx.log.error({ctx: this.ctx}, 'Unknown webhook event');
      return false;
    }

    // validate the issue_comment event
    if (this.event === CIFlowBot.event_issue_comment) {
      if (!CIFlowBot.allowed_commands.includes(this.command)) {
        return false;
      }

      if (
        this.comment_author !== this.pr_author &&
        !(
          this.comment_author_permission === 'admin' ||
          this.comment_author_permission === 'write'
        )
      ) {
        return false;
      }
    }

    // validate the pull_request event, so far we just return true
    return true;
  }

  async getUserPermission(username: string): Promise<string> {
    const res = await this.ctx.github.repos.getCollaboratorPermissionLevel({
      owner: this.owner,
      repo: this.repo,
      username
    });
    return res?.data?.permission;
  }

  rollout(): boolean {
    if (CIFlowBot.rollout_users.includes(this.pr_author)) {
      return true;
    }
    return false;
  }

  async dispatch(): Promise<void> {
    // Dispatch_strategies is like a pipeline of functions we can apply to
    // change `this.dispatch_labels`. We can add other dispatch algorithms
    // based on the ctx or user instructions.
    // The future algorithms can manupulate the `this.dispatch_labels`, and
    // individual workflows that can build up `if` conditions on the labels
    // can be found in `.github/workflows` of pytorch/pytorch repo.
    this.dispatch_strategies.map(this.dispatchStrategyFunc.bind(this));

    // Signal the dispatch to GitHub
    await this.setLabels();
    await this.signalGithub();

    // Logging of the dispatch
    this.ctx.log.info(
      {
        dispatch_labels: this.dispatch_labels,
        dispatch_strategies: this.dispatch_strategies,
        event: this.event,
        owner: this.owner,
        pr_number: this.pr_number,
        pr_labels: this.pr_labels,
        repo: this.repo
      },
      'ciflow dispatch success!'
    );
  }

  dispatchStrategyFunc(strategyName: string): void {
    switch (strategyName) {
      case CIFlowBot.strategy_add_default_labels:
        // strategy_add_default_labels: just make sure the we add a 'ciflow/default' to the existing set of pr_labels
        if (this.dispatch_labels.length === 0) {
          this.dispatch_labels = this.pr_labels;
        }
        this.dispatch_labels = ['ciflow/default', ...this.dispatch_labels];
        break;
      default: {
        this.ctx.log.error({strategyName}, 'Unknown dispatch strategy');
        break;
      }
    }
  }

  // signalGithub sends a signal to GitHub to trigger the dispatch
  // The logic here is leverage some event that's rarely triggered by other users or bots,
  // thus we pick "assign/unassign" to begin with. See details from the CIFlow RFC:
  // https://github.com/pytorch/pytorch/issues/61888
  async signalGithub(): Promise<void> {
    await this.ctx.github.issues.addAssignees({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.pr_number,
      assignees: [CIFlowBot.bot_assignee]
    });

    await this.ctx.github.issues.removeAssignees({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.pr_number,
      assignees: [CIFlowBot.bot_assignee]
    });

    if (this.event === CIFlowBot.event_issue_comment) {
      await this.ctx.github.reactions.createForIssueComment({
        comment_id: this.comment_id,
        content: '+1',
        owner: this.owner,
        repo: this.repo
      });
    }
  }

  async setLabels(): Promise<void> {
    const labels = this.dispatch_labels.filter(label =>
      label.startsWith(CIFlowBot.pr_label_prefix)
    );
    const labelsToDelete = this.pr_labels.filter(l => !labels.includes(l));
    const labelsToAdd = labels.filter(l => !this.pr_labels.includes(l));
    for (const label of labelsToDelete) {
      await this.ctx.github.issues.removeLabel({
        owner: this.ctx.payload.repository.owner.login,
        repo: this.ctx.payload.repository.name,
        issue_number: this.pr_number,
        name: label
      });
    }

    // skip addLabels if there's no label to add
    if (labelsToAdd.length > 0) {
      await this.ctx.github.issues.addLabels({
        owner: this.ctx.payload.repository.owner.login,
        repo: this.ctx.payload.repository.name,
        issue_number: this.pr_number,
        labels: labelsToAdd
      });
    }
    this.dispatch_labels = labels;
  }

  parseCommandArgs(): boolean {
    switch (this.command) {
      case CIFlowBot.command_ciflow: {
        if (this.command_args._.length === 0) {
          return false;
        }
        const subCommand = this.command_args._[0];
        if (subCommand !== CIFlowBot.command_ciflow_rerun) {
          return false;
        }
        if (typeof this.command_args.l === 'string') {
          this.command_args.l = [this.command_args.l];
        }
        for (const label of this.command_args.l || []) {
          this.dispatch_labels.push(label);
        }
        break;
      }
      default:
        return false;
    }

    return true;
  }

  parseComment(): boolean {
    // considering the `m` multi-line comment match
    const re = new RegExp(
      `^.*@${CIFlowBot.bot_assignee}\\s+(\\w+)\\s+(.*)$`,
      'm'
    );

    const found = this.comment_body?.match(re);
    if (!found) {
      return false;
    }

    if (found.length >= 2) {
      this.command = found[1];
    }
    if (found.length === 3) {
      this.command_args = minimist(found[2].split(/\s+/));
    }

    return this.parseCommandArgs();
  }

  async setContext(): Promise<boolean> {
    this.event = this.ctx.name;
    const pr = this.ctx.payload?.pull_request || this.ctx.payload?.issue;
    this.pr_number = pr?.number;
    this.pr_author = pr?.user?.login;
    this.pr_labels = pr?.labels
      ?.filter(label => label.name.startsWith(CIFlowBot.pr_label_prefix))
      ?.map(label => label.name);
    this.owner = this.ctx.payload?.repository?.owner?.login;
    this.repo = this.ctx.payload?.repository?.name;

    if (this.event === CIFlowBot.event_issue_comment) {
      this.comment_author = this.ctx.payload?.comment?.user?.login;
      this.comment_body = this.ctx.payload?.comment?.body;
      this.comment_id = this.ctx.payload?.comment?.id;

      // if parseComment returns false, we don't need to do anything
      if (!this.parseComment()) {
        return false;
      }

      const permission = await this.getUserPermission(this.comment_author);
      this.comment_author_permission = permission;
    }

    return this.valid();
  }

  async handler(): Promise<void> {
    const isValid = await this.setContext();
    const isRollout = this.rollout();

    this.ctx.log.info(
      {
        command: this.command,
        command_args: this.command_args,
        comment_author: this.comment_author,
        comment_author_permission: this.comment_author_permission,
        dispatch_labels: this.dispatch_labels,
        dispatch_strategies: this.dispatch_strategies,
        event: this.event,
        owner: this.owner,
        pr_author: this.pr_author,
        pr_labels: this.pr_labels,
        pr_number: this.pr_number,
        repo: this.repo,
        rollout: isRollout,
        valid: isValid
      },
      'ciflow dispatch started!'
    );

    if (!isValid || !isRollout) {
      return;
    }
    await this.dispatch();
  }

  static main(app: probot.Application): void {
    const webhookHandler = async (ctx: probot.Context): Promise<void> => {
      await new CIFlowBot(ctx).handler();
    };
    app.on('pull_request.opened', webhookHandler);
    app.on('pull_request.reopened', webhookHandler);
    app.on('pull_request.synchronize', webhookHandler);
    app.on('issue_comment.created', webhookHandler);
    app.on('issue_comment.edited', webhookHandler);
  }
}
