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