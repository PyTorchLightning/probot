"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satisfyExpectedChecks = void 0;
/* eslint-enable @typescript-eslint/no-unused-vars */
/**
 * Checks if all the sub-project requirements are satisfied.
 *
 * @param subProjs The sub-projects a certain pull request
 * matches.
 *
 * @param checksStatusLookup The checks that has already
 * posted progresses. The key is the check ID and the value
 * is the current check status.
 *
 * @returns The current status of checks fulfillment.
 * * "all_passing" means all required checks post
 *   success conclusion.
 * * "has_failure" means at least one of the required
 *   checks failed.
 * * "pending" means there is no failure but some
 *   checks are pending or missing.
 */
var satisfyExpectedChecks = function (subProjs, checksStatusLookup) {
    var result = "all_passing";
    subProjs.forEach(function (subProj) {
        subProj.checks.forEach(function (check) {
            var checkName = check.id;
            /* eslint-disable security/detect-object-injection */
            if (checkName in checksStatusLookup &&
                checksStatusLookup[checkName] !== "success" &&
                checksStatusLookup[checkName] !== "pending") {
                result = "has_failure";
            }
            if ((!(checkName in checksStatusLookup) ||
                checksStatusLookup[checkName] === "pending") &&
                result !== "has_failure") {
                result = "pending";
            }
            /* eslint-enable security/detect-object-injection */
        });
    });
    return result;
};
exports.satisfyExpectedChecks = satisfyExpectedChecks;
