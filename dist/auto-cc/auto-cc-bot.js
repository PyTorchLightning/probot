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
var utils_1 = require("./utils");
function myBot(app) {
    var _this = this;
    var tracker = new utils_1.CachedIssueTracker(app, 'tracking_issue', utils_1.parseSubscriptions);
    function loadSubscriptions(context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tracker.loadIssue(context)];
            });
        });
    }
    function runBotForLabels(context) {
        return __awaiter(this, void 0, void 0, function () {
            var subscriptions, contextName, name, labels, cc, body, reCC, oldCCMatch, prevCC, oldCCString, m, reUsername, newCCString_1, newBody;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, loadSubscriptions(context)];
                    case 1:
                        subscriptions = _a.sent();
                        contextName = context.name;
                        if (!['pull_request', 'issues'].includes(contextName)) {
                            throw new Error("name ".concat(contextName, " should be one of ['pull_request', 'issues']"));
                        }
                        name = contextName === 'issues' ? 'issue' : contextName;
                        labels = context.payload[name]['labels'].map(function (e) { return e['name']; });
                        context.log({ labels: labels });
                        cc = new Set();
                        labels.forEach(function (l) {
                            if (l in subscriptions) {
                                subscriptions[l].forEach(function (u) { return cc.add(u); });
                            }
                        });
                        context.log({ cc: Array.from(cc) }, 'from subscriptions');
                        if (!cc.size) return [3 /*break*/, 8];
                        body = context.payload[name]['body'];
                        reCC = /cc( +@[a-zA-Z0-9-/]+)+/;
                        oldCCMatch = body ? body.match(reCC) : null;
                        prevCC = new Set();
                        if (oldCCMatch) {
                            oldCCString = oldCCMatch[0];
                            context.log({ oldCCString: oldCCString }, 'previous cc string');
                            m = void 0;
                            reUsername = /@([a-zA-Z0-9-/]+)/g;
                            while ((m = reUsername.exec(oldCCString)) !== null) {
                                prevCC.add(m[1]);
                                cc.add(m[1]);
                            }
                            context.log({ prevCC: Array.from(prevCC) }, 'pre-existing ccs');
                        }
                        if (!(prevCC.size !== cc.size)) return [3 /*break*/, 6];
                        newCCString_1 = 'cc';
                        cc.forEach(function (u) {
                            newCCString_1 += " @".concat(u);
                        });
                        newBody = body
                            ? oldCCMatch
                                ? body.replace(reCC, newCCString_1)
                                : "".concat(body, "\n\n").concat(newCCString_1)
                            : newCCString_1;
                        context.log({ newBody: newBody });
                        if (!(name === 'issue')) return [3 /*break*/, 3];
                        return [4 /*yield*/, context.octokit.issues.update(context.issue({ body: newBody }))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        if (!(name === 'pull_request')) return [3 /*break*/, 5];
                        return [4 /*yield*/, context.octokit.pulls.update(context.pullRequest({ body: newBody }))];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        context.log('no action: no change from existing cc list on issue');
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        context.log('no action: cc list from subscription is empty');
                        _a.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    app.on([
        'issues.labeled',
        'pull_request.labeled',
        // If the bot is disabled for draft PRs, we want to run it when the PR is marked as ready
        'pull_request.ready_for_review'
    ], function (context) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, runBotForLabels(context)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    }); }); });
}
exports.default = myBot;
