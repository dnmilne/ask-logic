var AskLogic = angular.module('ask-logic', [])



.factory('Logger', ['$log', function($log) {

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


}]) 


.factory('PlaceholderResolver', ['Logger', 'AnswerStates', function(Logger, AnswerStates) {

	

	return {

		resolve: function(text, state, response) {


			var placeholderRegex = /\[\[([^\]]+)\]\]/g;

			var resolvedText = "" ;

			var match = placeholderRegex.exec(text);
			var index = 0 ;
			while (match != null) {

				Logger.debug("found " + match[0] + "at " + match.index, "ask.logic.placeholder") ;

			    resolvedText = resolvedText + text.substr(index,match.index-index) ;

			    var questionId = match[1] ;
			    Logger.debug("Resolving placeholder [[" + questionId + "]]", "ask.logic.placeholder") ;

			    var question = state.fieldsById[questionId] ;

			    if (!question) {
			    	Logger.warn("Could not find question for placeholder " + questionId, "ask.logic.placeholder") ;
			    	continue ;
			    }

            	var answer = response.answers[questionId] ;


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




}])


.factory('Normalizer', function() {

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

})


.factory('AnswerStates', ['Logger', function(Logger) {


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




.factory('TriggerStates', ['Logger','Normalizer', function(Logger, Normalizer) {

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
	
		var field = state.fieldsById[trigger.questionId] ;

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
}]) 





.factory('ChoiceGatherer', ['Logger','Normalizer', function(Logger, Normalizer) {


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
}]) 


/* 
	This factory allows you to create one or more (so non-singleton) SurveyState objects

	Each SurveyState obj is instantiated with a schema and a response object, and provides methods to track what happens to the survey state 
	(e.g current page, visible fields, etc). 
*/
.factory('SurveyStates', ['Logger','TriggerStates', 'AnswerStates', 'ChoiceGatherer', function(Logger, TriggerStates, AnswerStates, ChoiceGatherer) {



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

		Logger.debug("fieldIdsByTag", "ask.logic.state.init") ;
		Logger.debug(fieldIdsByTag, "ask.logic.state.init") ; 

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

	function isQuestion(field) {

		switch (field.type) {
			case 'instruction':
			case 'pageBreak':
			case 'sectionBreak':
			case 'video':
				return  false ;
			default:
				return  true ;
		}
	}

	function backlinkChoiceSources(field, surveyState) {

		if (!field.choiceSources) 
			return ;

		for (var i = 0 ; i < field.choiceSources.length ; i++) {

			var choiceSource = surveyState.fieldsById[field.choiceSources[i]] ;

			if (!choiceSource) {
				Logger.error("Could not identify choice source " + field.choiceSources[i], "ask.logic.state.init") ;
				return ;
			}

			if (!choiceSource.choiceDestinations) 
				choiceSource.choiceDestinations = [] ;
						
			if (!_.contains(choiceSource.choiceDestinations, field.id)) 
				choiceSource.choiceDestinations.push(field.id) ;
		}
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

		Logger.debug("affected field ids for rule " + fieldRule.index + " " + action, "ask.logic.state.init") ;
		Logger.debug(affectedFieldIds, 'ask.logic.state.init') ;

		return _.uniq(affectedFieldIds) ;
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

	function SurveyState(schema, response) {

		this.fieldIdsByTag = gatherFieldIdsByTag(schema) ;
		this.pageIdsByTag = gatherPageIdsByTag(schema) ;

		//clone all fields into array, attaching additional information, and make a map by id
		this.fields = [] ;
		this.fieldsById = {} ;

		//also identify and clone individual pages
		this.pages = [] ;
		this.pagesById = {} ;

		var currentPage ;

		_.each(schema.fields, function(f, fIndex) {
		
			var field = _.cloneDeep(f) ;

			if (field.type == "pageBreak") {

				currentPage = field ;
				currentPage.relevantFields = [] ;
				currentPage.pageRuleStates = {} ;
				currentPage.affectingRules = [] ;
				currentPage.index = this.pages.length ;

				this.pages.push(currentPage) ;
				this.pagesById[currentPage.id] = currentPage ;

			} else {

				if (!currentPage) {

					//we must have fields occurring before any page
					//need to create an unnamed page for them 
					currentPage = {
						relevantFields: [],
						pageRuleStates: {},
						index:0
					} ;

					this.pages.push(currentPage) ;
				}

				currentPage.relevantFields.push(field) ;
				field.pageIndex = currentPage.index ;

				field.isQuestion = isQuestion(field) ;
				backlinkChoiceSources(field, this) ;

				this.fields.push(field) ;
				this.fieldsById[field.id] = field ;

				if (field.isQuestion) {

					//will contain field and page rules whose trigger state
					//could be affected by answer to this question

					field.affectedFieldRules = [] ;
					field.affectedPageRules = [] ;
				}

				//will contain any field rules that might show or hide this field
				field.affectingShowFieldRules = [] ;
				field.affectingHideFieldRules = [] ;
			}
		}, this) ;

		Logger.debug("set up fields", "ask.logic.state.init") ;

		this.fieldRules = [] ;
		_.each(schema.fieldRules, function(fr, frIndex) {

			var fieldRule = _.cloneDeep(fr) ;
			fieldRule.index = frIndex ;

			//gather questions whose answers effect the trigger state of this rule
			//and tell them about it. 
			_.each(TriggerStates.getQuestionIds(fieldRule.trigger), function(questionId) {
				var field = this.fieldsById[questionId] ;
				field.affectedFieldRules.push(fieldRule) ;
			}, this) ;

			//gather fields that might be shown by this rule, and tell them about this rule.
			var fieldIdsToShow = gatherAffectedFieldIds(fieldRule, 'show', this.fieldIdsByTag) ;
			//Logger.debug("fields shown by " + frIndex, 'ask.logic.state.init') ;
			//Logger.debug(fieldIdsToShow, 'ask.logic.state.init') ;
			_.each(fieldIdsToShow, function(fieldId) {
				var field = this.fieldsById[fieldId] ;
				field.affectingShowFieldRules.push(fieldRule) ;
			}, this) ;

			//gather fields that might be hidden by this rule, and tell them about this rule.
			var fieldIdsToHide = gatherAffectedFieldIds(fieldRule, 'hide', this.fieldIdsByTag) ;
			_.each(fieldIdsToHide, function(fieldId) {
				var field = this.fieldsById[fieldId] ;
				field.affectingHideFieldRules.push(fieldRule) ;
			}, this) ;

			fieldRule.affectedFieldIds = _.uniq(_.union(fieldIdsToShow, fieldIdsToHide)) ;

			this.fieldRules.push(fieldRule) ;
		}, this) ;

		Logger.debug("set up field rules", "ask.logic.state.init") ;

		//clone all page rules into array, attaching additional information
		//also attach to each field a list of relevant field rules that might be effected by answers to the field
		this.pageRules = [] ;

		_.each(schema.pageRules, function(pr, prIndex) {
		
			var pageRule = _.cloneDeep(pr) ;
			pageRule.index = prIndex ;

			//gather questions whose answers effect the trigger state of this rule
			//and tell them about it. 
			_.each(TriggerStates.getQuestionIds(pageRule.trigger), function(questionId) {

				var field = this.fieldsById[questionId] ;

				field.affectedPageRules.push(pageRule) ;
			}, this) ;

			this.pageRules.push(pageRule) ;

		}, this) ;

		Logger.debug("set up page rules", "ask.logic.state.init") ;

		this.handleResponseUpdated(response) ;
	}

	SurveyState.prototype.handleResponseUpdated = function(response) {

		Logger.debug("Response changed!", "ask.logic.state") ;

		if (!response.answers)
			response.answers = {} ;

		if (!response.pageIndex)
			response.pageIndex = 0 ;

		if (response.completed == null) {
			if (response.pageIndex >= this.pages.length)
				response.completed = true ;
			else
				response.completed = false ;
		}

		//add placeholder answers for all questions
		_.each(this.fields, function (field) {

			if (!field.isQuestion)
				return ;

			if (!response.answers[field.id])
				response.answers[field.id] = {} ;
		}) ;

		this.response = response ;

		Logger.debug(this.response.answers, "ask.logic.state") ;

		//check state of triggers for all answers
		_.each(this.response.answers, function(answer, answerIndex) {
			Logger.debug("checking answer " + answerIndex, "ask.logic.state") ;
			this.handleAnswerChanged(answerIndex) ;
		}, this) ;

		//check visibility of all fields
		_.each(this.fields, function(field) {
			this.updateVisibility(field) ;
		}, this) ;


		this.handleCurrentPageChanged() ;
	}

	SurveyState.prototype.handleContinue = function() {

		//console.log("attempting to continue") ;

		if (this.response.pageIndex >= this.pages.length) {
			this.response.completed = true ;
			return ;
		}

		var currPage = this.pages[this.response.pageIndex] ;

		var hasMissingFields = false ;
		_.each(currPage.relevantFields, function(field) {

			if (!field.visible)
				return ;

			if (!field.isQuestion)
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

		for (var i = this.response.pageIndex + 1 ; i<this.pages.length ; i++) {

			var p = this.pages[i] ;

			var skipState = _.find(p.pageRuleStates, function (state) {
				return state == 'skip' ;
			}) ;

			if (!skipState) {
				nextUnskippedPage = p ;
				break ;
			}
		}

		if (nextUnskippedPage) {
			this.response.pageIndex = nextUnskippedPage.index ;
		} else {
			this.response.pageIndex = this.pages.length ;
			this.response.completed = true ;
		}

		this.handleCurrentPageChanged() ;

	}

	SurveyState.prototype.handleBack = function() {

		this.response.completed = false ;

		if (this.response.pageIndex == 0) {
			return ;
		}

		var prevUnskippedPage ;

		for (var i = this.response.pageIndex - 1 ; i>=0 ; i--) {

			var p = this.pages[i] ;

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

		this.handleCurrentPageChanged() ;
	}

	SurveyState.prototype.handleCurrentPageChanged = function() {

		if (this.response.pageIndex == null) {
			if (this.response.completed)
				this.response.pageIndex = this.pages.length ;
			else
				this.response.pageIndex = 0 ;
		}

		this.page = this.pages[this.response.pageIndex] ;

		_.each(this.pages, function(page, pageIndex) {
			page.current = (pageIndex == this.response.pageIndex) ;
		}, this) ;

	}

	SurveyState.prototype.updateVisibility = function(field) {

		var visible = true;

		if (field.hidden) 
			visible = false ;

		if (field.fieldRuleAction == 'hide')
			visible = false ;

		Logger.debug("field " + field.id + " v=" + field.visible + " a=" + field.fieldRuleAction, "ask.logic.state") ;

		field.visible = visible ;
	}


	SurveyState.prototype.handleAnswerChanged = function(fieldId) {

		Logger.debug("answer changed for " + fieldId, "ask.logic.state") ;

		var field = this.fieldsById[fieldId] ;
		var answer = this.response.answers[fieldId] ;

		
		if (field == undefined) {
			Logger.warn("Could not find field " + fieldId, "ask.logic.state") ;
			return ;
		}

		Logger.debug(field, "ask.logic.state") ;

		field.answered = AnswerStates.isAnswered(field, answer) ;

		if (field.answered)
			field.missing = false ;

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

			if (fired != pageRule.fired) {
				pageRule.fired = fired ;
				this.handlePageRuleStateChanged(pageRule) ;
			}

		}, this) ;


		_.each(field.choiceDestinations, function(choiceDestinationId){
			this.handleChoiceSourcesChanged(choiceDestinationId) ;
		}, this) ;
	}


	SurveyState.prototype.handleChoiceSourcesChanged = function(fieldId) {

		var field = this.fieldsById[fieldId] ;

		var choiceSources = [] ;

		_.each(field.choiceSources, function(choiceSourceId) {

			var choiceSource = this.fieldsById[choiceSourceId] ;

			if (!choiceSource) {
				Logger.error("Could not identify choice source " + choiceSourceId, "ask.logic.state") ;
				return ;
			}

			this.choiceSources.push(choiceSource) ;

		}, {fieldsById : this.fieldsById, choiceSources:choiceSources}) ;

		field.autochoices = ChoiceGatherer.gatherChoices(choiceSources, this.response) ;
	}




	SurveyState.prototype.handleFieldRuleStateChanged = function(rule) {

		Logger.debug("field rule state changed to " + rule.fired, "ask.logic.state.rules") ;
		Logger.debug(rule.affectedFieldIds, "ask.logic.state.rules") ;

		_.each(rule.affectedFieldIds, function(fieldId) {

			var field = this.fieldsById[fieldId] ;

			var fieldRuleAction = getFieldRuleAction(field) ;
			Logger.debug("- " + fieldId + " action is " + fieldRuleAction, 'ask.logic.state.rules') ;

			if (fieldRuleAction == field.fieldRuleAction)
				return ;

			field.fieldRuleAction = fieldRuleAction ;

			//whenever a question gets hidden, recursively clear out answers to it
			if (field.fieldRuleAction == "hide" && field.isQuestion) {

				if (AnswerStates.isAnswered(field, this.response.answers[field.id])) {

					Logger.debug("Recursively clearing answer to " + field.id, "ask.logic.state") ;
					
					this.response.answers[field.id] = {} ;
					this.handleAnswerChanged(field.id) ;
				}
			}

			this.updateVisibility(field) ;

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

			var question = this.fieldsById[questionId] ;

			Logger.debug("- " + questionId + " " + question.pageIndex, "ask.logic.state.pageRules") ;

			if (earliestEffectedPageIndex == null || earliestEffectedPageIndex < question.pageIndex)
				earliestEffectedPageIndex = question.pageIndex ;

		}, this) ;
		earliestEffectedPageIndex ++ ;

		Logger.debug("earliestEffectedPageIndex: " + earliestEffectedPageIndex, "ask.logic.state.pageRules") ;

		_.each(rule.actions, function(action) {

			switch (action.action) {

				case 'skip' :

					var pageToSkip = this.pagesById[action.pageId] ;

					if (rule.fired) {
						//skip all pages between current one and action.page
						pageToSkip.pageRuleStates[rule.index] = 'skip' ;
					} else {
						//cancel any intention to skip this page due to this rule
						pageToSkip.pageRuleStates[rule.index] = undefined ;
					}

					break ;

				case 'skipTo' :

					var pageToSkipTo = this.pagesById[action.pageId] ;

					for (var i=earliestEffectedPageIndex ; i<pageToSkipTo.index ; i++) {

						if (rule.fired) {
							//skip all pages between current one and action.page
							this.pages[i].pageRuleStates[rule.index] = 'skip' ;
						} else {
							//cancel any intention to skip this page due to this rule
							this.pages[i].pageRuleStates[rule.index] = undefined ;
						}
					}

					break ;
					
				case 'skipToEnd' :
					//skip all pages after current one 

					for (var i=earliestEffectedPageIndex ; i<this.pages.length ; i++) {

						if (rule.fired) {
							//skip all pages between current one and action.page
							this.pages[i].pageRuleStates[rule.index] = 'skip' ;
						} else {
							//cancel any intention to skip this page due to this rule
							this.pages[i].pageRuleStates[rule.index] = undefined ;
						}
					}

					break ;
			}
		}, this) ;

	}

	return {

		init: function(schema, response) {
			return new SurveyState(schema, response) ;
		}

	}


}]) ;