var AskLogic = angular.module('ask-logic', [])




.factory('PlaceholderResolver', ['$log', 'AnswerStates', function($log, AnswerStates) {

	

	return {

		resolve: function(text, state, response) {


			var placeholderRegex = /\[\[([^\]]+)\]\]/g;

			var resolvedText = "" ;

			var match = placeholderRegex.exec(text);
			var index = 0 ;
			while (match != null) {

				$log.debug("found " + match[0] + "at " + match.index) ;

			    resolvedText = resolvedText + text.substr(index,match.index-index) ;

			    var questionId = match[1] ;
			    $log.debug("Resolving placeholder [[" + questionId + "]]") ;

			    var question = state.fieldsById[questionId] ;

			    if (!question) {
			    	$log.warn("Could not find question for placeholder " + questionId) ;
			    	continue ;
			    }

            	var answer = response.answers[questionId] ;


	            if (answer == null || !AnswerStates.isAnswered(question, answer)) {
	                resolvedText = resolvedText + "`unansweredQuestion:" + questionId + "`" ;
	                $log.warn("Could not find answer for placeholder " + questionId) ;
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


.factory('AnswerStates', ['$log', function($log) {


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

	function isScaleAnswered(answer) {

		if (!answer.index)
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

	function scaleAsString(answer) {
		if (!answer.index)
			return "unknown" ;

		return answer.index ;
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
				$log.warn("tried to check answer to nonexistent field") ;
				return false ;
			}

			if (!answer) {
				$log.warn("tried to check undefined answer to field " + field.id)
				return false ;
			}

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
				case 'scale' :
					answered = isScaleAnswered(answer) ;
					break ;
				case 'mood' :
					answered = isMoodAnswered(answer) ;
					break ;
				default :
					$log.warn("cannot check answer of unknown field type " + field.type + " (" + field.id + ")") ;

			}

			if (answered)
				$log.debug(field.id + " IS answered") ;
			else
				$log.debug(field.id + " IS NOT answered") ;

			return answered ;
		},

		answerAsString: function(field, answer) {

			if (!field) {
				$log.warn("tried to stringify answer to nonexistent field") ;
				return null ;
			}

			if (!answer) {
				$log.warn("tried to stringify undefined answer to field " + field.id)
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
				case 'scale' :
					return scaleAsString(answer) ;
				case 'mood' :
					return moodAsString(answer) ;
				default :
					$log.warn("cannot stringify answer of unknown field type " + field.type + " (" + field.id + ")") ;

			}

			return null ;

		}
	}
}])




.factory('TriggerStates', ['$log','Normalizer', function($log, Normalizer) {

	function getQuestionIdsForTrigger(trigger) {

		if (trigger.questionId != undefined && trigger.questionId != null) {
			return [trigger.questionId] ;
		}

		if (trigger.and != undefined || trigger.and != null) {
			
			var questionIds = [] ;

			_.each(trigger.and, function(subTrigger) {
				questionIds = _.union(questionIds, getQuestionIdsForTrigger(subTrigger)) ;
			}) ;

			return questionIds ;
		}
		
		if (trigger.or != undefined || trigger.or != null) {

			var questionIds = [] ;

			_.each(trigger.or, function(subTrigger) {
				questionIds = _.union(questionIds, getQuestionIdsForTrigger(subTrigger)) ;
			}) ;

			return questionIds ;
		}

		$log.warn("could not identify type of trigger") ;
		return [] ;

	}


	function isTriggerFired(trigger, state) {

		$log.debug(" - checking trigger " + JSON.stringify(trigger)) ;

		if (trigger.questionId != undefined || trigger.questionId != null) 
			return isQuestionTriggerFired(trigger, state) ;

		if (trigger.and != undefined || trigger.and != null)
			return isAndTriggerFired(trigger, state) ;

		if (trigger.or != undefined || trigger.or != null)
			return isOrTriggerFired(trigger, state) ;

		$log.warn("could not identify type of trigger") ;
		return false ;
	}

	function isAndTriggerFired(trigger, state) {

		//$log.debug(" - checking AND trigger " + JSON.stringify(trigger)) ;
		

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

		//$log.debug(" - checking OR trigger " + JSON.stringify(trigger)) ;
		
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

		$log.debug("checking fire state of " + JSON.stringify(trigger)) ;
	
		var field = state.fieldsById[trigger.questionId] ;

		if (field == null) {
			$log.warn("Could not identify field \"" + trigger.questionId + "\"") ;
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
			case 'scale' :
				fired = isScaleTriggerFired(trigger, answer) ;
				break ;
			case 'mood' : 
				fired = isMoodTriggerFired(trigger, answer) ;
				break ;
			default :
				$log.warn("could not identify fire state of trigger for field type " + field.type) ;
				break ;
		} 

		if (fired)
			$log.debug(" - fired") ;
		else
			$log.debug(" - not fired") ;

		return fired ;

	}

	function isSinglechoiceTriggerFired(trigger, answer) {

		$log.debug(" - checking single choice trigger " + JSON.stringify(trigger)) ;
		$log.debug(" - - against " + JSON.stringify(answer)) ;

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


	function isScaleTriggerFired(trigger, answer) {

		if (answer.index === undefined || answer.index === null)
			return false ;

		switch(trigger.condition) {

			case 'equal' : 
				return answer.index == trigger.index ;
			case 'greaterThan' :
				return answer.index > trigger.index ;
			case 'lessThan' :
				return answer.index < trigger.index ;

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


			//$log.debug("checking fire state of " + JSON.stringify(trigger)) ;
			//$log.debug(" - against " + JSON.stringify(answer)) ;

			return isTriggerFired(trigger, state, response) ;
		}, 

		getQuestionIds : function(trigger) {

			$log.debug("identifying question ids for " + JSON.stringify(trigger)) ;

			var questionIds = getQuestionIdsForTrigger(trigger) ;

			$log.debug(questionIds) ;

			return questionIds ;
		} 


	}
}]) 


/* 
	This factory allows you to create one or more (so non-singleton) SurveyState objects

	Each SurveyState obj is instantiated with a schema and a response object, and provides methods to track what happens to the survey state 
	(e.g current page, visible fields, etc). 
*/
.factory('SurveyStates', ['$log','TriggerStates', 'AnswerStates', function($log, TriggerStates, AnswerStates) {


	function SurveyState(schema, response) {

		//clone all fields into array, attaching additional information
		this.fields = [] ;
		this.fieldsById = {} ;

		//also identify and clone individual pages
		this.pages = [] ;

		_.each(schema.fields, function (field) {

			var f = _.cloneDeep(field) ;

			var p ;

			if (f.type == "pageBreak") {
				
				p = f ;
				p.relevantFields = [] ;
				p.pageRuleStates = {} ;

				this.pages.push(p) ;

			} else {

				if (this.pages.length == 0) {
					//we must have fields occurring before any page
					//need to create an unnamed page for them 
					p = {relevantFields:[]} ;
					this.pages.push(p) ;
				} else {
					p = _.last(this.pages) ;
				}
				p.relevantFields.push(f) ;
			}

			f.pageIndex = (this.pages.length - 1) ;

			switch (f.type) {
				case 'instruction':
				case 'pageBreak':
				case 'sectionBreak':
					f.isQuestion = false ;
					break ;
				default:
					f.isQuestion = true ;

			}

			f.pageRuleIndexes = [] ;
			f.fieldRuleIndexes = [] ;

			this.fields.push(f) ;

			this.fieldsById[f.id] = f ;
	
		}, this) ;

		$log.debug("set up fields") ;


		//clone all field rules into array, attaching additional information
		//also attach to each field a list of relevant field rules that might be effected by answers to the field
		this.fieldRules = [] ;
		_.each(schema.fieldRules, function(rule, ruleIndex) {

			var r = _.cloneDeep(rule) ;
			r.index = ruleIndex ;

			this.fieldRules.push(r) ;

			_.each(TriggerStates.getQuestionIds(r.trigger), function(questionId) {

				var field = this.fieldsById[questionId] ;

				field.fieldRuleIndexes.push(ruleIndex) ;
			}, this) ;
		}, this) ;

		$log.debug("set up field rules") ;

		//clone all page rules into array, attaching additional information
		//also attach to each field a list of relevant field rules that might be effected by answers to the field
		this.pageRules = [] ;

		_.each(schema.pageRules, function(rule, ruleIndex) {

			var r = _.cloneDeep(rule) ;
			r.index = ruleIndex ;

			this.pageRules.push(r) ;

			_.each(TriggerStates.getQuestionIds(r.trigger), function(questionId) {

				var field = this.fieldsById[questionId] ;

				field.pageRuleIndexes.push(ruleIndex) ;
			}, this) ;

		}, this) ;

		$log.debug("set up page rules") ;

		this.handleResponseUpdated(response) ;
	}

	SurveyState.prototype.handleResponseUpdated = function(response) {

		$log.debug("Response changed!") ;

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

		$log.debug(this.response.answers) ;

		//check state of triggers for all answers
		_.each(this.response.answers, function(answer, answerIndex) {
			$log.debug("checking answer " + answerIndex) ;
			this.handleAnswerChanged(answerIndex) ;
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

			if (field.fieldRuleState == 'hide')
				return ;

			if (!field.isQuestion)
				return ;

			if (field.answered)
				return ;

			if (field.hidden)
				return ;

			if (field.optional)
				return ;

			//console.log("required field is not answered")
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
			this.response.pageIndex = nextUnskippedPage.pageIndex ;
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
			this.response.pageIndex = prevUnskippedPage.pageIndex ;
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

		_.each(this.fields, function(field) {
			//console.log(field.id + " p:" + field.pageIndex + " cp:" + this.response.pageIndex + " fs:" + field.fieldRuleState) ;
			this.updateVisibility(field) ;
		}, this) ;
	}

	SurveyState.prototype.updateVisibility = function(field) {

		var visible = true;

		if (field.hidden) 
			visible = false ;

		if (field.fieldRuleState == 'hide')
			visible = false ;

		if (field.pageIndex != this.response.pageIndex)
			visible = false ;

		field.visible = visible ;
	}


	SurveyState.prototype.handleAnswerChanged = function(fieldId) {

		$log.debug("answer changed for " + fieldId) ;

		var field = this.fieldsById[fieldId] ;
		var answer = this.response.answers[fieldId] ;

		
		if (field == undefined) {
			$log.warn("Could not find field " + fieldId) ;
			return ;
		}


		field.answered = AnswerStates.isAnswered(field, answer) ;

		if (field.answered)
			field.missing = false ;

		_.each(field.fieldRuleIndexes, function(fieldRuleIndex) {

			var fieldRule = this.fieldRules[fieldRuleIndex] ;
			$log.debug("  checking fieldRule: " + fieldRuleIndex);

			var fired = TriggerStates.isFired(fieldRule.trigger, this) ;

			if (fired != fieldRule.fired) {
				fieldRule.fired = fired ;
				this.handleFieldRuleStateChanged(fieldRule) ;
			}
		}, this) ;

		_.each(field.pageRuleIndexes, function(pageRuleIndex) {

			var pageRule = this.pageRules[pageRuleIndex] ;
			$log.debug("  checking pageRule: " + pageRuleIndex);

			var fired = TriggerStates.isFired(pageRule.trigger, this) ;

			if (fired != pageRule.fired) {
				pageRule.fired = fired ;
				this.handlePageRuleStateChanged(pageRule) ;
			}
		}, this) ;
	}

	SurveyState.prototype.handleFieldRuleStateChanged = function(rule) {



		$log.debug("field rule state changed to " + rule.fired) ;

		_.each(rule.actions, function(action) {

			var field = this.fieldsById[action.fieldId] ;

			$log.debug("  - handling action to " + action.action + " " + action.fieldId) ;

			if (action.action == 'show') {
				if (rule.fired)
					field.fieldRuleState = "show" ;
				else
					field.fieldRuleState = "hide" ;
			} else {
				if (rule.fired)
					field.fieldRuleState = "hide" ;
				else
					field.fieldRuleState = "show" ;
			} ;

			//if a field gets hidden, wipe any answers to it
			if (field.fieldRuleState == "hide" && field.isQuestion) {

				if (AnswerStates.isAnswered(field, this.response.answers[field.id])) {

					$log.debug("Recursively clearing answer to " + field.id) ;
					
					this.response.answers[field.id] = {} ;
					this.handleAnswerChanged(field.id) ;
				}
			}

			this.updateVisibility(field) ;

		}, this) ;
	}

	SurveyState.prototype.handlePageRuleStateChanged = function(rule) {

		$log.debug("page rule state changed to " + rule.fired) ;
		$log.debug(rule) ;

		//identify earliest effected page, which is the next page after the last trigger
		var earliestEffectedPageIndex ;
		_.each(TriggerStates.getQuestionIds(rule.trigger), function(questionId) {

			var question = this.fieldsById[questionId] ;
			if (earliestEffectedPageIndex == null || earliestEffectedPageIndex < question.pageIndex)
				earliestEffectedPageIndex = question.pageIndex ;

		}, this) ;
		earliestEffectedPageIndex ++ ;

		_.each(rule.actions, function(action) {

			switch (action.action) {

				case 'skip' :

					var pageToSkip = this.fieldsById[action.pageId] ;

					if (rule.fired) {
						//skip all pages between current one and action.page
						pageToSkip.pageRuleStates[rule.index] = 'skip' ;
					} else {
						//cancel any intention to skip this page due to this rule
						pageToSkip.pageRuleStates[rule.index] = undefined ;
					}

					break ;

				case 'skipTo' :

					var pageToSkipTo = this.fieldsById[action.pageId] ;

					for (var i=earliestEffectedPageIndex ; i<pageToSkipTo.pageIndex ; i++) {

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