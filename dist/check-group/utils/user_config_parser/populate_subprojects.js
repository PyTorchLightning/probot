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
function parseProjectId(subprojData) {
    if (!("id" in subprojData)) {
        core.setFailed("Essential field missing from config: sub-project ID");
    }
    return subprojData["id"];
}
exports.parseProjectId = parseProjectId;
function parseProjectPaths(subprojData) {
    if (!("paths" in subprojData) || subprojData["paths"] == null) {
        core.setFailed("The list of paths for the '".concat(subprojData["id"], "' group is not defined"));
    }
    var projPaths = subprojData["paths"];
    if (projPaths.length == 0) {
        core.setFailed("The list of paths for the '".concat(subprojData["id"], "' group is empty"));
    }
    return projPaths;
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
    if (!("subprojects" in configData)) {
        core.setFailed("configData has no subprojects");
    }
    var subProjectsData = configData["subprojects"];
    subProjectsData.forEach(function (subprojData) {
        var subprojConfig = {
            checks: parseProjectChecks(subprojData),
            id: parseProjectId(subprojData),
            paths: parseProjectPaths(subprojData),
        };
        config.subProjects.push(subprojConfig);
    });
}
exports.populateSubprojects = populateSubprojects;
