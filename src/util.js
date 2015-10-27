



askjs_core.factory('Normalizer', function() {

    var punct = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#\$%&\(\)\*\+,\-\.\/:;<=>\?@\[\]\^_`\{\|\}~]/g;

    function process(text) {

        if (text == null)
            return "" ;

        var t = text.replace(punct, " ") ;
        t = t.replace(/\s+/g, " ") ;
        t = t.toLowerCase() ;
        t = t.trim() ;

        return t ;
    }


    return {

        normalize: function(text) {
            return process(text) ;
        },

        normalizeAll: function(array) {
            return _.map(array, function(val) {
                return process(val) ;
            }) ;
        }
    }

}) ;





askjs_core.factory('Logger', ['$log', function($log) {

        var levels = ['trace','debug','info','warn','error'] ;

        var levelIndexes = {
            trace: 0,
            debug: 1,
            info: 2,
            warn: 3,
            error: 4
        } ;

        var levelsByContext = {} ;
        levelsByContext['*'] = 'warn' ;

        function getLogLevel(context) {

            var contextChunks = context.split(".") ;

            for (i=contextChunks.length ; i >= 0 ; i--) {

                var relevantContextChunks = contextChunks.slice(0,i) ;
                var contextPath = relevantContextChunks.join('.') ;

                //console.log(contextPath + "->" + levelsByContext[contextPath]) ;

                if (levelsByContext[contextPath])
                    return levelsByContext[contextPath] ;
            }

            return levelsByContext['*'] ;
        }

        function isLoggable(level, context) {

            if (!context)
                context = '*' ;

            var minLevel = getLogLevel(context) ;

            return (levelIndexes[level] >= levelIndexes[minLevel]) ;
        }

        return {

            setLogLevel: function(level, context) {

                if (levelIndexes[level] == null)
                    $log.warn(level + " is not a valid log level") ;

                if (!context)
                    context = '*' ;

                levelsByContext[context] = level ;
            },

            trace: function(content, context) {

                if (!isLoggable('trace', context))
                    return ;

                $log.trace(content) ;
            },

            debug: function(content, context) {

                if (!isLoggable('debug', context))
                    return ;

                $log.debug(content) ;
            },

            info: function(content, context) {

                if (!isLoggable('info', context))
                    return ;

                $log.info(content) ;
            },

            warn: function(content, context) {

                if (!isLoggable('warn', context))
                    return ;

                $log.warn(content) ;
            },

            error: function(content, context) {

                if (!isLoggable('error', context))
                    return ;

                $log.error(content) ;
            }

        }


    }]) ;