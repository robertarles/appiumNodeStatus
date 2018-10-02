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
var child = __importStar(require("child_process"));
var commander_1 = __importDefault(require("commander"));
var chalk = require('chalk');
commander_1.default
    .option('--json', 'get json output')
    .parse(process.argv);
var buildmacList = [
    { hostName: 'buildmac11', hostIp: '10.104.97.48', stats: {} },
    { hostName: 'buildmac13', hostIp: '10.104.97.60', stats: {} },
    { hostName: 'buildmac14', hostIp: '10.104.97.43', stats: {} },
    { hostName: 'buildmac15', hostIp: '10.104.97.59', stats: {} }
];
var hostResults = [];
var processInfoResponse = chalk.underline('\nHOST\t\t%CPU\t %MEM\tAppium\t\tDisk Free\n\n');
for (var _i = 0, buildmacList_1 = buildmacList; _i < buildmacList_1.length; _i++) {
    var host = buildmacList_1[_i];
    // get the 'df' disk free result, grep -v to filter out the header line
    var driveSpaceResponse = child.execSync("ssh -T buildmac@" + host.hostIp + " \"df -h / | grep -v Filesystem\"").toString().split(/\s+/);
    try {
        // get only appium process info, and only cpu, mem and args stats
        var processInfoResponseRows = child.execSync("ssh -T buildmac@" + host.hostIp + " \"ps ax -o %cpu -o %mem -o args | grep -v grep | grep -E '(appium -p|%CPU)'\"").toString().split('\n');
        for (var _a = 0, processInfoResponseRows_1 = processInfoResponseRows; _a < processInfoResponseRows_1.length; _a++) {
            var row = processInfoResponseRows_1[_a];
            var rowArr = row.split(/\s+/);
            if (rowArr.length < 2) {
                break;
            }
            ;
            var targetOs = 'TargetOS';
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
            host.stats = { cpu: rowArr[1], mem: rowArr[2], appium: targetOs, diskFree: driveSpaceResponse[3] };
            hostResults.push(host);
            processInfoResponse += host.hostName + "\t%" + host.stats.cpu + "\t%" + host.stats.mem + "\t" + host.stats.appium + "\t\t" + host.stats.diskFree + "\n";
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
//# sourceMappingURL=index.js.map