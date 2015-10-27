/*
Functions for replacing placeholders, so that answers to previous questions can get injected into fields
*/


askjs_core.factory('PlaceholderResolver', ['Logger', 'AnswerStates', function(Logger, AnswerStates) {



    return {

        resolve: function(text, state) {


            var placeholderRegex = /\[\[([^\]]+)\]\]/g;

            var resolvedText = "" ;

            var match = placeholderRegex.exec(text);
            var index = 0 ;
            while (match != null) {

                Logger.debug("found " + match[0] + "at " + match.index, "ask.logic.placeholder") ;

                resolvedText = resolvedText + text.substr(index,match.index-index) ;

                var questionId = match[1] ;
                Logger.debug("Resolving placeholder [[" + questionId + "]]", "ask.logic.placeholder") ;

                var question = state.schema.fieldsById[questionId] ;

                if (!question) {
                    Logger.warn("Could not find question for placeholder " + questionId, "ask.logic.placeholder") ;
                    continue ;
                }

                var answer = state.response.answers[questionId] ;


                if (answer == null || !AnswerStates.isAnswered(question, answer)) {
                    resolvedText = resolvedText + "`unansweredQuestion:" + questionId + "`" ;
                    Logger.warn("Could not find answer for placeholder " + questionId, "ask.logic.placeholder") ;
                } else {
                    resolvedText = resolvedText + AnswerStates.answerAsString(question, answer) ;
                }

                index = match.index + match[0].length ;

                match = placeholderRegex.exec(text);

            }

            resolvedText = resolvedText + text.substr(index) ;

            return resolvedText ;
        }
    }
}]) ;