const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, "../config/parse.yml"), "utf-8"));

/**
 * Return the configuration.
 *
 * @param appId App ID
 * @returns Array
 */
function getConfig(appId) {
    if (appId) {
        return config.apps[appId] || {};
    }
    return config.apps || {};
}

module.exports = {
    getConfig: getConfig
};
