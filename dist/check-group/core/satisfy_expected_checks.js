"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubProjResult = exports.getChecksResult = void 0;
var getChecksResult = function (checks, postedChecks) {
    var result = "all_passing";
    for (var _i = 0, checks_1 = checks; _i < checks_1.length; _i++) {
        var check = checks_1[_i];
        if (check in postedChecks) {
            var conclusion = postedChecks[check].conclusion;
            if (conclusion === null) {
                // the check is in progress
                result = "pending";
            }
            else if (conclusion !== "success") {
                // the check already failed
                return "has_failure";
            }
        }
        else {
            // the check is missing, hopefully queued
            result = "pending";
        }
    }
    ;
    return result;
};
exports.getChecksResult = getChecksResult;
var getSubProjResult = function (subProjs, postedChecks) {
    var result = "all_passing";
    for (var _i = 0, subProjs_1 = subProjs; _i < subProjs_1.length; _i++) {
        var subProj = subProjs_1[_i];
        for (var _a = 0, _b = subProj.checks; _a < _b.length; _a++) {
            var check = _b[_a];
            if (check in postedChecks) {
                var conclusion = postedChecks[check].conclusion;
                if (conclusion === null) {
                    // the check is in progress
                    result = "pending";
                }
                else if (conclusion !== "success") {
                    // the check already failed
                    return "has_failure";
                }
            }
            else {
                // the check is missing, hopefully queued
                result = "pending";
            }
        }
        ;
    }
    ;
    return result;
};
exports.getSubProjResult = getSubProjResult;
