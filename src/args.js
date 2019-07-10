/**
 * Command line arguments for starting ARTIFICE demon.
 */
const argparse = require('argparse');
const version = require('../package.json').version;

const parser = new argparse.ArgumentParser({
  version: version,
  addHelp: true,
  description: `ARTIFICE v${version}: ARTIC Real Time Integrated Field Infection Control Edifice`,
  epilog: `
  ARTIFICE is curently under development!
  `
});
parser.addArgument('--verbose', {action: "storeTrue",  help: "verbose output"});

/* ----------------- CONFIG OPTIONS -------------------- */
const config = parser.addArgumentGroup({title: 'Config commands', description: "These options can all be specified in the GUI"});
config.addArgument('--basecalledDir', {help: "basecalled directory"});

/* ----------------- DEVELOPMENT -------------------- */
const development = parser.addArgumentGroup({title: 'Development commands'});
development.addArgument('--devClient', {action: "storeTrue", help: "Don't serve build (client)"})
development.addArgument('--mockFailures', {action: "storeTrue", help: "stochastic failures (mapping / demuxing / basecalling)"});


module.exports = {
  parser
};
