"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bunyan = require('bunyan');
const bunyanPretty = require('bunyan-pretty');
const LogDnaBunyan = require('logdna-bunyan').BunyanStream;
/**
 * Creates and initializes the logger object.
 *
 * @param serviceName {string}  The name of the current service, f.e. 'example-service-name'
 * @param opts        {Options} Additional options to consider when initializing the logger object
 * @return {*}
 */
function init(serviceName, opts) {
    const options = opts ? opts : {};
    /* We only declare DEBUG and INFO because they are the lowest levels that we need. Any other levels are higher:
     *  fatal  (60)
     *  error  (50)
     *  warn   (40)
     *  info   (30)
     *  debug  (20)
     *
     * By declaring DEBUG stream to be the console and INFO stream to be our logging server we say that anything from
     * DEBUG and above will be logged in console and anything from INFO and above will be logged in the server.
     * This way we get INFO and above to be in both console and server.
     */
    const logger = bunyan.createLogger({
        name: process.env.HOSTNAME || serviceName,
        streams: []
    });
    let stream = {
        formatter: 'pretty',
        stream: bunyanPretty()
    };
    let logDestination = 'console';
    let logLevel = options.bottomLogLevel ? options.bottomLogLevel : 'debug';
    /*
     * Cases:
     * (1) If local dev env (NODE_ENV == 'default' or 'development') -> log only to console, from level 'debug'
     *
     * (2) If deployment env (NODE_ENV != 'default' or != 'development' or != 'test') -> log to Log Server (LogDNA)
     ** if logging of debug is enabled (DEBUG_ENABLE == 'true') -> log from 'debug' level, otherwise from 'info'
     */
    if (!['default', 'local', 'development', 'test'].includes(process.env.NODE_ENV)) {
        // it's not local dev env -> case 2
        if (!options.key) {
            console.log('===> FATAL ERROR: Logging service ingestion key is not provided. Exiting now...');
            process.exit(1);
        }
        const logServerStream = {
            stream: new LogDnaBunyan({
                key: options.key,
                hostname: process.env.NODE_ENV,
                index_meta: true
            }),
            type: 'raw'
        };
        Object.assign(stream, logServerStream);
        logDestination = 'the Log Server';
        // default is to log from 'debug' onward. But if it's not enabled, switch to log from 'info' onward
        if (process.env.DEBUG_ENABLE !== 'true') {
            logLevel = 'info';
        }
    }
    if (process.env.NODE_ENV === 'test' && (!options.logTestEnv)) {
        console.log(`===> TEST env... do not log`);
    }
    else {
        logger.addStream(Object.assign(stream, { level: logLevel }));
        console.log(`===> LOGGING TO ${logDestination} FROM LEVEL ${logLevel}`);
    }
    return logger;
}
exports.init = init;
