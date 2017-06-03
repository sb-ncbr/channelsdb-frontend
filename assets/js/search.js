/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var ChannelsDB;
(function (ChannelsDB) {
    "use strict";
    function readData(data) {
        return new Promise(function (resolve, reject) {
            data.onerror = function (e) {
                var error = e.target.error;
                reject(error ? error : 'Failed.');
            };
            data.onload = function (e) { return resolve(e); };
        });
    }
    var RequestPool = (function () {
        function RequestPool() {
        }
        RequestPool.get = function () {
            if (this.pool.length)
                return this.pool.pop();
            return new XMLHttpRequest();
        };
        RequestPool.emptyFunc = function () { };
        RequestPool.deposit = function (req) {
            if (this.pool.length < this.poolSize) {
                req.onabort = RequestPool.emptyFunc;
                req.onerror = RequestPool.emptyFunc;
                req.onload = RequestPool.emptyFunc;
                req.onprogress = RequestPool.emptyFunc;
                this.pool.push();
            }
        };
        return RequestPool;
    }());
    RequestPool.pool = [];
    RequestPool.poolSize = 15;
    function processAjax(e) {
        var req = e.target;
        if (req.status >= 200 && req.status < 400) {
            var text = JSON.parse(e.target.responseText);
            RequestPool.deposit(e.target);
            return text;
        }
        else {
            var status_1 = req.statusText;
            RequestPool.deposit(e.target);
            throw status_1;
        }
    }
    function ajaxGetJson(url) {
        return __awaiter(this, void 0, void 0, function () {
            var xhttp, e;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        xhttp = RequestPool.get();
                        xhttp.open('get', url, true);
                        xhttp.responseType = "text";
                        xhttp.send();
                        return [4 /*yield*/, readData(xhttp)];
                    case 1:
                        e = _a.sent();
                        return [2 /*return*/, processAjax(e)];
                }
            });
        });
    }
    ChannelsDB.ajaxGetJson = ajaxGetJson;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var ChannelsDB;
(function (ChannelsDB) {
    function updateViewState(state, viewState) {
        state.viewState = viewState;
        state.stateUpdated.onNext(void 0);
    }
    ChannelsDB.updateViewState = updateViewState;
    function initState() {
        var state = {
            searchTerm: new Rx.Subject(),
            viewState: { kind: 'Info' },
            stateUpdated: new Rx.Subject()
        };
        state.searchTerm
            .distinctUntilChanged()
            .debounce(250)
            .forEach(function (t) {
            if (t.trim().length > 0) {
                search(state, t).takeUntil(state.searchTerm).subscribe(function (data) { return updateViewState(state, { kind: 'Searched', data: data }); }, function (err) { return updateViewState(state, { kind: 'Error', message: '' + err }); });
            }
            else {
                updateViewState(state, { kind: 'Info' });
            }
        });
        return state;
    }
    ChannelsDB.initState = initState;
    function search(state, term) {
        updateViewState(state, { kind: 'Loading', message: 'Searching...' });
        var s = new Rx.Subject();
        ChannelsDB.ajaxGetJson("https://www.ebi.ac.uk/pdbe/search/pdb-autocomplete/select?rows=20000&json.nl=map&group=true&group.field=category&group.limit=25&fl=value,num_pdb_entries,var_name&sort=category+asc,num_pdb_entries+desc&q=value:" + term + "*~10&wt=json")
            .then(function (data) { s.onNext(data); s.onCompleted(); })
            .catch(function (err) { s.onError(err); s.onCompleted(); });
        return s;
    }
    function fetchPdbEntries(var_name, value, start, count) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ChannelsDB.ajaxGetJson("https://www.ebi.ac.uk/pdbe/search/pdb/select?q=*:*&group=true&group.field=pdb_id&rows=" + count + "&group.ngroups=true&fl=pdb_id,title,experimental_method,organism_scientific_name,resolution,entry_organism_scientific_name&json.nl=map&fq=" + encodeURIComponent(var_name) + ":\"" + encodeURIComponent(value) + "\"&sort=overall_quality+desc&wt=json")];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data.grouped.pdb_id.groups];
                }
            });
        });
    }
    ChannelsDB.fetchPdbEntries = fetchPdbEntries;
    function loadGroupDocs(var_name, group, offset, count) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    }
    ChannelsDB.loadGroupDocs = loadGroupDocs;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var ChannelsDB;
