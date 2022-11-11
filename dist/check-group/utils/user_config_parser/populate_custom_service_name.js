"use strict";
/**
 * @module PopulateCustomServiceName
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateCustomServiceName = void 0;
/**
 * Parse the custom service name from the user
 * configuration if present.
 * @param {Record<string, unknown>} configData
 * @param {CheckGroupConfig} config
 **/
function populateCustomServiceName(configData, config) {
    if ("custom_service_name" in configData) {
        config.customServiceName = configData["custom_service_name"];
    }
    else {
        config.customServiceName = "Check Group";
    }
}
exports.populateCustomServiceName = populateCustomServiceName;
