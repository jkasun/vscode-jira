var JiraClient = require('jira-connector');

export class JiraAPI {

    jiraClient: any;

    constructor(host: string, username: string, password: string) {
        this.jiraClient = new JiraClient({
            host,
            basic_auth: {
                username,
                password
            }
        });
    }

    public getOpenTasks(): Promise<Array<any>> {
        return new Promise((res, rej) => {
            this.jiraClient.search.search({
                'jql': 'assignee = currentUser() AND status != closed AND status != done'
            }, function (err, result) {
                if (err) {
                    rej(err);
                }

                let openTasks: Array<any> = [];

                result.issues.forEach(issue => {
                    openTasks.push(issue);
                });

                res(openTasks);
            })
        });
    }

    public logWork(issueKey: string, date: string, timeSpent: string, comment: string): Promise<any> {
        return new Promise((res, rej) => {
            if (!date) {
                date = JiraAPI.getDateString(new Date());
            }

            this.jiraClient.issue.addWorkLog({
                issueKey,
                adjustEstimate: 'auto',
                worklog: {
                    started: `${date}T10:10:00.000+0530`,
                    timeSpent,
                    comment
                }
            }, (err, ...args) => {
                if (err) {
                    return rej(err);
                }
                res(args);
            })
        });
    }

    public updateState(issueKey: string, transitionId: number) {
        this.jiraClient.issue.transitionIssue({
            issueKey,
            transition: {
                id: transitionId
            }
        })
    }

    public getAllStates(issueKey) {
        return new Promise((res, rej) => {
            this.jiraClient.issue.getTransitions({
                issueKey
            }, (err, transitions) => {
                if (err) {
                    return rej(err);
                }

                res(transitions);
            })
        })
    }

    public getIssueByKey(issueKey: string) {
        return new Promise((res, rej) => {
            this.jiraClient.issue.getIssue({
                issueKey
            }, function (error, issue: any) {
                if (error) {
                    return rej(error);
                }
                res(issue);
            });
        })
    }

    public setRemainingTime(issueKey: string, remainingEstimate: string) {
        this.jiraClient.issue.editIssue({
            issueKey,
            issue: {
                update: {
                    timetracking: [{
                        edit: {
                            remainingEstimate
                        }
                    }]
                }
            }
        }, function (error, issue) {
            console.log(issue);
        });
    }

    static getDateString(d: Date): string {
        let format = (value) => {
            return value < 10 ? '0' + value : value;
        }
        return d.getFullYear() + '-' + format(d.getMonth()) + '-' + format(d.getDate());
    }

    static getTimeString(value: number) {
        let hr = Math.floor(value / 3600);
        let mn = Math.floor((value - hr * 3600) / 60);
        return `${hr === 0 ? '' : hr + 'h'} ${(mn === 0 && hr !== 0) ? '' : mn + 'm'}`
    }
}