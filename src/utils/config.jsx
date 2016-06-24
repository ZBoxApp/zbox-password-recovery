const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, "..", "config", "config.yml"), "utf-8"));

/**
 * Return the configuration for the corresponding enviroment.
 *
 * @param env Enviroment
 * @returns Array
 */
function getConfig(env) {
    return config[env] || {};
}

module.exports = getConfig;