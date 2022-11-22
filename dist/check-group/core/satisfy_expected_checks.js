"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubProjResult = exports.getChecksResult = void 0;
var getChecksResult = function (checks, postedChecks) {
    var result = "all_passing";
    checks.forEach(function (check) {
        var relevant = check in postedChecks;
        if (relevant && postedChecks[check].conclusion !== "success") {
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
exports.getChecksResult = getChecksResult;
var getSubProjResult = function (subProjs, postedChecks) {
    var result = "all_passing";
    subProjs.forEach(function (subProj) {
        subProj.checks.forEach(function (check) {
            var relevant = check in postedChecks;
            if (relevant && postedChecks[check].conclusion !== "success") {
                // at least one check failed
                result = "has_failure";
                return; // continue
            }
            if (!relevant || postedChecks[check].conclusion === null) {
                // some checks are pending or missing
                result = "pending";
            }
        });
    });
    return result;
};
exports.getSubProjResult = getSubProjResult;
