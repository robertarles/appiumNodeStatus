#!/usr/bin/env node
import * as child from 'child_process';
import commander from 'commander';
let chalk = require('chalk');

commander
    .option('--json', 'get json output')
    .parse(process.argv);

interface Host {
    hostName: string,
    hostIp: string,
    stats: any
}

let buildmacList: Array<Host> = [
    { hostName: 'buildmac11', hostIp: '10.104.97.48', stats: {} },
    { hostName: 'buildmac13', hostIp: '10.104.97.60', stats: {} },
    { hostName: 'buildmac14', hostIp: '10.104.97.43', stats: {} },
    { hostName: 'buildmac15', hostIp: '10.104.97.59', stats: {} }
];

let hostResults: Array<Host> = [];

let processInfoResponse: string = chalk.underline('\nHOST\t\t%CPU\t %MEM\tAppium\t\tDisk Free\n\n');

for (let host of buildmacList) {

    // get the 'df' disk free result, grep -v to filter out the header line
    let driveSpaceResponse = child.execSync(`ssh -T buildmac@${host.hostIp} "df -h / | grep -v Filesystem"`).toString().split(/\s+/);

    try {
        // get only appium process info, and only cpu, mem and args stats
        let processInfoResponseRows = child.execSync(`ssh -T buildmac@${host.hostIp} "ps ax -o %cpu -o %mem -o args | grep -v grep | grep -E '(appium -p|%CPU)'"`).toString().split('\n');
        for (let row of processInfoResponseRows) {
            let rowArr = row.split(/\s+/);
            if (rowArr.length < 2) { break };
            let targetOs: string = 'TargetOS';
            if (row.toLowerCase().indexOf('android') >= 0) {
                targetOs = chalk.green('android');
            } else if (row.toLowerCase().indexOf('mac') >= 0) {
                targetOs = chalk.yellow('ios');
            } else {
                // skip the header row
                continue;
            }
            host.stats = { cpu: rowArr[1], mem: rowArr[2], appium: targetOs, diskFree: driveSpaceResponse[3] };
            hostResults.push(host);

            processInfoResponse += `${host.hostName}\t%${host.stats.cpu}\t%${host.stats.mem}\t${host.stats.appium}\t\t${host.stats.diskFree}\n`;
        }
    } catch (e) {
        console.log(e.message);
    }
}


// output!
if (commander.json) {
    console.log(JSON.stringify(hostResults));
} else {
    console.log(processInfoResponse);
}