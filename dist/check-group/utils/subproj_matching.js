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
        var hits = new Set();
        subproj.paths.forEach(function (path) {
            // support for GitHub-style path exclusion
            // https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#example-including-and-excluding-paths
            var isNegation = path.startsWith("!");
            // https://www.npmjs.com/package/minimatch
            var matches = minimatch_1.default.match(filenames, path, { "flipNegate": isNegation });
            // if it's a negation, delete from the list of hits, otherwise add
            matches.forEach(function (match) { return (isNegation) ? hits.delete(match) : hits.add(match); });
        });
        if (hits.size) {
            var updatedSubProj = subproj;
            updatedSubProj.paths = Array.from(hits);
            matchingSubProjs.push(updatedSubProj);
        }
    });
    return matchingSubProjs;
};
exports.matchFilenamesToSubprojects = matchFilenamesToSubprojects;
