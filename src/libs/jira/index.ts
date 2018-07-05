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
                if(err) {
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

    public logWork(issueKey: string, date: string, timeSpent: string, comment: string) {
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
        }, (...args) => {
            console.log(args[2]);
        })
    }

    static getDateString(d: Date): string {
        let format = (value) => {
            return value < 10 ? '0' + value : value;
        }
        return d.getFullYear + format(d.getMonth()) + '-' + format(d.getDate());
    }

    static getTimeString(value: number) {
        let hr = Math.floor(value / 3600);
        let mn = Math.floor((value - hr * 3600) / 60);
        return `${hr === 0 ? '': hr + 'h'} ${(mn === 0 && hr !== 0) ? '' : mn + 'm'}`
    }
}