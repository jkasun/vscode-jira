import * as vscode from 'vscode';
import { JiraAPI } from './../libs/jira';
import { host, username, password } from './../config';

export namespace jira {

    let jiraApi = new JiraAPI(host, username, password);;

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
                    vscode.window.showWarningMessage("No Task Selected, Do you want to repick?", "YES", "NO");
                    return;
                }

                workLog.issueKey = tasks[openTasks.indexOf(task)].key;
                inputDate();
            });
        }).catch(err => {
            console.log(err);
            vscode.window.showErrorMessage(err.message);
        });
    };

    let inputDate = () => {
        vscode.window.showInputBox({
            prompt: 'Please Enter the date Ex.. 2018-06-21',
            placeHolder: 'Date',
            value: JiraAPI.getDateString(new Date()),
            ignoreFocusOut: true
        }).then((value) => {
            workLog.date = value;
            inputTime();
        })
    }

    let inputTime = () => {
        vscode.window.showInputBox({
            prompt: 'Please Enter the time spent (ex.. 1d 2h 3m)',
            placeHolder: 'Time Spent',
            ignoreFocusOut: true
        }).then((value) => {
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
            workLog.comment = value;
        })
    };

    let exit = () => {
        workLog = {};
        vscode.window.showErrorMessage('Error: Logging work is terminated', 'Restart', 'Log Later');
    }

    let logTime = () => {

    };

};