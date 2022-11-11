"use strict";
/**
 * The user config parser utilities
 * @module UserConfigParserUtils
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserConfig = void 0;
/* eslint-enable @typescript-eslint/no-unused-vars */
var default_config_1 = require("./default_config");
var populate_custom_service_name_1 = require("./populate_custom_service_name");
var populate_subprojects_1 = require("./populate_subprojects");
var core = __importStar(require("@actions/core"));
/**
 * Parses the typed configuration from the raw
 * configuration object read from the yaml file
 * in the user repository.
 *
 * @param configData The raw configuration data.
 * @returns The typed configuration.
 */
var parseUserConfig = function (configData) {
    var defaultConfig = (0, default_config_1.getDefaultConfig)();
    try {
        var config = defaultConfig;
        (0, populate_subprojects_1.populateSubprojects)(configData, config);
        (0, populate_custom_service_name_1.populateCustomServiceName)(configData, config);
        return config;
    }
    catch (error) {
        core.setFailed(error);
    }
};
exports.parseUserConfig = parseUserConfig;
