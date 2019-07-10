const { parser } = require("./src/args");
const logger = require('./src/logger')

const { startCommandServer, statusCommand } = require("./src/commands");

const { getCurrentProject, getCurrentRun } = require("./src/datastore")

/**
 * Initialise all the settings
 * @returns {Promise<boolean>}
 */
const startUp = async () => {
    const args = parser.parseArgs();

    logger.info('ARTIFICE starting up.')

    logger.info(await statusCommand());

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
