"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.parseSubscriptions = exports.CachedIssueTracker = exports.CachedConfigTracker = exports.repoKey = void 0;
function repoKey(context) {
    var repo = context.repo();
    return "".concat(repo.owner, "/").concat(repo.repo);
}
exports.repoKey = repoKey;
var CachedConfigTracker = /** @class */ (function () {
    function CachedConfigTracker(app) {
        var _this = this;
        this.repoConfigs = {};
        app.on('push', function (context) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(context.payload.ref === 'refs/heads/master')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.loadConfig(context, /* force */ true)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
    }
    CachedConfigTracker.prototype.loadConfig = function (context, force) {
        if (force === void 0) { force = false; }
        return __awaiter(this, void 0, void 0, function () {
            var key, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        key = repoKey(context);
                        if (!(!(key in this.repoConfigs) || force)) return [3 /*break*/, 2];
                        context.log({ key: key }, 'loadConfig');
                        _a = this.repoConfigs;
                        _b = key;
                        return [4 /*yield*/, context.config('lightning-probot.yml')];
                    case 1:
                        _a[_b] = _c.sent();
                        _c.label = 2;
                    case 2: return [2 /*return*/, this.repoConfigs[key]];
                }
            });
        });
    };
    return CachedConfigTracker;
}());
exports.CachedConfigTracker = CachedConfigTracker;
var CachedIssueTracker = /** @class */ (function (_super) {
    __extends(CachedIssueTracker, _super);
    function CachedIssueTracker(app, configName, issueParser) {
        var _this = _super.call(this, app) || this;
        _this.repoIssues = {};
        _this.configName = configName;
        _this.issueParser = issueParser;
        app.on('issues.edited', function (context) { return __awaiter(_this, void 0, void 0, function () {
            var config, issue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadConfig(context)];
                    case 1:
                        config = _a.sent();
                        issue = context.issue();
                        if (!(config[this.configName] === issue.issue_number)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.loadIssue(context, /* force */ true)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        return _this;
    }
    CachedIssueTracker.prototype.loadIssue = function (context, force) {
        if (force === void 0) { force = false; }
        return __awaiter(this, void 0, void 0, function () {
            var key, config, subsPayload, subsText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = repoKey(context);
                        if (!(!(key in this.repoIssues) || force)) return [3 /*break*/, 5];
                        context.log({ key: key }, 'loadIssue');
                        return [4 /*yield*/, this.loadConfig(context)];
                    case 1:
                        config = _a.sent();
                        if (!(config != null && this.configName in config)) return [3 /*break*/, 3];
                        return [4 /*yield*/, context.octokit.issues.get(context.repo({ issue_number: config[this.configName] }))];
                    case 2:
                        subsPayload = _a.sent();
                        subsText = subsPayload.data['body'];
                        context.log({ subsText: subsText });
                        this.repoIssues[key] = this.issueParser(subsText);
                        return [3 /*break*/, 4];
                    case 3:
                        context.log("".concat(this.configName, " is not found in config, initializing with empty string"));
                        this.repoIssues[key] = this.issueParser('');
                        _a.label = 4;
                    case 4:
                        context.log({ parsedIssue: this.repoIssues[key] });
                        _a.label = 5;
                    case 5: return [2 /*return*/, this.repoIssues[key]];
                }
            });
        });
    };
    return CachedIssueTracker;
}(CachedConfigTracker));
exports.CachedIssueTracker = CachedIssueTracker;
function parseSubscriptions(rawSubsText) {
    var subsText = rawSubsText.replace('\r', '');
    var subsRows = subsText.match(/^\*.+/gm);
    var subscriptions = {};
    if (subsRows == null) {
        return subscriptions;
    }
    subsRows.forEach(function (row) {
        var labelMatch = row.match(/^\* +([^@]+)/);
        if (labelMatch) {
            var label = labelMatch[1].trim();
            var users = row.match(/@[a-zA-Z0-9-/]+/g);
            if (users) {
                subscriptions[label] = users.map(function (u) { return u.substring(1); });
            }
        }
    });
    return subscriptions;
}
exports.parseSubscriptions = parseSubscriptions;
