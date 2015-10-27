/*
Functions for gathering choices from answers to previous questions
*/

askjs_core.factory('ChoiceGatherer', ['Logger','Normalizer', function(Logger, Normalizer) {


    function getForFreetext(answer) {

        if (!answer.text)
            return [] ;

        return [answer.text] ;
    }

    function getForMultitext(answer) {

        if (!answer.entries)
            return [] ;

        return answer.entries ;
    }

    function getForSinglechoice(answer) {

        if (!answer.choice)
            return [] ;

        return [answer.choice] ;
    }

    function getForMultichoice(answer) {

        if (!answer.choices)
            return [] ;

        return answer.choices ;
    }

    function getForMood(answer) {

        if (!answer.mood)
            return [] ;

        return answer.mood.name ;
    }

    function getForField(field, answer) {

        switch(field.type) {

            case 'freetext':
                return getForFreetext(answer) ;
            case 'multitext':
                return getForMultitext(answer) ;
            case 'singlechoice':
                return getForSinglechoice(answer) ;
            case 'multichoice':
                return getForMultichoice(answer) ;
            case 'mood':
                return getForMood(answer) ;
            default:
                Logger.warn("Tried to get autochoices from invalid field type " + field.type + " (" + field.id + ")", "ask.logic.choiceSources") ;
        }

        return [] ;
    }

    return {

        gatherChoices: function(choiceSources, response) {

            var combinedChoices = [] ;
            var normalizedChoices = [] ;

            _.each(choiceSources, function(choiceSource) {

                var answer = response.answers[choiceSource.id] ;

                if (answer == null)
                    return ;

                _.each(getForField(choiceSource, answer), function(choice) {

                    var normalizedChoice = Normalizer.normalize(choice) ;

                    if (normalizedChoice.length == 0)
                        return ;

                    if (!_.contains(normalizedChoices, normalizedChoice)) {
                        combinedChoices.push({name:choice}) ;
                        normalizedChoices.push(choice) ;
                    }

                }) ;

            }) ;

            return combinedChoices ;
        }
    }
}]) ;