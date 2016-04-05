//# sourceURL=fetchButton.js

'use strict';

window.smartRApp.directive('fetchButton',
    ['$rootScope', 'rServeService', 'smartRUtils',
        function($rootScope, rServeService, smartRUtils) {
        return {
            restrict: 'E',
            scope: {
                loaded: '=',
                running: '=',
                disabled: '=',
                conceptMap: '=',
                biomarkers: '=?',
                showSummaryStats: '=?',
                summaryData: '=?',
                allSamples: '=?',
                subsets: '=?'
            },
            templateUrl: $rootScope.smartRPath +  '/js/smartR/_angular/templates/fetchButton.html',
            link: function(scope, element) {

                var template_btn = element.children()[0],
                    template_msg = element.children()[1];

                template_btn.disabled = scope.disabled;

                scope.$watch('disabled', function(newValue) {
                    template_btn.disabled = newValue;
                }, true);

                template_btn.onclick = function() {

                    var _init = function () {
                            scope.summaryData = {}; // reset
                            scope.allSamples = 0;
                            scope.subsets = 0;
                            scope.disabled = true;
                            scope.running = true;
                            template_msg.innerHTML = 'Fetching data, please wait <span class="blink_me">_</span>';
                        },

                        _getDataConstraints = function (biomarkers) {
                            if (typeof biomarkers !== 'undefined' && biomarkers.length > 0) {
                                var searchKeywordIds = biomarkers.map(function(biomarker) {
                                    return String(biomarker.id);
                                });
                                return {
                                    search_keyword_ids: {
                                        keyword_ids: searchKeywordIds
                                    }
                                };
                            }
                        },

                        _onSuccess = function(msg) {
                            template_msg.innerHTML = 'Success: ' + msg;
                            scope.subsets = smartRUtils.countCohorts();
                            scope.loaded = true;
                            scope.disabled = false;
                            scope.running = false;
                        },

                        _onFailure = function(msg) {
                            template_msg.innerHTML = 'Failure: ' + msg;
                            scope.loaded = false;
                            scope.disabled = false;
                            scope.running = false;
                        },

                        _afterDataFetched = function (msg) {
                            if (!scope.showSummaryStats) {
                                _onSuccess(msg);
                                return;
                            }

                            template_msg.innerHTML =
                                'Execute summary statistics, please wait <span class="blink_me">_</span>';

                            return rServeService.executeSummaryStats('fetch')
                                .then(function(data) {
                                    scope.summaryData = data.result;
                                    scope.allSamples = data.result.allSamples;
                                    _onSuccess(data.msg);
                                }, function(msg) {
                                    _onFailure(msg);
                                });
                        },
                        conceptKeys = smartRUtils.conceptBoxMapToConceptKeys(scope.conceptMap),
                        dataConstraints = _getDataConstraints(scope.biomarkers);

                    _init();

                    rServeService.loadDataIntoSession(conceptKeys, dataConstraints)
                        .then(
                            _afterDataFetched,
                            _onFailure
                        );

                }; // end onclick
            }
        };
    }]);
