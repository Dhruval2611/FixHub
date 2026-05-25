const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../backend_debug.log');

const logToFile = (message, data = null) => {
    try {
        const timestamp = new Date().toISOString();
        let logMessage = `${timestamp}: ${message}`;
        if (data) {
            if (data instanceof Error) {
                logMessage += `\nERROR STACK: ${data.stack}`;
            } else {
                try {
                    logMessage += `\nDATA: ${JSON.stringify(data, null, 2)}`;
                } catch (e) {
                    logMessage += `\nDATA: [Circular or Non-Serializable]`;
                }
            }
        }
        logMessage += '\n' + '-'.repeat(50) + '\n';

        fs.appendFileSync(logPath, logMessage);
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
};

module.exports = logToFile;
