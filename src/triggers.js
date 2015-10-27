/**
 * Useful functions for determining wheither a trigger has been fired
 */


askjs_core.factory('TriggerStates', ['Logger','Normalizer', function(Logger, Normalizer) {

    function getQuestionIdsForTrigger(trigger) {

        if (trigger.questionId != undefined && trigger.questionId != null) {
            return [trigger.questionId] ;
        }

        if (!!trigger.and) {

            var questionIds = [] ;

            _.each(trigger.and, function(subTrigger) {
                questionIds = _.union(questionIds, getQuestionIdsForTrigger(subTrigger)) ;
            }) ;

            return questionIds ;
        }

        if (!!trigger.or) {

            var questionIds = [] ;

            _.each(trigger.or, function(subTrigger) {
                questionIds = _.union(questionIds, getQuestionIdsForTrigger(subTrigger)) ;
            }) ;

            return questionIds ;
        }

        Logger.warn("could not identify type of trigger", "ask.logic.triggers") ;
        return [] ;

    }


    function isTriggerFired(trigger, state) {

        Logger.debug(" - checking trigger " + JSON.stringify(trigger), "ask.logic.triggers") ;

        if (trigger.questionId != undefined || trigger.questionId != null)
            return isQuestionTriggerFired(trigger, state) ;

        if (trigger.and != undefined || trigger.and != null)
            return isAndTriggerFired(trigger, state) ;

        if (trigger.or != undefined || trigger.or != null)
            return isOrTriggerFired(trigger, state) ;

        Logger.warn("could not identify type of trigger", "ask.logic.triggers") ;
        return false ;
    }

    function isAndTriggerFired(trigger, state) {

        var fired = true ;

        _.each(trigger.and, function(subTrigger) {
            if (!isTriggerFired(subTrigger, state)) {
                fired = false ;
                return false ;
            }
        }) ;

        return fired ;
    }

    function isOrTriggerFired(trigger, state) {

        var fired = false ;

        _.each(trigger.or, function(subTrigger) {
            if (isTriggerFired(subTrigger, state)) {
                fired = true ;
                return false ;
            }
        }) ;

        return fired ;
    }

    function isQuestionTriggerFired(trigger, state) {

        Logger.debug("checking fire state of " + JSON.stringify(trigger), "ask.logic.triggers") ;

        var field = state.schema.fieldsById[trigger.questionId] ;

        if (field == null) {
            Logger.warn("Could not identify field \"" + trigger.questionId + "\"", "ask.logic.triggers") ;
            return false ;
        }

        var answer = state.response.answers[trigger.questionId] ;
        if (answer == null)
            return false ;

        var fired = false ;

        switch(field.type) {

            case 'singlechoice' :
                fired = isSinglechoiceTriggerFired(trigger, answer) ;
                break ;
            case 'multichoice' :
                fired = isMultichoiceTriggerFired(trigger, answer) ;
                break ;
            case 'numeric' :
                fired = isNumericTriggerFired(trigger, answer) ;
                break ;
            case 'freetext' :
                fired = isFreetextTriggerFired(trigger, answer) ;
                break ;
            case 'multitext' :
                fired = isMultitextTriggerFired(trigger, answer) ;
                break ;
            case 'rating' :
                fired = isRatingTriggerFired(trigger, answer) ;
                break ;
            case 'mood' :
                fired = isMoodTriggerFired(trigger, answer) ;
                break ;
            default :
                Logger.warn("could not identify fire state of trigger for field type " + field.type, "ask.logic.triggers") ;
                break ;
        }

        if (fired)
            Logger.debug(" - fired", "ask.logic.triggers") ;
        else
            Logger.debug(" - not fired", "ask.logic.triggers") ;

        return fired ;

    }

    function isSinglechoiceTriggerFired(trigger, answer) {

        Logger.debug(" - checking single choice trigger " + JSON.stringify(trigger), "ask.logic.triggers") ;
        Logger.debug(" - - against " + JSON.stringify(answer), "ask.logic.triggers") ;

        if (answer.choice == null) {
            return false ;
        }

        switch(trigger.condition) {

            case 'is' :
                return Normalizer.normalize(answer.choice) == Normalizer.normalize(trigger.choice) ;
            case 'isNot' :
                return Normalizer.normalize(answer.choice) != Normalizer.normalize(trigger.choice) ;
        }

        return false ;
    }

    function isMultichoiceTriggerFired(trigger, answer) {

        if (answer.choices == null)
            return false ;

        var normalizedChoices = Normalizer.normalizeAll(answer.choices) ;

        var idx = normalizedChoices.indexOf(Normalizer.normalize(trigger.choice)) ;

        switch(trigger.condition) {
            case 'contains' :
                return idx >= 0 ;
            case 'notContains' :
                return idx < 0 ;
        }

        return false ;
    }

    function isNumericTriggerFired(trigger, answer) {

        if (answer.number === undefined || answer.number === null)
            return false ;

        switch(trigger.condition) {

            case 'equal' :
                return answer.number == trigger.number ;
            case 'greaterThan' :
                return answer.number > trigger.number ;
            case 'lessThan' :
                return answer.number < trigger.number ;

        }

        return false ;
    }

    function isFreetextTriggerFired(trigger, answer) {

        if (!answer.text)
            return false ;

        var answerText = Normalizer.normalize(answer.text) ;
        var triggerText = Normalizer.normalize(trigger.text) ;

        switch(trigger.condition) {

            case 'is':
                return answerText == triggerText ;
            case 'isNot':
                return answerText != triggerText ;
            case 'contains':
                return answerText.indexOf(triggerText) >= 0 ;
            case 'startsWith':
                return answerText.indexOf(triggerText) == 0 ;
        }

        return false ;
    }

    function isMultitextTriggerFired(trigger, answer) {

        //handle count-based triggers
        switch (trigger.condition) {

            case 'countEquals':
                return answer.entries.length == trigger.count ;
            case 'countGreaterThan':
                return answer.entries.length > trigger.count ;
            case 'countLessThan' :
                return answer.entries.length < trigger.count ;

        }

        //handle text-based triggers, which require us to iterate through entries

        var triggerText = Normalizer.normalize(trigger.entry) ;

        var validEntry = _.find(answer.entries, function(entry) {

            var entryText = Normalizer.normalize(entry) ;

            switch(trigger.condition) {
                case 'entryIs':
                    return entryText == triggerText ;
                case 'entryContains':
                    return entryText.indexOf(triggerText) >= 0 ;
                case 'entryStartsWith':
                    return entryText.indexOf(triggerText) == 0 ;

            }

            return false ;
        }) ;

        if (validEntry)
            return true ;
        else
            return false ;

    }


    function isRatingTriggerFired(trigger, answer) {

        if (answer.rating === undefined || answer.rating === null)
            return false ;

        switch(trigger.condition) {

            case 'equal' :
                return answer.rating == trigger.rating ;
            case 'greaterThan' :
                return answer.rating > trigger.rating ;
            case 'lessThan' :
                return answer.rating < trigger.rating ;

        }

        return false ;
    }


    function isMoodTriggerFired(trigger, answer) {

        if (!answer.mood)
            return false ;

        switch(trigger.condition) {

            case 'is':
                return areMoodsEqual(trigger.mood, answer.mood) ;
            case 'isNot':
                return !areMoodsEqual(trigger.mood, answer.mood) ;
            case 'isNear':
                return areMoodsAdjacent(trigger.mood, answer.mood) ;
            case 'isSameQuadrant':
                return getQuadrant(trigger.mood) == getQuadrant(answer.mood) ;
        }

        return false ;
    }


    function areMoodsEqual(mood1, mood2) {

        if (Math.abs(mood1.valence-mood2.valence) > 0.05)
            return false ;

        if (Math.abs(mood1.arousal-mood2.arousal) > 0.05)
            return false ;

        return true ;
    }

    function areMoodsAdjacent(mood1, mood2) {

        if (Math.abs(mood1.valence-mood2.valence) > 0.25)
            return false ;

        if (Math.abs(mood1.arousal-mood2.arousal) > 0.25)
            return false ;

        return true ;
    }

    function getQuadrant(mood) {

        if (mood.arousal >= 0) {
            if (mood.valence >= 0)
                return 'ne' ;
            else
                return 'nw' ;

        } else {
            if (mood.valence >= 0)
                return 'se' ;
            else
                return 'sw' ;
        }
    }



    return {

        isFired : function (trigger, state, response) {

            Logger.debug("checking fire state of " + JSON.stringify(trigger), "ask.logic.triggers") ;
            return isTriggerFired(trigger, state, response) ;
        },

        getQuestionIds : function(trigger) {

            Logger.debug("identifying question ids for " + JSON.stringify(trigger), "ask.logic.triggers") ;

            var questionIds = getQuestionIdsForTrigger(trigger) ;

            Logger.debug(questionIds, "ask.logic.triggers") ;

            return questionIds ;
        }


    }
}]) ;