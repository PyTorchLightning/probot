"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comment = exports.getPrComment = exports.formPrComment = exports.PR_COMMENT_START = exports.generateProgressDetails = exports.statusToMark = exports.generateProgressSummary = exports.generateProgressReport = void 0;
var generateProgressReport = function (subprojects, checksStatusLookup) {
    var report = {
        completed: [],
        expected: [],
        failed: [],
        missing: [],
        needAction: [],
        running: [],
        succeeded: [],
    };
    var lookup = {};
    subprojects.forEach(function (proj) {
        proj.checks.forEach(function (check) {
            var _a, _b, _c, _d, _e, _f;
            /* eslint-disable security/detect-object-injection */
            if (!(check.id in lookup)) {
                lookup[check.id] = true;
                (_a = report.expected) === null || _a === void 0 ? void 0 : _a.push(check.id);
                if (check.id in checksStatusLookup) {
                    var status_1 = checksStatusLookup[check.id];
                    if (status_1 === "success") {
                        (_b = report.completed) === null || _b === void 0 ? void 0 : _b.push(check.id);
                        (_c = report.succeeded) === null || _c === void 0 ? void 0 : _c.push(check.id);
                    }
                    if (status_1 === "failure") {
                        (_d = report.completed) === null || _d === void 0 ? void 0 : _d.push(check.id);
                        (_e = report.failed) === null || _e === void 0 ? void 0 : _e.push(check.id);
                    }
                    if (status_1 === "pending") {
                        (_f = report.running) === null || _f === void 0 ? void 0 : _f.push(check.id);
                    }
                }
            }
            /* eslint-enable security/detect-object-injection */
        });
    });
    return report;
};
exports.generateProgressReport = generateProgressReport;
var generateProgressSummary = function (subprojects, checksStatusLookup) {
    var _a, _b;
    var report = (0, exports.generateProgressReport)(subprojects, checksStatusLookup);
    var message = "Progress: ".concat((_a = report.completed) === null || _a === void 0 ? void 0 : _a.length, " completed, ").concat((_b = report.running) === null || _b === void 0 ? void 0 : _b.length, " pending");
    return message;
};
exports.generateProgressSummary = generateProgressSummary;
var statusToMark = function (check, checksStatusLookup) {
    if (check in checksStatusLookup) {
        if (checksStatusLookup[check] == "success") {
            return "✅";
        }
        if (checksStatusLookup[check] == "failure") {
            return "❌";
        }
    }
    else {
        return "⌛";
    }
    return "❓";
};
exports.statusToMark = statusToMark;
/**
 * Generates a progress report for currently finished checks
 * which will be posted in the status check report.
 *
 * @param subprojects The subprojects that the PR matches.
 * @param checksStatusLookup The lookup table for checks status.
 */
var generateProgressDetails = function (subprojects, checksStatusLookup) {
    var progress = "";
    // these are the required subprojects
    subprojects.forEach(function (subproject) {
        progress += "Summary for sub-project ".concat(subproject.id, "\n");
        // for padding
        var longestLength = Math.max.apply(Math, (subproject.checks.map(function (check) { return check.id.length; })));
        subproject.checks.forEach(function (check) {
            var mark = (0, exports.statusToMark)(check.id, checksStatusLookup);
            var status = (check.id in checksStatusLookup) ? checksStatusLookup[check.id] : 'no_status';
            status = status || 'undefined';
            progress += "".concat(check.id.padEnd(longestLength, ' '), " | ").concat(mark, " | ").concat(status.padEnd(12, ' '), "\n");
        });
        progress += "\n\n";
    });
    progress += "\n";
    progress += "## Currently received checks\n";
    var longestLength = 1;
    for (var availableCheck in checksStatusLookup) {
        longestLength = Math.max(longestLength, availableCheck.length);
    }
    for (var availableCheck in checksStatusLookup) {
        var mark = (0, exports.statusToMark)(availableCheck, checksStatusLookup);
        var status_2 = (availableCheck in checksStatusLookup) ? checksStatusLookup[availableCheck] : 'no_status';
        status_2 = status_2 || 'undefined';
        progress += "".concat(availableCheck.padEnd(longestLength, ' '), " | ").concat(mark, " | ").concat(status_2.padEnd(12, ' '), "\n");
    }
    progress += "\n";
    return progress;
};
exports.generateProgressDetails = generateProgressDetails;
exports.PR_COMMENT_START = "<!-- checkgroup-comment-start -->";
function formPrComment() {
    return (exports.PR_COMMENT_START
        + "\nHello! This is a test"
        + "\nThis comment was automatically generated by CheckGroup");
}
exports.formPrComment = formPrComment;
function getPrComment(context) {
    return __awaiter(this, void 0, void 0, function () {
        var params, commentsRes, _i, _a, comment_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    params = context.issue();
                    return [4 /*yield*/, context.octokit.rest.issues.listComments(params)];
                case 1:
                    commentsRes = _b.sent();
                    for (_i = 0, _a = commentsRes.data; _i < _a.length; _i++) {
                        comment_1 = _a[_i];
                        if (comment_1.body.includes(exports.PR_COMMENT_START)) {
                            return [2 /*return*/, { id: comment_1.id, body: comment_1.body }];
                        }
                    }
                    return [2 /*return*/, { id: 0, body: "" }];
            }
        });
    });
}
exports.getPrComment = getPrComment;
function comment(context) {
    return __awaiter(this, void 0, void 0, function () {
        var existingData, newComment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPrComment(context)];
                case 1:
                    existingData = _a.sent();
                    context.log.debug("existingData: ".concat(JSON.stringify(existingData)));
                    newComment = formPrComment();
                    if (existingData.body === newComment) {
                        return [2 /*return*/];
                    }
                    if (!(existingData.id === 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, context.octokit.issues.createComment(context.issue({ body: newComment }))];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, context.octokit.issues.updateComment(context.repo({ body: newComment, comment_id: existingData.id }))];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.comment = comment;
