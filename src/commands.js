/**
 * Receives and dispatches commands from the command-line program.
 */

// const ScriptRunner = require("./scriptrunner/ScriptRunner");
const { newProject, getProject, setCurrentProject, getCurrentProject, clearCurrentProject, getProjects,
    newRun, getRun, setCurrentRun, getCurrentRun, clearCurrentRun, getRuns,
    newSample, getSamples, getAllDocuments } = require("./datastore");

const logger = require('./logger');

const ipc = require('node-ipc');

// TODO - can these be generified to a single executeCommand function?

async function newProjectCommand(args, socket) {
    const theSocket = socket;
    try {
        const result = await newProject(args[1]);

        // the current run will no longer be applicable
        await clearCurrentRun();
        global.currentRun = null;

        global.currentProject = await setCurrentProject(result.id);
        ipc.server.emit(theSocket, 'message', 'Created new project with name, ' +
            global.currentProject._id + ' - entered as current project.');

    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', err.message);
    }
}

async function getProjectsCommand(args, socket, asMessage = false) {
    const theSocket = socket;
    try {
        const projects = await getProjects();
        if (asMessage) {
            // return the list of projects as text
            let message = "";
            if (projects.length > 0) {
                message += "Available projects:\n";
                for (project of projects) {
                    message += `${project._id} | ${project.title} | created: ${project.creationDate}\n`;
                }
            } else {
                messsage += "No projects available."
            }

            ipc.server.emit(theSocket, 'message', message);
        } else {
            // return the projects as a list of JSON documents
            ipc.server.emit(theSocket, 'result', projects);
        }
    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', 'Error accessing projects: ' + err.message);
    }
}

async function enterProjectCommand(args, socket) {
    const theSocket = socket;
    try {
        // the current run will no longer be applicable
        await clearCurrentRun();
        global.currentRun = null;

        global.currentProject = await setCurrentProject(args[1])
        ipc.server.emit(theSocket, 'message', "Entered project: " + global.currentProject._id);
        // ipc.server.emit(theSocket, 'result', global.currentProject);
    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', 'Error entering project: ' + err.message);
    }
}

async function exitProjectCommand(args, socket) {
    const theSocket = socket;
    try {
        // exiting a project also exits the current run...
        await clearCurrentRun();

        const project = await clearCurrentProject();
        ipc.server.emit(theSocket, 'message', "Exited project: " + project.project_id);
        global.currentProject = null;
        global.currentRun = null;
    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', 'Error exiting project: ' + err.message);
    }
}

async function newRunCommand(args, socket) {
    const theSocket = socket;
    try {
        const result = await newRun(args[1]);

        ipc.server.emit(theSocket, 'message', 'Created new sample for run, ' +
            global.currentRun._id + ', in project, ' + global.currentProject._id);

    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', err.message);
    }
}

async function  getRunsCommand(args, socket, asMessage = false) {
    const theSocket = socket;
    try {
        let message = "";
        let runs = [];
        if (global.currentProject != null) {
            runs = await getRuns(global.currentProject);
            if (runs.length > 0) {
                message += `Available runs for project, ${global.currentProject._id}:\n`;
                for (run of runs) {
                    message += `${run._id} | ${run.title} | started: ${run.startDate}\n`;
                }
            } else {
                messsage += "No runs created for this project."
            }
        } else {
            messsage += "No project currently selected (use command 'enter-project <name>')."
        }

        if (asMessage) {
            ipc.server.emit(theSocket, 'message', message);
        } else {
            ipc.server.emit(theSocket, 'result', runs);
        }
    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', 'Error accessing runs: ' + err.message);
    }
}

async function enterRunCommand(args, socket) {
    const theSocket = socket;
    try {
        if (global.currentProject != null) {
            global.currentRun = await setCurrentRun(args[1])
            ipc.server.emit(theSocket, 'message', "Entered run, " + global.currentRun._id +
                ", as part of project: " + global.currentProject._id);

            // ipc.server.emit(theSocket, 'result', global.currentRun);
        } else {
            ipc.server.emit(theSocket, "No project currently selected (use command 'enter-project <name>')");
        }
    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', 'Error entering run: ' + err.message);
    }
}

