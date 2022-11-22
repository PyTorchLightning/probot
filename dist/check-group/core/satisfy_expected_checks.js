"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satisfyExpectedChecks = exports.getCheckResult = void 0;
var getCheckResult = function (checks, postedChecks) {
    var result = "all_passing";
    checks.forEach(function (check) {
        var relevant = check in postedChecks;
        if (relevant &&
            postedChecks[check].conclusion !== "success" &&
            postedChecks[check].conclusion !== null) {
            // at least one check failed
            return "has_failure";
        }
        if (!relevant || postedChecks[check].conclusion === null) {
            // some checks are pending or missing
            result = "pending";
        }
    });
    return result;
};
exports.getCheckResult = getCheckResult;
var satisfyExpectedChecks = function (subProjs, postedChecks) {
    var result = "all_passing";
    subProjs.forEach(function (subProj) { return result = (0, exports.getCheckResult)(subProj.checks, postedChecks); });
    return result;
};
exports.satisfyExpectedChecks = satisfyExpectedChecks;
