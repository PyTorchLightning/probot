"use strict";
/**
 * @module PopulateSubProjects
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
exports.populateSubprojects = exports.parseProjectChecks = exports.parseProjectPaths = exports.parseProjectId = void 0;
var core = __importStar(require("@actions/core"));
/**
 * Parses the structured ID into sub-project data from the raw user config.
 *
 * The ID is required for the sub-project since it is hard to give the user
 * any useful information for debugging if the ID that is used to identify the
 * location of the issue is missing. In this case, it will be better to bail.
 *
 * @param subprojData The raw data from the config file.
 * @param subprojConfig The structured data for the sub-project.
 */
function parseProjectId(subprojData, subprojConfig) {
    if ("id" in subprojData) {
        subprojConfig.id = subprojData["id"];
    }
    else {
        throw Error("Essential field missing from config: sub-project ID");
    }
}
exports.parseProjectId = parseProjectId;
function parseProjectPaths(subprojData, subprojConfig, config) {
    if ("paths" in subprojData && subprojData["paths"] !== null) {
        var projPaths_1 = [];
        var locations = subprojData["paths"];
        locations.forEach(function (loc) {
            projPaths_1.push({
                location: loc,
            });
        });
        var minPathCnt = 0;
        if (projPaths_1.length > minPathCnt) {
            subprojConfig.paths = projPaths_1;
        }
        else {
            config.debugInfo.push({
                configError: true,
                configErrorMsg: "Paths is empty.",
            });
        }
    }
    else {
        config.debugInfo.push({
            configError: true,
            configErrorMsg: ":warning: Essential fields missing from config for project ".concat(subprojConfig.id, ": paths"),
        });
    }
}
exports.parseProjectPaths = parseProjectPaths;
function parseProjectChecks(subprojData) {
    if (!("checks" in subprojData) || subprojData["checks"] == null) {
        core.setFailed("The list of checks for the '".concat(subprojData["id"], "' group is not defined"));
    }
    var projChecks = [];
    var checksData = subprojData["checks"];
    var flattened = checksData.flat(100); // 100 levels deep
    core.debug("checksData for '".concat(subprojData["id"], "' before flatten: ").concat(JSON.stringify(checksData), ")")
        + " and after flatten: ".concat(JSON.stringify(flattened)));
    flattened.forEach(function (checkId) { return projChecks.push({ id: checkId }); });
    if (projChecks.length == 0) {
        core.setFailed("The list of checks for the '".concat(subprojData["id"], "' group is empty"));
    }
    return projChecks;
}
exports.parseProjectChecks = parseProjectChecks;
/**
 * Parse user config file and populate subprojects
 * @param {Record<string, unknown>} configData
 * @param {CheckGroupConfig} config
 **/
function populateSubprojects(configData, config) {
    if ("subprojects" in configData) {
        var subProjectsData = configData["subprojects"];
        subProjectsData.forEach(function (subprojData) {
            var subprojConfig = {
                checks: [],
                id: "Unknown",
                paths: [],
            };
            try {
                parseProjectId(subprojData, subprojConfig);
                parseProjectPaths(subprojData, subprojConfig, config);
                subprojConfig.checks = parseProjectChecks(subprojData);
                config.subProjects.push(subprojConfig);
            }
            catch (err) {
                config.debugInfo.push({
                    configError: true,
                    configErrorMsg: "Error adding sub-project from data:\n ".concat(JSON.stringify(subprojData)),
                });
            }
        });
    }
    else {
        throw Error("subprojects not found in the user configuration file");
    }
}
exports.populateSubprojects = populateSubprojects;
