angular.module('perfect_scrollbar', []).directive('perfectScrollbar',
    ['$parse', '$window', '$timeout', function ($parse, $window, $timeout) {
        var psOptions = [
            'wheelSpeed',
            'wheelPropagation',
            'swipePropagation',
            'minScrollbarLength',
            'maxScrollbarLength',
            'useBothWheelAxes',
            'useKeyboard',
            'suppressScrollX',
            'suppressScrollY',
            'scrollXMarginOffset',
            'scrollYMarginOffset',
            'includePadding'
        ];

        return {
            restrict: 'EA',
            transclude: true,
            template: '<div><div ng-transclude></div></div>',
            replace: true,
            scope: {
                scrollToTop: "=",
                scrollToBottom: "=",
                autoScrollDisabled: "=",
                onTop: '&',
                onBottom: '&'
            },
            link: function ($scope, $elem, $attr) {
                var jqWindow = angular.element($window);
                var options = {};

                for (var i = 0, l = psOptions.length; i < l; i++) {
                    var opt = psOptions[i];
                    if ($attr[opt] !== undefined) {
                        options[opt] = $parse($attr[opt])();
                    }
                }

                $scope.$evalAsync(function () {
                    $elem.perfectScrollbar(options);
                    var onScrollHandler = $parse($attr.onScroll);
                    $elem.scroll(function () {
                        var scrollTop = $elem.scrollTop();
                        var scrollHeight = $elem.prop('scrollHeight') - $elem.height();
                        $scope.$apply(function () {
                            onScrollHandler($scope, {
                                scrollTop: scrollTop,
                                scrollHeight: scrollHeight
                            })
                        })
                    });
                });

                function update(event) {
                    $scope.$evalAsync(function () {
                        if ($attr.scrollDown == 'true' && event != 'mouseenter') {
                            setTimeout(function () {
                                $($elem).scrollTop($($elem).prop("scrollHeight"));
                            }, 100);
                        }
                        $elem.perfectScrollbar('update');
                    });
                }

                // This is necessary when you don't watch anything with the scrollbar
                $elem.bind('mouseenter', update('mouseenter'));

                // Possible future improvement - check the type here and use the appropriate watch for non-arrays
                if ($attr.refreshOnChange) {
                    $scope.$watchCollection($attr.refreshOnChange, function () {
                        update();
                    });
                }

                // this is from a pull request - I am not totally sure what the original issue is but seems harmless
                if ($attr.refreshOnResize) {
                    jqWindow.on('resize', update);
                }

                $elem.bind('$destroy', function () {
                    jqWindow.off('resize', update);
                    $elem.perfectScrollbar('destroy');
                });

                $scope.$watchCollection('scrollToTop', function (newValue) {
                    if (newValue) {
                        if (!$scope.autoScrollDisabled) {
                            $timeout(function () { // NOTICE: 暫定的にtimeoutで非同期を回避
                                $elem[0].scrollTop = 0;
                                $elem.perfectScrollbar('update');
                            }, 100);
                        }
                    }
                });

                $scope.$watchCollection('scrollToBottom', function (newValue) {
                    if (newValue) {
                        if (!$scope.autoScrollDisabled) {
                            $timeout(function () { // NOTICE: 暫定的にtimeoutで非同期を回避
                                $elem[0].scrollTop = $elem[0].scrollHeight;
                                $elem.perfectScrollbar('update');
                            }, 100);
                        }
                    }
                });

                $elem.bind('scroll', function () {
                    if (this.scrollTop == 0) {
                        if ($scope.onTop) {
                            $scope.onTop();
                        }
                    } else if (this.scrollTop == this.scrollHeight - this.offsetHeight) {
                        if ($scope.onBottom) {
                            $scope.onBottom();
                        }
                    }
                });
            }
        };
    }]);
