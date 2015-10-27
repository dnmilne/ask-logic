/*
 Helpful functions for determining whether question is answered, and turning answers into simple strings.
*/


askjs_core.factory('AnswerStates', ['Logger', function(Logger) {


    function isSinglechoiceAnswered(answer) {

        if (answer.choice == null)
            return false ;

        return true ;
    }

    function isMultichoiceAnswered(answer) {

        if (!answer.choices || !answer.choices.length)
            return false ;

        return true ;
    }

    function isNumericAnswered(answer) {

        if (answer.number == null)
            return false ;

        return true ;
    }

    function isFreetextAnswered(answer) {

        if (answer.text == null)
            return false ;

        if (answer.text.trim().length == 0)
            return false ;

        return true ;
    }

    function isMultitextAnswered(answer, field) {

        Logger.debug("checking if multitext question answered", "ask.logic.answers") ;
        Logger.debug(answer, "ask.logic.answers") ;

        if (!answer.entries)
            return false ;

        if (answer.entries.length < 1)
            return false ;

        if (field.minEntries && answer.entries.length < field.minEntries)
            return false ;

        if (field.maxEntries && answer.entries.length > field.maxEntries)
            return false ;

        var allEntriesValid = true ;

        _.each(answer.entries, function(entry) {
            if (entry == null)
                allEntriesValid = false ;

            if (entry.trim().length == 0)
                allEntriesValid = false ;
        }) ;

        return allEntriesValid ;
    }

    function isRatingAnswered(answer) {

        if (!answer.rating)
            return false ;

        return true ;
    }

    function isMoodAnswered(answer) {

        if (!answer.mood)
            return false ;

        return true ;
    }

    function singlechoiceAsString(answer) {

        return answer.choice ;
    }

    function multichoiceAsString(answer) {

        //TODO: this could be tidier.

        if (!answer.choices || !answer.choices.length)
            return "none" ;

        return answer.choices.join(",") ;
    }

    function numericAsString(answer) {
        if (!answer.number)
            return "unknown" ;

        return answer.number ;
    }

    function freetextAsString(answer) {
        if (!answer.text)
            return "" ;

        return answer.text ;
    }

    function multitextAsString(answer) {
        if (!answer.entries)
            return "" ;

        return answer.entries.join() ;
    }

    function ratingAsString(answer) {
        if (!answer.rating)
            return "unknown" ;

        return answer.rating ;
    }

    function moodAsString(answer) {
        if (!answer.mood)
            return "nothing" ;

        if (!answer.mood.name)
            return "nothing" ;

        return answer.mood.name ;
    }

    return {

        isAnswered : function(field, answer) {

            if (!field) {
                Logger.warn("tried to check answer to nonexistent field", "ask.logic.answers") ;
                return false ;
            }

            if (!answer) {
                Logger.warn("tried to check undefined answer to field " + field.id, "ask.logic.answers")
                return false ;
            }

            Logger.debug("checking if " + field.id + " is answered", "ask.logic.answers") ;

            var answered = false ;

            switch(field.type) {

                case 'singlechoice' :
                    answered = isSinglechoiceAnswered(answer) ;
                    break ;
                case 'multichoice' :
                    answered = isMultichoiceAnswered(answer) ;
                    break ;
                case 'numeric' :
                    answered = isNumericAnswered(answer) ;
                    break ;
                case 'freetext' :
                    answered = isFreetextAnswered(answer) ;
                    break ;
                case 'multitext':
                    answered = isMultitextAnswered(answer, field) ;
                    break ;
                case 'rating' :
                    answered = isRatingAnswered(answer) ;
                    break ;
                case 'mood' :
                    answered = isMoodAnswered(answer) ;
                    break ;
                case 'score' :
                    answered = true ;
                    break ;
                default :
                    Logger.warn("cannot check answer of unknown field type " + field.type + " (" + field.id + ")", "ask.logic.answers") ;

            }

            if (answered)
                Logger.debug(field.id + " IS answered", "ask.logic.answers") ;
            else
                Logger.debug(field.id + " IS NOT answered", "ask.logic.answers") ;

            return answered ;
        },

        answerAsString: function(field, answer) {

            if (!field) {
                Logger.warn("tried to stringify answer to nonexistent field", "ask.logic.answers") ;
                return null ;
            }

            if (!answer) {
                Logger.warn("tried to stringify undefined answer to field " + field.id, "ask.logic.answers")
                return null ;
            }

            switch(field.type) {

                case 'singlechoice' :
                    return singlechoiceAsString(answer) ;
                case 'multichoice' :
                    return multichoiceAsString(answer) ;
                case 'numeric' :
                    return numericAsString(answer) ;
                case 'freetext' :
                    return freetextAsString(answer) ;
                case 'multitext' :
                    return multitextAsString(answer) ;
                case 'rating' :
                    return ratingAsString(answer) ;
                case 'mood' :
                    return moodAsString(answer) ;
                default :
                    Logger.warn("cannot stringify answer of unknown field type " + field.type + " (" + field.id + ")", "ask.logic.answers") ;

            }

            return null ;

        }
    }
}])