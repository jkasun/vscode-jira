'use strict';
import * as vscode from 'vscode';
import { jira } from './modules/jira';

export function activate(context: vscode.ExtensionContext) {

    const OK = 'Sure';
    const CANCEL = 'Not now';

    vscode.window.showInformationMessage('Hello, Let\'s Log Some Work!!!', 'Sure', 'Not Now').then(state => {
        switch (state) {
            case OK:
                jira.startWorkLog();
                break;

            case CANCEL:
                break;
        }
    });

    let disposable = vscode.commands.registerCommand('extension.startWorkLog', () => {
        jira.startWorkLog();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}