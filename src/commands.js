/**
 * Receives and dispatches commands from the command-line program.
 */

// const ScriptRunner = require("./scriptrunner/ScriptRunner");
const { newProject, getProject, setCurrentProject, getCurrentProject, clearCurrentProject, closeProject, reopenProject, getProjects,
    newRun, getRun, setCurrentRun, getCurrentRun, clearCurrentRun, getRuns,
    newSample, getSamples,
    updateDocument, getAllDocuments } = require("./datastore");

const logger = require('./logger');

const ipc = require('node-ipc');

// TODO - can these be generified to a single executeCommand function?

async function newProjectCommand({ name, title, protocol, startDate, description }) {

    const result = await newProject(name, title, protocol, startDate, description);

    // the current run will no longer be applicable
    await clearCurrentRun();
    global.currentRun = null;

    global.currentProject = await setCurrentProject(result.id);

    return 'Created new project with name, ' +
        global.currentProject._id + ' - entered as current project.';
}

async function getProjectsCommand({ verbose = false, asMessage = false }) {

    const projects = await getProjects();

    if (asMessage) {
        // return the list of projects as text
        let message = "";
        if (projects.length > 0) {
            message += "Current projects:\n";
            for (project of projects) {
                if (verbose) {
                    message += `${project._id} | ${project.title}\n` +
                        `\tprotocol: ${project.protocol}\n` +
                        `\tstarted: ${project.startDate}\n` +
                        `\tdescription: ${project.description}\n` +
                        (project.closed ? `\tclosed: ${project.endDate}\n` : "\n");
                } else {
                    message += `${project._id} | ${project.title} | created: ${project.creationDate}\n`;
                }
            }
        } else {
            message += "No projects available."
        }

        return message;
    } else {
        // return the projects as a list of JSON documents
        return projects;
    }
}

async function enterProjectCommand({ name }) {
    // the current run will no longer be applicable
    await clearCurrentRun();
    global.currentRun = null;

    global.currentProject = await setCurrentProject(name)
    return "Entered project: " + global.currentProject._id;
}

async function exitProjectCommand() {
    // exiting a project also exits the current run...
    await clearCurrentRun();

    const project = await clearCurrentProject();
    global.currentProject = null;
    global.currentRun = null;

    return "Exited project: " + project.project_id;
}

async function closeProjectCommand({ name, endDate }) {
    if (global.currentProject._id === name) {
        throw new Error(`Project, ${project._id} is the current project. Exit project before closing it`);
    }

    await closeProject(name, endDate);

    return "Closed project: " + project._id;
}

async function reopenProjectCommand({ name }) {
    const project = await getProject(name);
    if (!project.closed) {
        throw new Error(`Project, ${project._id} is not closed`);
    }
    project.closed = false;
    project.endDate = null;

    await updateDocument(project);

    return "Re-opened project: " + project._id;
}

async function newRunCommand({ name, startDate }) {
    const result = await newRun(name);

    return 'Created run, ' + global.currentRun._id + ', in project, ' + global.currentProject._id;
}

async function getRunsCommand({ verbose = false, asMessage = false } ) {

    if (global.currentProject == null) {
        throw new Error("No project currently selected (use command 'enter-project <name>')");
    }

    const runs = await getRuns(global.currentProject);

    if (asMessage) {
        let message = "";
        if (runs.length > 0) {
            message += `Available runs for project, ${global.currentProject._id}:\n`;
            for (run of runs) {
                message += `${run._id} | ${run.title} | started: ${run.startDate}\n`;
            }
        } else {
            messsage += "No runs created for this project."
        }

        return message;
    } else {
        return runs;
    }
}

async function enterRunCommand({ name }) {
    if (global.currentProject == null) {
        throw new Error("No project currently selected (use command 'enter-project <name>')");
    }

    global.currentRun = await setCurrentRun(args[1]);
    return "Entered run, " + global.currentRun._id + ", as part of project: " + global.currentProject._id;
}

async function exitRunCommand() {
    const run = await clearCurrentRun();
    global.currentRun = null;
    return "Exited run: " + run.run_id;
}

async function newSampleCommand({ name, barcodes, collectionDate }) {
    const result = await newSample(name, collectionDate, barcodes);

    global.currentRun = await setCurrentRun(result.id);
    return 'Created new run in project, ' +
        global.currentProject._id + ', with name, ' +
        global.currentRun._id + ' - entered as current run.';

}

/**
 * Provide a text description of the current status of ARTIFICE
 * @param args
 * @param socket
 * @returns {Promise<void>}
 */
async function statusCommand({ verbose = false }) {
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

    return message;
}

async function getDocumentsCommand() {
    return await getAllDocuments();
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

/**
 * Starts a server to field commands from the command line interface across inter-process communication.
 */
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
                async function(data, socket) {

                    const command = data[0];

                    logger.info('Command received: ' + command)

                    try {
                        let message = "";
                        let results = null;
                        if (command === 'new-project') {
                            message = await newProjectCommand({
                                name: data[1], title: data[2], protocol: data[3], startDate: data[4], description: data[5]
                            });
                        } else if (command === 'list-projects') {
                            message = await getProjectsCommand({ verbose: data[1], asMessage: true });
                        } else if (command === 'get-projects') {
                            results = await getProjectsCommand({ asMessage: false });
                        } else if (command === 'enter-project') {
                            message = await enterProjectCommand({ name: data[1] });
                        } else if (command === 'exit-project') {
                            message = await exitProjectCommand();
                        } else if (command === 'close-project') {
                            message = await closeProjectCommand({ name: data[1], endDate: data[2] });
                        } else if (command === 'reopen-project') {
                            message = await exitProjectCommand({ name: data[1] });
                        } else if (command === 'new-run') {
                            message = await newRunCommand({ name: data[1] });
                        } else if (command === 'list-runs') {
                            message = await getRunsCommand({ verbose: data[1], asMessage: true });
                        } else if (command === 'get-runs') {
                            results = await getRunsCommand({ asMessage: false });
                        } else if (command === 'enter-run') {
                            message = await enterRunCommand({ name: data[1] });
                        } else if (command === 'exit-run') {
                            message = await exitRunCommand();
                        } else if (command === 'new-sample') {
                            message = await newSampleCommand({ name: data[1], barcodes: data[2], collectionDate: data[3] });
                        } else if (command === 'status') {
                            message = await statusCommand({ name: data[1] });
                        } else if (command === 'get-documents') {
                            results = await getDocumentsCommand();
                        } else {
                            throw new Error('Unknown command: ' + command);
                        }

                        if (results != null) {
                            ipc.server.emit(socket, 'result', results);
                        } else {
                            ipc.server.emit(socket, 'message', message);
                        }
                    } catch (err) {
                        logger.error(err);
                        ipc.server.emit(socket, 'error', err.message);
                    }

                }
            );
        }
    );

    ipc.server.start();
}

module.exports = { startCommandServer };