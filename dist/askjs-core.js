var askjs_core = angular.module('askjs.core', []);

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
/*
    Clones a survey schema and injects additional information.
*/


askjs_core.factory('Initializer', ['Logger','TriggerStates', function(Logger, TriggerStates) {

    var logpath = "ask.core.init" ;

    function gatherFieldIdsByTag(schema) {

        var fieldIdsByTag = {} ;

        _.each(schema.fields, function(field) {

            if (!field.tags || !field.tags.length)
                return ;

            if (field.type == "pageBreak")
                return ;

            _.each(field.tags, function(tag) {

                if (!fieldIdsByTag[tag])
                    fieldIdsByTag[tag] = [] ;

                fieldIdsByTag[tag].push(field.id) ;
            }, this) ;

        }, this) ;

        Logger.debug("fieldIds: ", logpath) ;
        Logger.debug(fieldIdsByTag, logpath) ;

        return fieldIdsByTag ;
    }

    function gatherPageIdsByTag(schema) {

        var pageIdsByTag = {} ;

        _.each(schema.fields, function(field) {

            if (!field.tags || !field.tags.length)
                return ;

            if (field.type != "pageBreak")
                return ;

            _.each(field.tags, function(tag) {

                if (!pageIdsByTag[tag])
                    pageIdsByTag[tag] = [] ;

                pageIdsByTag[tag].push(field.id) ;
            }, this) ;

        }, this) ;

        Logger.debug("pageIdsByTag", "ask.logic.state.init") ;
        Logger.debug(pageIdsByTag, "ask.logic.state.init") ;

        return pageIdsByTag ;
    }

    function getSupertype(field) {

        switch (field.type) {
            case 'instruction':
            case 'static':
            case 'video':
                return "media" ;
            case 'pageBreak':
            case 'sectionBreak':
                return "structure"
            case 'score':
                return "summary" ;
            default:
                return "question" ;
        }
    }


    function backlinkChoiceSources(field, fieldsById) {

        if (!field.choiceSources)
            return ;

        _.each(field.choiceSources, function(choiceSourceId) {

            var choiceSource = fieldsById[choiceSourceId] ;

            if (!choiceSource) {
                Logger.error("Could not identify choice source " + choiceSourceId, logpath) ;
                return ;
            }

            if (!choiceSource.choiceDestinations)
                choiceSource.choiceDestinations = [] ;

            if (!_.contains(choiceSource.choiceDestinations, field.id))
                choiceSource.choiceDestinations.push(field.id) ;
        }, this) ;
    }

    function backlinkScoreSources(field, fieldsById) {

        if (field.type != "score")
            return ;

        if (!field.sources)
            return ;

        _.each(field.sources, function(source) {

            var sourceField = fieldsById[source.id] ;

            if (!sourceField) {
                Logger.warn("could not identify score source " + source.id, logpath) ;
                return ;
            }

            if (!sourceField.affectedScoreFields)
                sourceField.affectedScoreFields = [] ;

            sourceField.affectedScoreFields.push(field.id) ;

        }, this) ;
    }

    function initializeSinglechoice(field) {

        //set default choice weights
        _.each(field.choices, function(choice) {
            if (choice.weight == null)
                choice.weight = 1;
        }) ;

        return field ;
    }

    function initializeMultichoice(field) {

        //set default choice weights
        _.each(field.choices, function(choice) {
            if (choice.weight == null)
                choice.weight = 1;
        }) ;

        return field ;
    }

    function initializeRating(field) {

        //set default weights
        if (field.weights == null)
            field.weights = [0,field.length-1] ;

        //expand weights so there is one per rating option.
        if (field.weights.length == 2 && field.length > 2) {

            var weights = [] ;

            for (var i=0 ; i<field.length ; i++) {
                weights.push(field.weights[0] + ((field.weights[1]-field.weights[0]) * (i/(field.length-1)))) ;
            }

            field.weights = weights ;
        }

        return field ;
    }

    function initializeField(field, fieldsById) {

        field.superType = getSupertype(field) ;

        if (field.superType == "question" || field.superType == "summary") {
            //will contain field and page rules whose trigger state
            //could be affected by answer to this question

            field.affectedFieldRules = [] ;
            field.affectedPageRules = [] ;
        }

        //will contain any field rules that might show or hide this field
        field.affectingShowFieldRules = [] ;
        field.affectingHideFieldRules = [] ;

        backlinkChoiceSources(field, fieldsById) ;
        backlinkScoreSources(field, fieldsById) ;

        switch (field.type) {

            case "singlechoice":
                field = initializeSinglechoice(field) ;
                break ;
            case "multichoice":
                field = initializeMultichoice(field) ;
                break ;
            case "rating":
                field = initializeRating(field) ;
                break ;
        }

        return field;
    }

    function initializePage(page, index) {

        page.relevantFields = [] ;
        page.pageRuleStates = {} ;
        page.affectingRules = [] ;
        page.index = index ;

        return page ;
    }

    function backlinkFieldRule(rule, schema) {

        //gather questions whose answers effect the trigger state of this rule
        //and tell them about it.
        _.each(TriggerStates.getQuestionIds(rule.trigger), function(questionId) {
            var field = schema.fieldsById[questionId] ;
            field.affectedFieldRules.push(rule) ;
        }, this) ;

        //gather fields that might be shown by this rule, and tell them about this rule.
        var fieldIdsToShow = gatherAffectedFieldIds(rule, 'show', schema.fieldIdsByTag) ;
        //Logger.debug("fields shown by " + frIndex, 'ask.logic.state.init') ;
        //Logger.debug(fieldIdsToShow, 'ask.logic.state.init') ;
        _.each(fieldIdsToShow, function(fieldId) {
            var field = schema.fieldsById[fieldId] ;
            field.affectingShowFieldRules.push(rule) ;
        }, this) ;

        //gather fields that might be hidden by this rule, and tell them about this rule.
        var fieldIdsToHide = gatherAffectedFieldIds(rule, 'hide', schema.fieldIdsByTag) ;
        _.each(fieldIdsToHide, function(fieldId) {
            var field = schema.fieldsById[fieldId] ;
            field.affectingHideFieldRules.push(rule) ;
        }, this) ;

        return _.uniq(_.union(fieldIdsToShow, fieldIdsToHide)) ;
    }

    function backlinkPageRule(rule, fieldsById) {

        //gather questions whose answers effect the trigger state of this rule
        //and tell them about it.

        _.each(TriggerStates.getQuestionIds(rule.trigger), function(questionId) {

            var field = fieldsById[questionId] ;

            field.affectedPageRules.push(rule) ;
        }, this) ;
    }

    function gatherAffectedFieldIds(fieldRule, action, fieldIdsByTag) {

        var affectedFieldIds = [] ;

        _.each(fieldRule.actions, function(a) {

            if (a.action != action)
                return ;

            if (a.fieldId != null)
                affectedFieldIds.push(a.fieldId) ;

            if (!a.tag)
                return ;

            if (!fieldIdsByTag[a.tag])
                return ;

            _.each(fieldIdsByTag[a.tag], function(fieldId) {
                affectedFieldIds.push(fieldId) ;
            }, this) ;

        }, this) ;

        Logger.debug("affected field ids for rule " + fieldRule.index + " " + action, logpath) ;
        Logger.debug(affectedFieldIds, logpath) ;

        return _.uniq(affectedFieldIds) ;
    }

    function canAutoAdvance(page) {

        //page can autoadvance if it has one and only one visible question, and that question is a singlechoice or rating

        var totalQuestions = 0 ;
        var validQuestions = 0 ;

        _.each(page.relevantFields, function(field) {

            if (field.superType != 'question')
                return ;

            if (field.hidden)
                return ;

            totalQuestions ++ ;

            switch (field.type) {
                case 'singlechoice':
                case 'rating':
                    validQuestions++ ;
                    break ;
            } ;

        }, this) ;

        if (validQuestions == 0 || validQuestions > 1)
            return false ;

        if (totalQuestions > 1)
            return false ;

        return true ;
    }





    return {

        cloneAndAugmentSchema: function(s) {

            var schema = {} ;

            schema.id = s.id ;
            schema.readableId = s.readableId ;

            schema.fieldIdsByTag = gatherFieldIdsByTag(s) ;

            schema.pageIdsByTag = gatherPageIdsByTag(s) ;

            //clone all fields into array, attaching additional information, and make a map by id
            schema.fields = [] ;
            schema.fieldsById = {} ;

            //also identify and clone individual pages
            schema.pages = [] ;
            schema.pagesById = {} ;

            var currentPage ;

            _.each(s.fields, function(f, fIndex) {

                var field = _.cloneDeep(f) ;

                if (field.type == "pageBreak") {

                    currentPage = initializePage(field, schema.pages.length) ;
                    schema.pages.push(currentPage) ;
                    schema.pagesById[currentPage.id] = currentPage ;

                } else {

                    field = initializeField(field, schema.fieldsById) ;

                    if (!currentPage) {
                        //we must have fields occurring before any page
                        //need to create an unnamed page for them
                        currentPage = initializePage({},0) ;
                        schema.pages.push(currentPage) ;
                    }

                    currentPage.relevantFields.push(field) ;
                    field.pageIndex = currentPage.index ;



                    schema.fields.push(field) ;
                    schema.fieldsById[field.id] = field ;
                }
            }, this) ;

            Logger.debug("fields initialized", logpath) ;


            _.each(schema.pages, function(page) {
                page.canAutoadvance = canAutoAdvance(page) ;
            }) ;


            schema.fieldRules = [] ;
            _.each(s.fieldRules, function(fr, frIndex) {

                var fieldRule = _.cloneDeep(fr) ;
                fieldRule.index = frIndex ;

                fieldRule.affectedFieldIds = backlinkFieldRule(fieldRule, schema) ;

                schema.fieldRules.push(fieldRule) ;

            }, this) ;

            Logger.debug("field rules initialized", logpath) ;


            //clone all page rules into array, attaching additional information
            //also attach to each field a list of relevant field rules that might be effected by answers to the field
            schema.pageRules = [] ;

            _.each(s.pageRules, function(pr, prIndex) {

                var pageRule = _.cloneDeep(pr) ;
                pageRule.index = prIndex ;

                backlinkPageRule(pageRule, schema.fieldsById) ;

                schema.pageRules.push(pageRule) ;

            }, this) ;

            Logger.debug("set up page rules", "ask.logic.state.init") ;

            return schema ;
        },

        initializeResponse : function (response, schema) {

            if (!response)
                response = {} ;

            if (!response.surveyId)
                response.surveyId = schema.id ;

            if (!response.answers)
                response.answers = {} ;

            if (!response.summaries)
                response.summaries = {} ;

            if (!response.pageIndex)
                response.pageIndex = 0 ;

            if (!response.completedAt) {
                if (response.pageIndex >= schema.pages.length)
                    response.completedAt = new Date().toISOString();
                else
                    response.completedAt = undefined ;
            }

            if (!response.startedAt) {
                response.startedAt = new Date().toISOString();
            }


            //add placeholders for all answers and summaries
            _.each(schema.fields, function (field) {

                switch (field.superType) {
                    case 'question':
                        if (!response.answers[field.id])
                            response.answers[field.id] = {} ;
                        break ;
                    case 'summary':
                        if (!response.summaries[field.id])
                            response.summaries[field.id] = {} ;
                        break ;
                }
            }) ;


            return response ;
        }



    }



}]) ;
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
/*
    functions for calculating scores
 */


