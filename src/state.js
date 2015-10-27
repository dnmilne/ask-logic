askjs_core.factory('SurveyStates', ['Logger','TriggerStates', 'AnswerStates', 'Initializer', 'ChoiceGatherer','ScoreCalculator', function(Logger, TriggerStates, AnswerStates, Initializer, ChoiceGatherer, ScoreCalculator) {

    var defaultConfig = {
        autoAdvance: false
    } ;


    var logpath = "ask.core.state" ;

    function handleCurrentPageChanged(response, schema) {

        if (response.pageIndex == null) {
            if (response.completedAt)
                response.pageIndex = schema.pages.length ;
            else
                response.pageIndex = 0 ;
        }

        schema.page = schema.pages[response.pageIndex] ;

        _.each(schema.pages, function(page, pageIndex) {
            page.current = (pageIndex == response.pageIndex) ;
        }, this) ;
    }


    function updateVisibility(field) {

        var visible = true;

        if (field.hidden)
            visible = false ;

        if (field.fieldRuleAction == 'hide')
            visible = false ;

        Logger.debug("field " + field.id + " v=" + field.visible + " a=" + field.fieldRuleAction, logpath) ;

        field.visible = visible ;
    }

   function handleChoiceSourcesChanged(fieldId, fieldsById, response) {

        var field = fieldsById[fieldId] ;

        var choiceSources = [] ;

        _.each(field.choiceSources, function(choiceSourceId) {

            var choiceSource = fieldsById[choiceSourceId] ;

            if (!choiceSource) {
                Logger.error("Could not identify choice source " + choiceSourceId, logpath) ;
                return ;
            }

            choiceSources.push(choiceSource) ;

        }, this) ;

        field.autochoices = ChoiceGatherer.gatherChoices(choiceSources, response) ;
   }

    function getFieldRuleAction(field) {

        //if no affecting field rules, show it
        if (!field.affectingShowFieldRules.length && !field.affectingHideFieldRules.length)
            return 'show' ;

        if (field.affectingShowFieldRules.length) {

            var untriggeredShowFieldRule = _.find(field.affectingShowFieldRules, function(rule) {
                return !rule.fired ;
            }) ;

            if (untriggeredShowFieldRule)
                return 'hide' ;
            else
                return 'show' ;
        }

        if (field.affectingHideFieldRules.length) {

            var untriggeredHideFieldRule = _.find(field.untriggeredHideFieldRule, function(rule) {
                return !rule.fired ;
            }) ;

            if (untriggeredHideFieldRule)
                return 'show' ;
            else
                return 'hide' ;
        }
    }


    function getFieldResponse(field, state) {

        switch (field.superType) {

            case 'question':

                if (!state.response.answers)
                    response.answers = {} ;

                if (!state.response.answers[field.id])
                    state.response.answers[field.id] = {} ;

                return state.response.answers[field.id] ;

            case 'summary':

                if (!state.response.summaries)
                    state.response.summaries = {} ;

                if (!state.response.summaries[field.id])
                    state.response.summaries[field.id] = {} ;

                return state.response.summaries[field.id] ;
            default:
                return ;
        }
    }

    function setFieldResponse(field, fieldResponse, state) {


        switch (field.superType) {

            case 'question':

                if (!state.response.answers)
                    response.answers = {} ;

                state.response.answers[field.id] = fieldResponse ;
                return ;

            case 'summary':

                if (!state.response.summaries)
                    state.response.summaries = {} ;

                state.response.summaries[field.id] = fieldResponse ;
                return ;

            default:
                return ;
        }
    }



    function handleScoreSourcesChanged(scoreField, state) {

        var score = 0 ;

        _.each(scoreField.sources, function(source) {

            var sourceField = state.schema.fieldsById[source.id] ;
            var sourceResponse = getFieldResponse(sourceField, state) ;

            if (sourceResponse && sourceResponse.score)
                score = score + sourceResponse.score ;

        }, this) ;

        var scoreResponse = getFieldResponse(scoreField, state) ;

        if (scoreResponse.score != score) {

            var summary = ScoreCalculator.getScoreSummary(score, scoreField) ;

            setFieldResponse(scoreField, summary, state) ;

            state.handleFieldChanged(scoreField.id, true);
        }
    }


    function allRequiredQuestionsAnswered(state) {

        //if no current page, then we are already at end of survey
        if (!state.schema.page)
            return false ;

        //otherwise, look for missing field on page
        var missingField = _.find(state.schema.page.relevantFields, function(field) {

            if (field.superType != 'question')
                return false;

            if (field.hidden)
                return false ;

            if (field.optional)
                return false ;

            var answered = AnswerStates.isAnswered(field, state.response.answers[field.id]) ;

            console.log(" - " + field.id + " " + answered) ;

            return !answered ;
        }) ;

        return missingField == null ;
    }










function SurveyState(schema, response, config) {

    this.schema = Initializer.cloneAndAugmentSchema(schema) ;
    this.response = Initializer.initializeResponse(response, this.schema) ;

    console.log(config) ;

    if (!config) {
        this.config = defaultConfig ;
    } else {
        this.config = _.clone(config);

        _.each(defaultConfig, function (value, key) {

            console.log(" - " + key + ":" + value) ;

            if (this.config[key] === null || this.config[key] === undefined)
                this.config[key] = value;
        }, this);
    }

    console.log(this.config) ;

    this.handleResponseUpdated(this.response) ;
}

SurveyState.prototype.handleResponseUpdated = function(response) {

    Logger.debug("Response changed!", logpath) ;

    //make sure any missing stuff is injected
    this.response = Initializer.initializeResponse(response, this.schema) ;

    //check state of triggers for all fields
    _.each(this.schema.fields, function(field) {

        this.handleFieldChanged(field.id, true) ;

    }, this) ;

    //check visibility of all fields
    _.each(this.schema.fields, function(field) {
        updateVisibility(field) ;
    }, this) ;

    handleCurrentPageChanged(this.response, this.schema) ;
}

SurveyState.prototype.handleContinue = function() {

    console.log("attempting to continue") ;
    console.log(this.response.pageIndex + " vs " + this.schema.pages.length) ;

    if (this.response.pageIndex >= this.schema.pages.length-1) {
        this.response.completedAt = new Date().toISOString() ;
        return ;
    }

    var currPage = this.schema.pages[this.response.pageIndex] ;

    var hasMissingFields = false ;
    _.each(currPage.relevantFields, function(field) {

        if (!field.visible)
            return ;

        if (field.superType != "question")
            return ;

        if (field.answered)
            return ;

        if (field.hidden)
            return ;

        if (field.optional)
            return ;

        Logger.debug("Required field " + field.id + " on page " + currPage.index + " is not answered", "ask.logic.state.pageRules") ;
        //console.log(field) ;

        field.missing = true ;
        hasMissingFields = true ;
    }) ;

    if (hasMissingFields)
        return ;

    var nextUnskippedPage ;

    for (var i = this.response.pageIndex + 1 ; i<this.schema.pages.length ; i++) {

        var p = this.schema.pages[i] ;

        var skipState = _.find(p.pageRuleStates, function (state) {
            return state == 'skip' ;
        }) ;

        if (!skipState) {
            nextUnskippedPage = p ;
            break ;
        }
    }

    console.log(nextUnskippedPage) ;

    if (nextUnskippedPage) {
        this.response.pageIndex = nextUnskippedPage.index ;
    } else {
        this.response.pageIndex = this.schema.pages.length ;
        this.response.completedAt = new Date().toISOString() ;
    }

    handleCurrentPageChanged(this.response, this.schema) ;

}

SurveyState.prototype.handleBack = function() {

    this.response.completedAt = undefined ;

    if (this.response.pageIndex == 0) {
        return ;
    }

    var prevUnskippedPage ;

    for (var i = this.response.pageIndex - 1 ; i>=0 ; i--) {

        var p = this.schema.pages[i] ;

        var skipState = _.find(p.pageRuleStates, function (state) {
            return state == 'skip' ;
        }) ;

        if (!skipState) {
            prevUnskippedPage = p ;
            break ;
        }
    }

    if (prevUnskippedPage) {
        this.response.pageIndex = prevUnskippedPage.index ;
    } else {
        //this should never happen, but if it does then just jump to first page
        this.response.pageIndex = 0 ;
    }

    handleCurrentPageChanged(this.response, this.schema) ;
}






SurveyState.prototype.handleFieldChanged = function(fieldId, suppressAutoAdvance) {

    Logger.debug(fieldId + " changed", logpath) ;

    var field = this.schema.fieldsById[fieldId] ;

    if (!field) {
        Logger.warn("Could not find field " + fieldId, logpath) ;
        return ;
    }

    var fieldResponse = getFieldResponse(field, this) ;

    if (field.superType == "question") {
        field.answered = AnswerStates.isAnswered(field, fieldResponse);

        if (field.answered) {
            field.missing = false;
            fieldResponse.score = ScoreCalculator.getScoreForQuestion(field, fieldResponse);
        }
    }

    _.each(field.affectedFieldRules, function(fieldRule) {

        Logger.debug("  checking fieldRule: " + fieldRule.index, "ask.logic.state.fieldRules");

        var fired = TriggerStates.isFired(fieldRule.trigger, this) ;

        if (fired != fieldRule.fired) {
            fieldRule.fired = fired ;
            this.handleFieldRuleStateChanged(fieldRule) ;
        }

    }, this) ;

    _.each(field.affectedPageRules, function(pageRule) {

        Logger.debug("  checking pageRule: " + pageRule.index, "ask.logic.state.pageRules");

        var fired = TriggerStates.isFired(pageRule.trigger, this) ;

        //console.log("page rule " + 1 + " fired:" + fired) ;

        if (fired != pageRule.fired) {
            pageRule.fired = fired ;
            this.handlePageRuleStateChanged(pageRule) ;
        }

    }, this) ;


    _.each(field.choiceDestinations, function(choiceDestinationId){
        handleChoiceSourcesChanged(choiceDestinationId, this.schema.fieldsById, this.response) ;
    }, this) ;

    _.each(field.affectedScoreFields, function(scoreFieldId) {
        var scoreField = this.schema.fieldsById[scoreFieldId] ;

        handleScoreSourcesChanged(scoreField, this) ;
    }, this) ;

    var currPage = this.schema.pages[this.response.pageIndex] ;

    if (this.config.autoAdvance && currPage.canAutoadvance && !suppressAutoAdvance) {

        var readyToAdvance = allRequiredQuestionsAnswered(this) ;

         if (readyToAdvance) {
            this.handleContinue();
        }
    }

}







SurveyState.prototype.handleFieldRuleStateChanged = function(rule) {

    Logger.debug("field rule state changed to " + rule.fired, "ask.logic.state.rules") ;
    Logger.debug(rule.affectedFieldIds, "ask.logic.state.rules") ;

    _.each(rule.affectedFieldIds, function(fieldId) {

        var field = this.schema.fieldsById[fieldId] ;

        var fieldRuleAction = getFieldRuleAction(field) ;
        Logger.debug("- " + fieldId + " action is " + fieldRuleAction, 'ask.logic.state.rules') ;

        if (fieldRuleAction == field.fieldRuleAction)
            return ;

        field.fieldRuleAction = fieldRuleAction ;

        //whenever a question gets hidden, recursively clear out answers to it
        if (field.fieldRuleAction == "hide" && field.superType == "question") {

            if (AnswerStates.isAnswered(field, getFieldResponse(field, this))) {

                Logger.debug("Recursively clearing answer to " + field.id, "ask.logic.state") ;

                setFieldResponse(field, {}, this) ;
                this.handleFieldChanged(field.id, true) ;
            }
        }

        updateVisibility(field) ;

    }, this) ;

}



SurveyState.prototype.handlePageRuleStateChanged = function(rule) {

    Logger.debug("page rule state changed to " + rule.fired, "ask.logic.state.pageRules") ;
    Logger.debug(rule, "ask.logic.state.pageRules") ;

    var questionIds = TriggerStates.getQuestionIds(rule.trigger) ;

    Logger.debug(questionIds, "ask.logic.state.pageRules") ;
    //identify earliest effected page, which is the next page after the last trigger
    var earliestEffectedPageIndex ;
    _.each(questionIds, function(questionId) {

        var question = this.schema.fieldsById[questionId] ;

        Logger.debug("- " + questionId + " " + question.pageIndex, "ask.logic.state.pageRules") ;

        if (earliestEffectedPageIndex == null || earliestEffectedPageIndex < question.pageIndex)
            earliestEffectedPageIndex = question.pageIndex ;

    }, this) ;
    earliestEffectedPageIndex ++ ;

    Logger.debug("earliestEffectedPageIndex: " + earliestEffectedPageIndex, "ask.logic.state.pageRules") ;

    _.each(rule.actions, function(action) {

        switch (action.action) {

            case 'skip' :

                var pageToSkip = this.schema.pagesById[action.pageId] ;

                if (rule.fired) {
                    //skip all pages between current one and action.page
                    pageToSkip.pageRuleStates[rule.index] = 'skip' ;
                } else {
                    //cancel any intention to skip this page due to this rule
                    pageToSkip.pageRuleStates[rule.index] = undefined ;
                }

                break ;

            case 'skipTo' :

                var pageToSkipTo = this.schema.pagesById[action.pageId] ;

                for (var i=earliestEffectedPageIndex ; i<pageToSkipTo.index ; i++) {

                    if (rule.fired) {
                        //skip all pages between current one and action.page
                        this.schema.pages[i].pageRuleStates[rule.index] = 'skip' ;
                    } else {
                        //cancel any intention to skip this page due to this rule
                        this.schema.pages[i].pageRuleStates[rule.index] = undefined ;
                    }
                }

                break ;

            case 'skipToEnd' :
                //skip all pages after current one

                for (var i=earliestEffectedPageIndex ; i<this.schema.pages.length ; i++) {

                    if (rule.fired) {
                        //skip all pages between current one and action.page
                        this.schema.pages[i].pageRuleStates[rule.index] = 'skip' ;
                    } else {
                        //cancel any intention to skip this page due to this rule
                        this.schema.pages[i].pageRuleStates[rule.index] = undefined ;
                    }
                }

                break ;
        }
    }, this) ;

}

return {

    init: function(schema, response, config) {
        return new SurveyState(schema, response, config) ;
    }

}


}]) ;