"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchFilenamesToSubprojects = void 0;
/* eslint-enable @typescript-eslint/no-unused-vars */
var minimatch_1 = __importDefault(require("minimatch"));
/**
 * Returns a list of sub-projects inferred from the files in
 * pull requests.
 *
 * @param filenames The list of files listed in pull requests.
 */
var matchFilenamesToSubprojects = function (filenames, subprojConfigs) {
    var matchingSubProjs = [];
    subprojConfigs.forEach(function (subproj) {
        var hasMatching = false;
        var updatedSubProj = subproj;
        var updatedPaths = [];
        subproj.paths.forEach(function (path) {
            var updatedPath = path;
            if (!updatedPath.matches) {
                updatedPath.matches = [];
            }
            filenames.forEach(function (filename) {
                if ((0, minimatch_1.default)(filename, path.location)) {
                    hasMatching = true;
                    updatedPath.hit = true;
                    if (updatedPath.matches) {
                        updatedPath.matches.push(filename);
                    }
                }
            });
            updatedPaths.push(updatedPath);
        });
        if (hasMatching) {
            updatedSubProj.paths = updatedPaths;
            matchingSubProjs.push(updatedSubProj);
        }
    });
    return matchingSubProjs;
};
exports.matchFilenamesToSubprojects = matchFilenamesToSubprojects;