(function (ChannelsDB) {
    function renderUI(target) {
        ReactDOM.render(React.createElement(App, { state: ChannelsDB.initState() }), target);
    }
    ChannelsDB.renderUI = renderUI;
    var App = (function (_super) {
        __extends(App, _super);
        function App() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        App.prototype.componentDidMount = function () {
            this.load();
        };
        App.prototype.load = function () {
        };
        App.prototype.render = function () {
            return React.createElement("div", { className: 'container' },
                React.createElement("nav", { className: "navbar navbar-default" },
                    React.createElement("div", { className: "container-fluid" },
                        React.createElement("div", { className: "navbar-header" },
                            React.createElement("a", { className: "navbar-brand", href: "#" }, "ChannelsDB")),
                        React.createElement("div", { id: "navbar", className: "navbar-collapse collapse" },
                            React.createElement("ul", { className: "nav navbar-nav navbar-right" },
                                React.createElement("li", null,
                                    React.createElement("a", { href: "#" }, "MOLE")),
                                React.createElement("li", null,
                                    React.createElement("a", { href: "#" }, "Contribute")))))),
                React.createElement(MainView, __assign({}, this.props)),
                React.createElement("hr", { className: "featurette-divider" }),
                React.createElement("footer", null,
                    React.createElement("p", { className: 'pull-right', style: { color: '#999' } }, "\u00A9 2017 Luk\u00E1\u0161 Pravda & David Sehnal")));
        };
        return App;
    }(React.Component));
    ChannelsDB.App = App;
    var MainView = (function (_super) {
        __extends(MainView, _super);
        function MainView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MainView.prototype.render = function () {
            return React.createElement("div", { style: { marginTop: '35px' } },
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: "col-lg-12" },
                        React.createElement(SearchBox, __assign({}, this.props)))),
                React.createElement("div", { className: 'row' },
                    React.createElement("div", { className: "col-lg-12" },
                        React.createElement(StateView, __assign({}, this.props)))));
        };
        return MainView;
    }(React.Component));
    ChannelsDB.MainView = MainView;
    var StateView = (function (_super) {
        __extends(StateView, _super);
        function StateView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        StateView.prototype.componentDidMount = function () {
            var _this = this;
            this.props.state.stateUpdated.subscribe(function () { return _this.forceUpdate(); });
        };
        StateView.prototype.render = function () {
            var state = this.props.state.viewState;
            try {
                switch (state.kind) {
                    case 'Info': return React.createElement(Info, null);
                    case 'Loading': return React.createElement("div", null, state.message);
                    case 'Searched': return React.createElement(SearchResults, __assign({}, this.props));
                    case 'Error': return React.createElement("div", null,
                        "Error: ",
                        state.message);
                    default: return React.createElement("div", null, "Should not happen ;)");
                }
            }
            catch (e) {
                return React.createElement("div", null,
                    "Error: ",
                    '' + e);
            }
        };
        return StateView;
    }(React.Component));
    ChannelsDB.StateView = StateView;
    var SearchBox = (function (_super) {
        __extends(SearchBox, _super);
        function SearchBox() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SearchBox.prototype.render = function () {
            var _this = this;
            return React.createElement("form", null,
                React.createElement("div", { className: "form-group form-group-lg" },
                    React.createElement("input", { type: 'text', className: "form-control", style: { fontWeight: 'bold' }, placeholder: "Search...", onChange: function (e) { return _this.props.state.searchTerm.onNext(e.target.value); } })));
        };
        return SearchBox;
    }(React.Component));
    ChannelsDB.SearchBox = SearchBox;
    var Info = (function (_super) {
        __extends(Info, _super);
        function Info() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Info.prototype.render = function () {
            return React.createElement("div", null, "Examples etc go here.");
        };
        return Info;
    }(React.Component));
    ChannelsDB.Info = Info;
    var SearchResults = (function (_super) {
        __extends(SearchResults, _super);
        function SearchResults() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SearchResults.prototype.empty = function () {
            return React.createElement("div", null, "No results");
        };
        SearchResults.prototype.groups = function () {
            var _this = this;
            var data = this.props.state.viewState.data;
            var groups = data.grouped.category.groups;
            return groups.map(function (g, i) { return React.createElement(SearchGroup, __assign({ key: g.groupValue + '--' + i }, _this.props, { group: g })); });
        };
        SearchResults.prototype.render = function () {
            try {
                var data = this.props.state.viewState.data;
                console.log(data);
                if (!data.grouped.category.groups.length)
                    return this.empty();
                return React.createElement("div", null, this.groups());
            }
            catch (e) {
                return this.empty();
            }
        };
        return SearchResults;
    }(React.Component));
    ChannelsDB.SearchResults = SearchResults;
    var SearchGroup = (function (_super) {
        __extends(SearchGroup, _super);
        function SearchGroup() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = { expanded: false, docs: [], isLoading: false, entries: void 0 };
            _this.toggle = function (e) {
                e.preventDefault();
                _this.setState({ expanded: !_this.state.expanded });
            };
            _this.showEntries = function (e) {
                e.preventDefault();
                var value = e.target.getAttribute('data-value');
                var var_name = e.target.getAttribute('data-var');
                var count = +e.target.getAttribute('data-count');
                _this.setState({ entries: { group: _this.props.group.groupValue, value: value, var_name: var_name, count: count } });
            };
            _this.loadMore = function () { return __awaiter(_this, void 0, void 0, function () {
                var data, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.setState({ isLoading: true });
                            return [4 /*yield*/, ChannelsDB.loadGroupDocs('', '', this.state.docs.length, 25)];
                        case 1:
                            data = _a.sent();
                            this.setState({ isLoading: false, docs: this.state.docs.concat(data) });
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            this.setState({ isLoading: false });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            return _this;
        }
        SearchGroup.prototype.componentDidMount = function () {
            this.setState({ docs: this.props.group.doclist.docs });
        };
        SearchGroup.prototype.entry = function (d, i) {
            return React.createElement("div", { key: d.value + d.var_name + '--' + i },
                React.createElement("a", { href: '#', "data-value": d.value, "data-var": d.var_name, "data-count": d.num_pdb_entries, onClick: this.showEntries, title: "" + d.value }, d.value),
                React.createElement("div", { className: 'count' }, d.num_pdb_entries));
        };
        SearchGroup.prototype.render = function () {
            var _this = this;
            var g = this.props.group;
            return React.createElement("div", { style: { marginBottom: '10px' } },
                React.createElement("div", { className: 'group-header' },
                    React.createElement("button", { className: 'btn btn-default btn-block', onClick: this.toggle },
                        React.createElement("span", { className: "glyphicon glyphicon-" + (this.state.expanded ? 'minus' : 'plus'), "aria-hidden": "true" }),
                        " ",
                        React.createElement("span", null, g.groupValue),
                        " (",
                        g.doclist.numFound,
                        ")")),
                React.createElement("div", { className: 'group-list-wrap', style: { display: this.state.entries ? 'none' : 'block' } },
                    React.createElement("div", { className: 'group-list', style: { display: this.state.expanded ? 'block' : 'none' } },
                        this.state.docs.map(function (d, i) { return _this.entry(d, i); }),
                        this.state.docs.length < g.doclist.numFound
                            ? React.createElement("div", { style: { padding: 0 } },
                                React.createElement("button", { style: { width: '100%', display: 'block' }, className: 'btn btn-xs btn-primary', disabled: this.state.isLoading ? true : false, onClick: this.loadMore }, this.state.isLoading ? 'Loading...' : 'Show more'))
                            : void 0),
                    React.createElement("div", { style: { clear: 'both' } })),
                this.state.entries
                    ? React.createElement("div", { className: 'entry-list-wrap' },
                        React.createElement("button", { className: 'btn btn-block btn-primary', onClick: function () { return _this.setState({ entries: void 0 }); } },
                            React.createElement("span", { className: "glyphicon glyphicon-chevron-left", "aria-hidden": "true" })),
                        React.createElement(Entries, __assign({ state: this.props.state }, this.state.entries)))
                    : void 0);
        };
        return SearchGroup;
    }(React.Component));
    ChannelsDB.SearchGroup = SearchGroup;
    var Entries = (function (_super) {
        __extends(Entries, _super);
        function Entries() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = { isLoading: false, entries: [] };
            _this.fetch = function () { return __awaiter(_this, void 0, void 0, function () {
                var data, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.setState({ isLoading: true });
                            return [4 /*yield*/, ChannelsDB.fetchPdbEntries(this.props.var_name, this.props.value, this.state.entries.length, 5)];
                        case 1:
                            data = _a.sent();
                            this.setState({ isLoading: false, entries: this.state.entries.concat(data) });
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _a.sent();
                            this.setState({ isLoading: false });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            return _this;
        }
        Entries.prototype.componentDidMount = function () {
            this.fetch();
        };
        Entries.prototype.entry = function (e, i) {
            var docs = e.doclist.docs[0];
            return React.createElement("div", { key: docs.pdb_id + '--' + i, className: 'well' },
                React.createElement("ul", null,
                    React.createElement("li", null,
                        "PDB ID: ",
                        docs.pdb_id),
                    React.createElement("li", null,
                        "Name: ",
                        docs.title || 'n/a'),
                    React.createElement("li", null,
                        "Experiment Method: ",
                        (docs.experimental_method || ['n/a']).join(', '),
                        " | Resolution: ",
                        docs.resolution || 'n/a'),
                    React.createElement("li", null,
                        "Organism: ",
                        (docs.organism_scientific_name || ['n/a']).join(', '))));
        };
        Entries.prototype.render = function () {
            var _this = this;
            var groups = this.state.entries;
            return React.createElement("div", null,
                React.createElement("h4", null,
                    React.createElement("b", null, this.props.group),
                    ": ",
                    this.props.value,
                    " ",
                    React.createElement("small", null,
                        "(",
                        this.props.count,
                        ")")),
                React.createElement("div", { style: { marginTop: '15px' } },
                    groups.map(function (g, i) { return _this.entry(g, i); }),
                    this.state.entries.length < this.props.count
                        ? React.createElement("button", { className: 'btn btn-sm btn-primary btn-block', disabled: this.state.isLoading ? true : false, onClick: this.fetch }, this.state.isLoading ? 'Loading...' : 'Show more')
                        : void 0));
        };
        return Entries;
    }(React.Component));
    ChannelsDB.Entries = Entries;
})(ChannelsDB || (ChannelsDB = {}));
/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */
var ChannelsDB;
(function (ChannelsDB) {
    ChannelsDB.renderUI(document.getElementById('app'));
})(ChannelsDB || (ChannelsDB = {}));