#!/usr/bin/env node

/**
 * Simple command line program which dispatches commands to the main artificed demon and then prints
 * the results.
 */
const ipc = require('node-ipc');

const version = require('./package.json').version;

const program = require('commander');

/**
 * A utility to flush both stdout and stderr before exiting
 * @param code the exit code
 */
function exitProgram(code) {
    process.stdout.write("", () => {
        process.stderr.write("", () => {
            process.exit(code);
        })
    });
}

/**
 * Dispatches the actual command and listens for the response
 * @param command
 */
function dispatchCommand(command) {
    ipc.config.id = 'artifice';
    ipc.config.retry = 1500;
    ipc.config.silent = true;

    ipc.connectTo(
        'artifice',
        function(){
            ipc.of.artifice.on(
                'connect',
                function() {
                    ipc.of.artifice.emit(`command`, command)
                }
            );
            ipc.of.artifice.on(
                'disconnect',
                function() {
                    console.log('Disconnected from ARTIFICE demon');
                    exitProgram(1);
                }
            );
            ipc.of.artifice.on(
                'result',
                function(data) {
                    console.log('Results: ', data);
                    exitProgram(0);
                }
            );
            ipc.of.artifice.on(
                'message',
                function(message) {
                    console.log(message);
                    exitProgram(0);
                }
            );
            ipc.of.artifice.on(
                'error',
                function(data) {
                    console.error(data);
                    exitProgram(1);
                }
            );
        }
    );
}

const main = async () => {
    program
        .version(version)
        .description('ARTIFICE command line interface');

    program
        .command('new-project <name>')
        .alias('np')
        .description('Create a new project')
        .option('-t, --title <text>', "The title for this project", "")
        .option('-p, --protocol <protocol>', "The protocol being used for this project", "")
        .option('-s, --start-date <date>', "The date of the start of the project",
            (value) => new Date(value))
        .option('-d, --description <text>', "A discription about the project", "")
        .action((name , command) =>
            dispatchCommand(['new-project', name, command.title, command.protocol, command.startDate, command.description]));

    program
        .command('list-projects')
        .alias('lp')
        .description('List current projects')
        .option('-v, --verbose', "Provide detailed information about the project", false)
        .action((command) =>
            dispatchCommand(['list-projects', command.verbose]));

    program
        .command('get-projects')
        .alias('gp')
        .description('Get current projects in JSON format')
        .action(() =>
            dispatchCommand(['get-projects']) );

    program
        .command('enter-project <name>')
        .alias('ep')
        .description('Enter a project (make it current)')
        .action((name) =>
            dispatchCommand(['enter-project', name]) );

    program
        .command('exit-project')
        .alias('xp')
        .description('Exit currently selected project')
        .action(() =>
            dispatchCommand(['exit-project']) );

    program
        .command('close-project <name>')
        .alias('cp')
        .description('Close a project (cannot be further modified, unless reopened)')
        .option('-s, --end-date <date>', "The date the project ended (default today)")
        .action((name, command) =>
            dispatchCommand(['close-project', command.endDate]) );

    program
        .command('reopen-project <name>')
        .alias('rp')
        .description('Re-open a closed project')
        .action((name) =>
            dispatchCommand(['reopen-project', name]) );

    program
        .command('new-run <name>')
        .alias('nr')
        .description('Create a new run within the current project')
        .option('-t, --title <text>', "The title for this run", "")
        .option('-s, --start-date <date>', "The date of the start of the run",
            (value) => new Date(value))
        .option('-d, --description <text>', "A discription of the run", "")
        .action((name , command) =>
            dispatchCommand(['new-run', name, command.title, command.startDate, command.description]));

    program
        .command('list-runs')
        .alias('lr')
        .description('List runs within the current project')
        .option('-v, --verbose', "Provide detailed information about the runs", false)
        .action((command) =>
            dispatchCommand(['list-runs', command.verbose]));

    program
        .command('enter-run <name>')
        .alias('er')
        .description('Enter a run (make it current)')
        .action((name) =>
            dispatchCommand(['enter-run', name]) );

    program
        .command('exit-run')
        .alias('xr')
        .description('Exit the current run')
        .action(() =>
            dispatchCommand(['exit-run']) );

    program
        .command('end-run <name>')
        .alias('er')
        .description('End a run (cannot be further modified, unless restarted)')
        .option('-s, --end-date <date>', "The date the run ended (default today)")
        .action((name, command) =>
            dispatchCommand(['end-run', command.endDate]) );

    program
        .command('restart-run <name>')
        .alias('rr')
        .description('Re-start an ended run')
        .action((name) =>
            dispatchCommand(['restart-run', name]) );

    program
        .command('add-sample <name>')
        .alias('ns')
        .description('Add a new sample within the current run')
        .option('-b, --barcodes <barcodes>', "A list of barcodes associated with this sample",
            (value) => value.split(','))
        .option('-d, --collection-date <date>', "The date of collection of this sample",
            (value) => new Date(value))
        .action((name , command) =>
            dispatchCommand(['add-sample', name, command.barcodes, command.collectionDate]));

    program
        .command('list-samples')
        .alias('ls')
        .description('List samples within the current project')
        .option('-v, --verbose', "Provide detailed information about the runs", false)
        .action((command) =>
            dispatchCommand(['list-samples', command.verbose]));

    program
        .command('status', '',{isDefault: true})
        .alias('st')
        .description('Provide information about the current status of ARTIFICE')
        .option('-v, --verbose', "Provide detailed information about the runs", false)
        .action((command) =>
            dispatchCommand(['status', command.verbose]) );

    program
        .command('get-documents')
        .alias('gd')
        .description('Get all documents within the datastore in JSON format')
        .action(() =>
            dispatchCommand(['get-documents']) );

    program.parse(process.argv);
};

main();