askjs_core.factory('ScoreCalculator', ['Logger','AnswerStates', 'Normalizer', function(Logger, AnswerStates, Normalizer) {

    function getForSinglechoice(field, answer) {

        var choice = _.find(field.choices, function(choice) {
            return Normalizer.normalize(choice.name) == Normalizer.normalize(answer.choice) ;
        }) ;

        if (!choice) {
            Logger.warn("Could not find choice " + field.choice) ;
            return undefined ;
        }

        return choice.weight ;
    }

    function getRangeForSinglechoice(field) {

        var range = [null,null] ;

        if (field.optional) {
            range[0] = 0;
            range[1] = 0;
        }

        _.each(field.choices, function(choice) {
            if (range[0] == null || choice.weight < range[0])
                range[0] = choice.weight ;

            if (range[1] == null || choice.weight > range[1])
                range[1] = choice.weight ;

        }, this) ;

        return range ;
    }

    function getForMultichoice(field, answer) {

        var answerChoices = Normalizer.normalizeAll(answer.choices) ;

        var weight = 0 ;

        _.each(field.choices, function(choice) {

            if (_.contains(answerChoices, Normalizer.normalize(choice.name))){
                weight = weight + choice.weight ;
            }

        }, this) ;

        return weight ;
    }

    function getRangeForMultichoice(field, answer) {

        var range = [null,null] ;

        if (field.optional) {
            range[0] = 0;
            range[1] = 0;
        }

        _.each(field.choices, function(choice) {

            if (choice.weight >= 0) {

                if (range[0] == null || choice.weight < range[0])
                    range[0] = choice.weight;

                if (range[1] == null)
                    range[1] = choice.weight ;
                else
                    range[1] = range[1] + choice.weight ;

            } else {

                if (range[0] == null)
                    range[0] = choice.weight;
                else
                    range[0] = range[0] + choice.weight ;

                if (range[1] == null || choice.weight > range[1])
                    range[1] = choice.weight;
            }

        }, this) ;

        return range ;
    }

    function getForRating(field, answer) {
        return field.weights[answer.rating -1] ;
    }

    function getRangeForRating(field) {

        var range = [null,null] ;

        if (field.optional) {
            range[0] = 0;
            range[1] = 0;
        }

        _.each(field.weights, function(weight) {

            if (range[0] == null || weight < range[0])
                range[0] = weight ;

            if (range[1] == null || weight > range[1])
                range[1] = weight ;

        }) ;
    }

    function getRangeForScore(field, survey) {


        //motherRelation only shown if mother:yes
        //so, score for mother:!yes cannot be combined with score for motherRelation:any
        //so, score is widest of range[mother:no] and range[mother:!yes + motherRelation:any]

        //for every field rule that effects visibility of a source field,


        //


        //then try every purmutation of rules

        var relevantFieldRuleIndexes = [] ;

        _.each(field.sources, function(source){

            var sourceField = survey.fieldsById[source.id];

            _.each(sourceField.affectingShowFieldRules, function(rule) {
                relevantFieldRuleIndexes.push(rule.index) ;
            }, this) ;

            _.each(sourceField.affectingHideFieldRules, function(rule) {
                relevantFieldRuleIndexes.push(rule.index) ;
            }, this) ;

        }, this) ;

        relevantFieldRuleIndexes = _.uniq(relevantFieldRuleIndexes) ;
        console.log(field.id + " is effected by rules [" + relevantFieldRuleIndexes.join(",") + "]") ;


        //generate all possible permutations for whether these rules are fired or not.







    }

    function getNormalizedScore(score, field) {

        var normScore = score ;

        if (normScore < field.range[0])
            normScore = field.range[0] ;

        if (normScore > field.range[1])
            normScore = field.range[1] ;

        return normScore ;
    }


    function getPercent(score, field) {

        var normScore = getNormalizedScore(score, field) ;
        return ((normScore - field.range[0]) / (field.range[1] - field.range[0])) * 100 ;
    }

    function getCategoryNormalizedPercent(score, field) {

        if (!field.categories || !field.categories.length)
            return ;

        var normScore = getNormalizedScore(score, field) ;

        var categoryPercent = 1/ field.categories.length ;

        var categoryNormalizedPercent = 0 ;

        _.each(field.categories, function(category, index) {

            //console.log(score + " [" + )

            var catWidth = category.range[1] - category.range[0] ;

            if (index < (field.categories.length-1))
                catWidth = catWidth+1;

            if (score <= category.range[0]) {
                return;
            } else if (score > category.range[1]) {
                categoryNormalizedPercent = categoryNormalizedPercent + categoryPercent ;
            } else {
                var withinCategoryPercentage = (score - category.range[0]) / catWidth ;
                categoryNormalizedPercent = categoryNormalizedPercent + (withinCategoryPercentage * categoryPercent) ;
            }

        }, this) ;

        return categoryNormalizedPercent * 100 ;
    }

    function getCategory(score, field) {

        if (!field.categories || !field.categories.length)
            return ;

        var normScore = getNormalizedScore(score, field) ;

        var category = _.findLast(field.categories, function(cat) {

            return normScore >= cat.range[0] && normScore <= cat.range[1] ;

        }) ;

        if (category)
            return category.id ;
    }


    return {

        getScoreForQuestion: function(field, answer) {

            if (!AnswerStates.isAnswered(field, answer))
                return 0 ;

            switch (field.type) {

                case "singlechoice":
                    return getForSinglechoice(field, answer) ;
                case "multichoice":
                    return getForMultichoice(field, answer) ;
                case "rating":
                    return getForRating(field, answer) ;
            }

        },

        getScoreSummary: function(score, field) {

            var summary = {
                score: score,
                percent: getPercent(score, field),
                categoryNormalizedPercent:getCategoryNormalizedPercent(score, field)
            } ;

            var category = getCategory(score, field) ;

            if (category)
                summary.category = category ;

            return summary ;
        }

    }



}]) ;
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