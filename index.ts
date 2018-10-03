#!/usr/bin/env node
import * as child from 'child_process';
import commander from 'commander';
import chalk from 'chalk';

// command line options
commander
    .option('--json', 'get json output')
    .parse(process.argv);


// define the host objects
interface Host {
    hostName: string,
    hostIp: string,
    stats: any
}

// configuration, what do we want to scan?
let buildmacList: Array<Host> = [
    { hostName: 'buildmac11', hostIp: '10.104.97.48', stats: {} },
    { hostName: 'buildmac13', hostIp: '10.104.97.60', stats: {} },
    { hostName: 'buildmac14', hostIp: '10.104.97.43', stats: {} },
    { hostName: 'buildmac15', hostIp: '10.104.97.59', stats: {} }
];

// test results array of hosts scanned
let hostResults: Array<Host> = [];

let processInfoResponse: string = chalk.underline(`\n${padRight('HOST', 15)}${padRight('Appium', 15)}${padRight('%CPU', 10)}${padRight('%MEM', 10)}${padRight('Disk Free', 10)}\n\n`);

console.log('Checking Hosts...');

for (let host of buildmacList) {
    // get the 'df' disk free result, grep -v to filter out the header line
    let driveSpaceResponse = child.execSync(`ssh -T buildmac@${host.hostIp} "df -h / | grep -v Filesystem"`).toString().split(/\s+/);
    try {
        // get only appium process info, and only cpu, mem and args stats
        let processInfoResponseRows = child.execSync(`ssh -T buildmac@${host.hostIp} "ps ax -o %cpu -o %mem -o args | grep -v grep | grep 'appium -p'"`).toString().trim().split('\n');
        for (let row of processInfoResponseRows) {

            // get an array of the 'ps' output
            let rowArr = row.trim().split(/\s+/);
            // if there's nothing here to parse, move on to the next host
            if (rowArr.length < 2) { break };

            let targetOs: string = '';
            let targetOsColor: string = '';
            // save targetOs for regular output, and targetOsColor (padded before color chars added, then color set for console display)
            if (row.toLowerCase().indexOf('android') >= 0) {
                targetOs = 'android';
                targetOsColor = chalk.green(padRight(targetOs, 15));
            } else if (row.toLowerCase().indexOf('mac') >= 0) {
                targetOs = 'ios';
                targetOsColor = chalk.yellow(padRight(targetOs, 15));
            } else {
                // skip the header row
                continue;
            }
            host.stats = { cpu: rowArr[0], mem: rowArr[1], appium: targetOs, diskFree: driveSpaceResponse[3] };
            hostResults.push(host);

            processInfoResponse += `${padRight(host.hostName, 15)}${targetOsColor}${padRight(host.stats.cpu + '%', 10)}${padRight(host.stats.mem + '%', 10)}${padRight(host.stats.diskFree, 10)}\n`;

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

function padRight(text: string, width: number, pad: string = ' '): string {
    if (text.length > width) {
        return text;
    }
    let padding = pad.repeat(width - text.length);
    return text + padding;
}
