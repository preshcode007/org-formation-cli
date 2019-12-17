import { Command } from 'commander';
import { CloudFormationBinder } from '../cfn-binder/cfn-binder';
import { CfnTaskRunner } from '../cfn-binder/cfn-task-runner';
import { ConsoleUtil } from '../console-util';
import { ITemplate, TemplateRoot } from '../parser/parser';
import { BaseCliCommand, ICommandArgs } from './base-command';

const commandName = 'delete-stacks <stack-name>';
const commandDescription = 'removes all stacks deployed to accounts using org-formation';

export class DeleteStacksCommand extends BaseCliCommand<IDeleteStackCommandArgs> {

    constructor(command: Command) {
        super(command, commandName, commandDescription, 'stackName');
    }

    public addOptions(command: Command) {
        super.addOptions(command);
    }

    public async performCommand(command: IDeleteStackCommandArgs) {
        const stackName = command.stackName;

        const state = await this.getState(command);
        const orgTemplate = JSON.parse(state.getPreviousTemplate()) as ITemplate;
        delete orgTemplate.Resources;
        const emptyTemplate = TemplateRoot.createFromContents(JSON.stringify(orgTemplate));

        const cfnBinder = new CloudFormationBinder(stackName, emptyTemplate, state);

        const cfnTasks = cfnBinder.enumTasks();
        if (cfnTasks.length === 0) {
            ConsoleUtil.LogInfo('no work to be done.');
        } else {
            await CfnTaskRunner.RunTasks(cfnTasks, stackName);
            ConsoleUtil.LogInfo('done');
        }

        await state.save();
    }
}

interface IDeleteStackCommandArgs extends ICommandArgs {
    stackName: string;
}