async function exitRunCommand(args, socket) {
    const theSocket = socket;
    try {
        const run = await clearCurrentRun();
        ipc.server.emit(theSocket, 'message', "Exited run: " + run.run_id);
        global.currentRun = null;
    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', 'Error exiting run: ' + err.message);
    }
}

async function newSampleCommand(args, socket) {
    const theSocket = socket;
    try {
        const name = args[1];
        const barcodes = args[2];
        const collectionDate = args[3];

        const result = await newSample(name, collectionDate, barcodes);

        global.currentRun = await setCurrentRun(result.id);
        ipc.server.emit(theSocket, 'message', 'Created new run in project, ' +
            global.currentProject._id + ', with name, ' + global.currentRun._id + ' - entered as current run.');

    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', err.message);
    }
}

/**
 * Provide a text description of the current status of ARTIFICE
 * @param args
 * @param socket
 * @returns {Promise<void>}
 */
async function statusCommand(args, socket) {
    const theSocket = socket;
    try {
        let message = "ARTIFICE status:\n";

        const projects = await getProjects();
        message += "\nProjects: " + projects.length + "\n";

        let runCount = 0;
        let sampleCount = 0;
        for (project of projects) {
            const runs = await getRuns(project);
            runCount += runs.length;

            for (run of runs) {
                const samples = await getSamples(run, project);
                sampleCount += samples.length;
            }
        }
        message += "Runs: " + runCount + "\n";
        message += "Samples: " + sampleCount + "\n";

        if (global.currentProject != null) {
            message += "\nCurrent project: " + global.currentProject._id + "\n";
            if (global.currentRun != null) {
                message += `\tCurrent run: ${global.currentRun._id} | ${global.currentRun.title} | started: ${global.currentRun.startDate}\n`;
            } else {
                message += "\tCurrent run not set\n";
            }
        } else {
            message += "\nCurrent project not set\n";
        }

        ipc.server.emit(theSocket, 'message', message);

    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', err.message);
    }
}



async function getDocumentsCommand(args, socket) {
    const theSocket = socket;
    try {
        const documents = await getAllDocuments();
        ipc.server.emit(theSocket, 'result', documents);
    } catch (err) {
        logger.error(err);
        ipc.server.emit(theSocket, 'error', 'Error accessing runs: ' + err.message);
    }
}

function runScript() {
// try {
//     const scriptRunner = new ScriptRunner('python', ['./scripts/test.py', 'my', 'args']);
//     const output = await scriptRunner.run()
//     logOutput('main')(output.message)
//     process.exit(0)
// } catch (e) {
//     console.error('Error during script execution ', e.stack);
//     process.exit(1);
// }
}

function startCommandServer() {
    ipc.config.id   = 'artifice';
    ipc.config.retry= 1500;
    ipc.config.silent = true;

    // disconnect any CLI clients currently attached to the socket...
    ipc.disconnect(ipc.config.id);

    ipc.serve(
        function() {
            ipc.server.on(
                'command',
                function(data, socket) {

                    const command = data[0];

                    logger.info('Command received: ' + command)

                    if (command === 'new-project') {
                        newProjectCommand(data, socket);
                    } else if (command === 'list-projects') {
                        getProjectsCommand(data, socket, true);
                    } else if (command === 'get-projects') {
                        getProjectsCommand(data, socket);
                    } else if (command === 'enter-project') {
                        enterProjectCommand(data, socket);
                    } else if (command === 'exit-project') {
                        exitProjectCommand(data, socket);
                    } else if (command === 'new-run') {
                        newRunCommand(data, socket);
                    } else if (command === 'list-runs') {
                        getRunsCommand(data, socket, true);
                    } else if (command === 'get-runs') {
                        getRunsCommand(data, socket);
                    } else if (command === 'enter-run') {
                        enterRunCommand(data, socket);
                    } else if (command === 'exit-run') {
                        exitRunCommand(data, socket);
                    } else if (command === 'new-sample') {
                        newSampleCommand(data, socket);
                    } else if (command === 'status') {
                        statusCommand(data, socket);
                    } else if (command === 'get-documents') {
                        getDocumentsCommand(data, socket);
                    } else {
                        ipc.server.emit(socket, 'error', 'Unknown command: ' + command);
                    }
                }
            );
        }
    );

    ipc.server.start();
}

module.exports = { startCommandServer };