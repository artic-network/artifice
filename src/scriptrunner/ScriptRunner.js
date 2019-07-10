
const { spawn } = require('child_process')

const logOutput = (name) => (message) => console.log(`[${name}] ${message}`)

class ScriptRunner {

    constructor(script, args) {
        this._script = script;
        this._args = args;
    }

    async run() {
        return new Promise((resolve, reject) => {
            const process = spawn(this._script, this._args);

            const out = [];
            process.stdout.on(
                'data',
                (data) => {
                    out.push(data.toString());
                    logOutput('stdout')(data);
                }
            );


            const err = [];
            process.stderr.on(
                'data',
                (data) => {
                    err.push(data.toString());
                    logOutput('stderr')(data);
                }
            );

            process.on('exit', (code, signal) => {
                logOutput('exit')(`${code} (${signal})`);
                if (code !== 0) {
                    reject(new Error(err.join('\n')));
                    return
                }
                try {
                    resolve(JSON.parse(out[0]));
                } catch(e) {
                    reject(e);
                }
            });
        });
    }
}

module.exports = { ScriptRunner };