#!/usr/bin/env node
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child = __importStar(require("child_process"));
const commander_1 = __importDefault(require("commander"));
let chalk = require('chalk');
commander_1.default
    .option('--json', 'get json output')
    .parse(process.argv);
let buildmacList = [
    { hostName: 'buildmac11', hostIp: '10.104.97.48', stats: {} },
    { hostName: 'buildmac13', hostIp: '10.104.97.60', stats: {} },
    { hostName: 'buildmac14', hostIp: '10.104.97.43', stats: {} },
    { hostName: 'buildmac15', hostIp: '10.104.97.59', stats: {} }
];
let hostResults = [];
let processInfoResponse = chalk.underline(`\n${padRight('HOST', 15)}${padRight('Appium', 15)}${padRight('%CPU', 10)}${padRight('%MEM', 10)}${padRight('Disk Free', 10)}\n\n`);
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
            if (rowArr.length < 2) {
                break;
            }
            ;
            let targetOs = 'TargetOS';
            if (row.toLowerCase().indexOf('android') >= 0) {
                targetOs = chalk.green('android');
            }
            else if (row.toLowerCase().indexOf('mac') >= 0) {
                targetOs = chalk.yellow('ios');
            }
            else {
                // skip the header row
                continue;
            }
            host.stats = { cpu: rowArr[0], mem: rowArr[1], appium: targetOs, diskFree: driveSpaceResponse[3] };
            hostResults.push(host);
            processInfoResponse += `${padRight(host.hostName, 15)}${padRight(host.stats.appium, 15)}${padRight(host.stats.cpu + '%', 10)}${padRight(host.stats.mem + '%', 10)}${padRight(host.stats.diskFree, 10)}\n`;
        }
    }
    catch (e) {
        console.log(e.message);
    }
}
// output!
if (commander_1.default.json) {
    console.log(JSON.stringify(hostResults));
}
else {
    console.log(processInfoResponse);
}
function padRight(text, width, pad = ' ') {
    let paddedString = '';
    let padding = pad.repeat(width - text.length);
    return text + padding;
}
//# sourceMappingURL=index.js.map