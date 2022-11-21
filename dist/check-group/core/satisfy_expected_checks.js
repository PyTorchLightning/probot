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
 * @returns The current result of checks fulfillment.
 * * "all_passing" means all required checks post
 *   success conclusion.
 * * "has_failure" means at least one of the required
 *   checks failed.
 * * "pending" means there is no failure but some
 *   checks are pending or missing.
 */
var satisfyExpectedChecks = function (subProjs, postedChecks) {
    var result = "all_passing";
    subProjs.forEach(function (subProj) {
        subProj.checks.forEach(function (check) {
            if (check in postedChecks &&
                postedChecks[check].conclusion !== "success" &&
                postedChecks[check].conclusion !== null) {
                result = "has_failure";
            }
            if ((!(check in postedChecks) ||
                postedChecks[check].conclusion === null) &&
                result !== "has_failure") {
                result = "pending";
            }
        });
    });
    return result;
};
exports.satisfyExpectedChecks = satisfyExpectedChecks;
