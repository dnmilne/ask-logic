var AskLogic = angular.module('ask-logic', [])


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

	function isMoodAnswered(answer) {

		if (!answer.mood)
			return false ;

		return true ;
	}

	return {

		isAnswered : function(field, answer) {

			if (!field) {
				console.warn("tried to check answer to nonexistent field") ;
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
		} 
	}
}])




.factory('TriggerStates', ['$log','Normalizer', function($log, Normalizer) {

	function isSinglechoiceTriggerFired(trigger, answer) {

		if (answer.choice == null)
			return false ;

		switch(trigger.condition) {

			case 'is' :
				return Normalizer.normalize(answer.choice) == Normalizer.normalize(trigger.value) ;
			case 'isNot' :
				return Normalizer.normalize(answer.choice) != Normalizer.normalize(trigger.value) ;
		}

		return false ;
	}

	function isMultichoiceTriggerFired(trigger, answer) {

		if (answer.choices == null)
			return false ;

		var normalizedChoices = Normalizer.normalizeAll(answer.choices) ;

		var idx = normalizedChoices.indexOf(Normalizer.normalize(trigger.value)) ;

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
				return answer.number == trigger.value ;
			case 'greaterThan' :
				return answer.number > trigger.value ;
			case 'lessThan' :
				return answer.number < trigger.value ;

		}

		return false ;
	}

	function isFreetextTriggerFired(trigger, answer) {

		if (!answer.text)
			return false ;

		var answerText = Normalizer.normalize(answer.text) ;
        var triggerText = Normalizer.normalize(trigger.value) ;

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


	function isMoodTriggerFired(trigger, answer) {

		if (!answer.mood)
			return false ;

		switch(trigger.condition) {

			case 'is':
				return areMoodsEqual(trigger.value, answer.mood) ;
			case 'isNot':
				return !areMoodsEqual(trigger.value, answer.mood) ;
			case 'isNear':
				return areMoodsAdjacent(trigger.value, answer.mood) ;
			case 'isSameQuadrant':
				return getQuadrant(trigger.value) == getQuadrant(answer.mood) ;
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

		isFired : function (trigger, field, answer) {

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
				case 'mood' : 
					fired = isMoodTriggerFired(trigger, answer) ;
					break ;
				default :
					$log.warn("could not identify fire state of trigger for field type " + field.type) ;
					break ;
			} 

			if (fired)
				$log.debug("trigger " + JSON.stringify(trigger) + " IS fired") ;
			else
				$log.debug("trigger " + JSON.stringify(trigger) + " IS NOT fired") ;

			return fired ;
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

		//clone all field rules into array, attaching additional information
		this.fieldRules = [] ;

		_.each(schema.fieldRules, function(rule, ruleIndex) {

			var r = _.cloneDeep(rule) ;
			r.index = ruleIndex ;

			_.each(r.triggers, function(trigger) {
				trigger.fieldRuleIndex = ruleIndex ;
			}) ;

			this.fieldRules.push(r) ;
		}, this) ;


		//clone all page rules into array, attaching additional information
		this.pageRules = [] ;

		_.each(schema.pageRules, function(rule, ruleIndex) {

			var r = _.cloneDeep(rule) ;
			r.index = ruleIndex ;

			_.each(r.triggers, function(trigger) {
				trigger.pageRuleIndex = ruleIndex ;
			}) ;

			this.pageRules.push(r) ;
		}, this) ;

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

			//some extra stuff is needed to handle question fields
			if (f.isQuestion) {

				//if we don't have an answer object for this question field, then initialize an empty one
				

				//identify any relevant fieldRuleTriggers
				f.relevantTriggers = [] ;

				_.each(this.fieldRules, function(rule) {
					_.each(rule.triggers, function(trigger) {
						if (trigger.questionId == f.id)
							f.relevantTriggers.push(trigger) ;
					}) ;
				}) ;

				_.each(this.pageRules, function(rule) {
					_.each(rule.triggers, function(trigger) {
						if (trigger.questionId == f.id)
							f.relevantTriggers.push(trigger) ;
					}) ;
				}) ;
			} ;


			this.fields.push(f) ;

			this.fieldsById[f.id] = f ;

		}, this) ;


		this.handleResponseUpdated(response) ;
	}

	SurveyState.prototype.handleResponseUpdated = function(response) {

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

		//check state of triggers for all answers
		_.each(this.response.answers, function(answer, answerIndex) {
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

		_.each(field.relevantTriggers, function(trigger) {

			$log.debug("  checking trigger: " + trigger.fieldRuleIndex);

			var triggerFired = TriggerStates.isFired(trigger, field, answer) ;

			if (triggerFired != trigger.fired) {
				trigger.fired = triggerFired ;
				this.handleTriggerStateChanged(trigger) ;
			}

		}, this) ;

	}

	SurveyState.prototype.handleTriggerStateChanged = function(trigger) {

		$log.debug("state changed for trigger: " + JSON.stringify(trigger)) ;
		
		var ruleType, rule ;

		if (trigger.fieldRuleIndex != null) {
			ruleType = 'fieldRule' ;
			rule = this.fieldRules[trigger.fieldRuleIndex] ;
		} else {
			ruleType = 'pageRule' ;
			rule = this.pageRules[trigger.pageRuleIndex] ;
		}

		var ruleFired ;

		if (rule.operator == 'or') {
			//look for first fired trigger

			var firstFiredTrigger = _.find(rule.triggers, function(t) {
				return t.fired ;
			}) ;

			if (firstFiredTrigger) 
				ruleFired = true ;
			else
				ruleFired = false ;
		} else {

			//look for first unfired trigger

			var firstUnfiredTrigger = _.find(rule.triggers, function(t) {
				return !t.fired ;
			}) ;

			if (firstUnfiredTrigger)
				ruleFired = false ;
			else
				ruleFired = true ;
		}

		if (ruleFired != rule.fired) {
			rule.fired = ruleFired ;

			if (ruleType == 'fieldRule')
				this.handleFieldRuleStateChanged(rule) ;
			else
				this.handlePageRuleStateChanged(rule) ;
		}
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
			if (field.fieldRuleState == "hide") {
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
		_.each(rule.triggers, function(trigger) {

			var question = this.fieldsById[trigger.questionId] ;
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