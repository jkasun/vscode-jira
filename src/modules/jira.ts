import * as vscode from 'vscode';
import { JiraAPI } from './../libs/jira';
import { host, username, password, TRANSITION } from './../config';

export namespace jira {
    let jiraApi = new JiraAPI(host, username, password);;
    let selectedIssue: any;

    let workLog: {
        issueKey?: string,
        date?: string,
        timeSpent?: string,
        comment?: string
    } = {};

    export let startWorkLog = () => {
        selectTask();
    }

    let selectTask = () => {
        jiraApi.getOpenTasks().then(tasks => {
            let openTasks: Array<any> = [];

            tasks.forEach(task => {
                openTasks.push(`${task.fields.summary} Rem: ${JiraAPI.getTimeString(task.fields.timeestimate)}`);
            });

            vscode.window.showQuickPick(openTasks, {
                placeHolder: 'Select Your Task',
                ignoreFocusOut: true
            }).then((task) => {
                if (!task) {
                    exit(selectTask);
                    return;
                }

                workLog.issueKey = tasks[openTasks.indexOf(task)].key;
                selectedIssue = tasks[openTasks.indexOf(task)];
                inputDate();
            });
        }).catch(err => {
            vscode.window.showErrorMessage(err.message);
        });
    };

    let inputDate = (): void => {
        let todayString = JiraAPI.getDateString(new Date());

        vscode.window.showInputBox({
            prompt: `Please Enter the date Ex.. ${todayString}`,
            placeHolder: 'Date',
            value: todayString,
            ignoreFocusOut: true
        }).then((value) => {
            if (!value) {
                exit(inputDate);
                return;
            }

            workLog.date = value;
            inputTime();
        })
    }

    let inputTime = (): void => {
        vscode.window.showInputBox({
            prompt: 'Please Enter the time spent (ex.. 1d 2h 3m)',
            placeHolder: 'Time Spent',
            ignoreFocusOut: true
        }).then((value) => {
            if (!value) {
                exit(inputTime);
                return;
            }

            workLog.timeSpent = value;
            inputComment();
        })
    };

    let inputComment = () => {
        vscode.window.showInputBox({
            prompt: 'Please enter a comment of your work',
            placeHolder: 'Comment',
            ignoreFocusOut: true
        }).then(value => {
            if (!value) {
                exit(inputComment);
                return;
            }

            workLog.comment = value;
            logTime();
        })
    };

    let exit = (continueCallback?: Function) => {
        workLog = {};
        vscode.window.showWarningMessage('Are you sure you want to exit worklog?', 'CONTINUE', 'EXIT').then(input => {
            switch (input) {
                case "CONTINUE":
                    if (continueCallback) {
                        continueCallback();
                    }
                    break;
            }
        });
    }

    let markSelectedIssueDone = () => {
        jiraApi.updateState(selectedIssue.key, TRANSITION.Done.id);
    };

    let markSelectedIssueInProgress = () => {
        jiraApi.updateState(selectedIssue.key, TRANSITION.InProgress.id);
    };

    let logTime = () => {
        if (workLog.issueKey && workLog.date && workLog.timeSpent && workLog.comment) {
            jiraApi.logWork(
                workLog.issueKey,
                workLog.date,
                workLog.timeSpent,
                workLog.comment
            ).then(() => {
                if (selectedIssue) {
                    if (selectedIssue.fields.status.name === TRANSITION.Todo.name) {
                        vscode.window.showInformationMessage('Task State is set as In Progress');
                        markSelectedIssueInProgress();
                    };

                    checkRemaining();
                }
            });
        }

        checkRemaining();
    };

    let checkRemaining = () => {
        jiraApi.getIssueByKey(selectedIssue.key).then((issue: any) => {
            console.log(issue);
            if (issue.fields.timeestimate === 0) {
                vscode.window.showInformationMessage("The remaining time has set to 0m.", 'Set to 1h', 'Mark Task Done', 'Set To ..')
                    .then(input => {
                        switch (input) {
                            case "Mark Task Done":
                                markSelectedIssueDone();
                                break;

                            case 'Set To ..':
                                vscode.window.showInputBox({
                                    prompt: 'Enter the new remaining amount',
                                    placeHolder: 'Remaining Time Ex.. 1d 2h 5m',
                                    ignoreFocusOut: true
                                }).then((value) => {
                                    if (!value) {
                                        return;
                                    }

                                    jiraApi.setRemainingTime(selectedIssue.key, value);
                                })
                                break;

                            case "Set to 1h":
                            default:
                                jiraApi.setRemainingTime(selectedIssue.key, '1h');
                                break;
                        }
                    });
            }
        })
    };

};