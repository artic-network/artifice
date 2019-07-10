const { parser } = require("./src/args");
const logger = require('./src/logger')

const { startCommandServer } = require("./src/commands");

const { getCurrentProject, getCurrentRun } = require("./src/datastore")

/**
 * Initialise all the settings
 * @returns {Promise<boolean>}
 */
const startUp = async () => {
    const args = parser.parseArgs();

    logger.info('ARTIFICE starting up.')

    try {
        global.currentProject = await getCurrentProject();
        logger.info("Current project: " + global.currentProject.title);
    } catch (err) {
        global.currentProject = null;
        logger.info("Current project not set");
    }

    if (global.currentProject != null) {
        try {
            global.currentRun = await getCurrentRun();
            logger.info("Current run: " + global.currentRun.title);
        } catch (err) {
            global.currentRun = null;
            logger.info("Current run not set");
        }
    }

    logger.info('ARTIFICE start up successful.')

    return true;
}

const main = async () => {
    const success = await startUp()
    if (success) {
        startCommandServer();
        // startRAMPARTServer();
    }
}

main();
