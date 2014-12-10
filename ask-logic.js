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


.factory('AnswerStates', function() {


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

		if (!answer.text == null)
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

			if (!answer)
				return false ;

			switch(field.type) {

				case 'singlechoice' :
					return isSinglechoiceAnswered(answer) ;
				case 'multichoice' :
					return isMultichoiceAnswered(answer) ;
				case 'numeric' :
					return isNumericAnswered(answer) ;
				case 'freetext' :
					return isFreetextAnswered(answer) ;
				case 'mood' :
					return isMoodAnswered(answer) ;
			} 

			return false ;
		} 
	}
})




.factory('TriggerStates', ['Normalizer', function(Normalizer) {

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

			switch(field.type) {

				case 'singlechoice' :
					return isSinglechoiceTriggerFired(trigger, answer) ;
				case 'multichoice' :
					return isMultichoiceTriggerFired(trigger, answer) ;
				case 'numeric' :
					return isNumericTriggerFired(trigger, answer) ;
				case 'freetext' :
					return isFreetextTriggerFired(trigger, answer) ;
				case 'mood' : 
					return isMoodTriggerFired(trigger, answer) ;
			} 

			return false ;
		} 
	}
}]) 


/* 
	This factory allows you to create one or more (so non-singleton) SurveyState objects

	Each SurveyState obj is instantiated with a schema and a response object, and provides methods to track what happens to the survey state 
	(e.g current page, visible fields, etc). 
*/
.factory('SurveyStates', ['TriggerStates', 'AnswerStates', function(TriggerStates, AnswerStates) {


	function SurveyState(schema, response) {

		//this.schema = schema ;

		//initialize response object. Don't clone it.
		if (!response.answers)
			response.answers = {} ;

		if (!response.pageIndex)
			response.pageIndex = 0 ;

		if (response.completed == null)
			response.completed = false ;
		
		this.response = response ;
		

		//clone all field rules into array, attaching additional information
		this.fieldRules = [] ;

		_.each(schema.fieldRules, function(rule, ruleIndex) {

			var r = {
				triggers:[],
				actions:rule.actions,
				operator:rule.operator,
				index:ruleIndex
			} 

			_.each(rule.triggers, function(trigger) {
				var t = _.clone(trigger) ;
				t.fieldRuleIndex = ruleIndex ;
				r.triggers.push(t) ;
			}) ;

			this.fieldRules.push(r) ;
		}, this) ;


		//clone all page rules into array, attaching additional information
		this.pageRules = [] ;

		_.each(schema.pageRules, function(rule, ruleIndex) {

			var r = {
				triggers:[],
				actions:rule.actions,
				index:ruleIndex
			} 

			_.each(rule.triggers, function(trigger) {
				var t = _.clone(trigger) ;
				t.pageRuleIndex = ruleIndex ;
				r.triggers.push(t) ;
			}) ;

			this.pageRules.push(r) ;
		}, this) ;

		//clone all fields into array, attaching additional information
		this.fields = [] ;
		this.fieldsById = {} ;

		//also identify and clone individual pages
		this.pages = [] ;

		_.each(schema.fields, function (field) {

			var f = _.clone(field) ;

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
				if (!this.response.answers[f.id])
					this.response.answers[f.id] = {} ;

				//identify any relevant fieldRuleTriggers
				f.relevantTriggers = [] ;

				_.each(this.fieldRules, function(rule) {
					_.each(rule.triggers, function(trigger) {
						if (trigger.questionId == f.id)
							f.relevantTriggers.push(trigger) ;
					}) ;
				}) ;
			} ;


			this.fields.push(f) ;

			this.fieldsById[f.id] = f ;

		}, this) ;


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

	SurveyState.prototype.handleCurrentPageChanged = function() {

		if (this.response.pageIndex == null) {
			if (this.response.completed)
				this.response.pageIndex = this.pages.length ;
			else
				this.response.pageIndex = 0 ;
		}

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

		//console.log("Answer changed:" + fieldId) ;

		var field = this.fieldsById[fieldId] ;
		var answer = this.response.answers[fieldId] ;

		//console.log(this.response) ;

		field.answered = AnswerStates.isAnswered(field, answer) ;

		if (field.answered)
			field.missing = false ;

		_.each(field.relevantTriggers, function(trigger) {

			//console.log("checking trigger: " + trigger.fieldRuleIndex);

			var triggerFired = TriggerStates.isFired(trigger, field, answer) ;

			if (triggerFired != trigger.fired) {
				trigger.fired = triggerFired ;
				this.handleTriggerStateChanged(trigger) ;
			}

		}, this) ;

	}

	SurveyState.prototype.handleTriggerStateChanged = function(trigger) {

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

		//console.log("fieldRule state changed to " + rule.fired) ;

		_.each(rule.actions, function(action) {

			var field = this.fieldsById[action.fieldId] ;

			//console.log("  - handling action to " + action.action + " " + action.fieldId) ;

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

			this.updateVisibility(field) ;

			//console.log("  - " + field.fieldRuleState) ;

		}, this) ;
	}

	SurveyState.prototype.handlePageRuleStateChanged = function(rule) {

		//identify earliest effected page, which is the next page after the last trigger
		var earliestEffectedPageIndex ;
		_.each(rule.triggers, function(trigger) {

			var question = this.fieldsById[trigger.questionId] ;
			if (earliestEffectedPageIndex == null || earliestEffectedPageIndex < question.pageIndex)
				earliestEffectedPageIndex = question.pageIndex ;

		}, this) ;
		earliestEffectedPageIndex ++ ;

		//console.log("earliestEffectedPageIndex=" + earliestEffectedPageIndex) ;

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