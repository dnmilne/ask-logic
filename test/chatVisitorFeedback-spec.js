describe('chatVisitorFeedback', function() {

	var SurveyStates ;


	beforeEach(module('ask-logic', function($provide) {

	  	$provide.value('$log', console);

	  	jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
		schema = getJSONFixture('chatVisitorFeedback.json') ;
	})) ;

	beforeEach(function() {

		inject(function ($injector) {
			SurveyStates = $injector.get('SurveyStates') ;
		}) ;
	}) ;

	describe('initialization', function() {

		it("Should clone all fields in schema", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			expect(state.fields.length).toEqual(10) ;
			expect(state.fieldsById["qGender"].question).toEqual("What gender are you?") ;
			expect(state.fieldsById["qGender2"].question).toEqual("What best describes you?") ;
			expect(state.fieldsById["qGender"].affectedFieldRules.length).toEqual(1) ;
			expect(state.fieldsById["qWorthwhile"].affectedFieldRules.length).toEqual(1) ;
		})

		it ("Should have an unnamed page for all fields", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			expect(state.pages.length).toEqual(1) ;
			expect(state.pages[0].relevantFields.length).toEqual(10) ;
		})

		it ("Should clone all field rules in schema", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			console.log(state.fieldRules) ;

			expect(state.fieldRules.length).toEqual(2) ;
		})

		

	}) ;


	describe('field rules', function() {

		it("Should manage visibility of qGender2", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			expect(state.fieldsById["qGender2"].visible).toEqual(false) ; 

			response.answers["qGender"] = {choice:"Male"} ;
			state.handleAnswerChanged("qGender") ;
			expect(state.fieldsById["qGender2"].visible).toEqual(false) ; 

			response.answers["qGender"] = {choice:"Female"} ;
			state.handleAnswerChanged("qGender") ;
			expect(state.fieldsById["qGender2"].visible).toEqual(false) ; 

			response.answers["qGender"] = {choice:"More options"} ;
			state.handleAnswerChanged("qGender") ;
			expect(state.fieldsById["qGender2"].visible).toEqual(true) ; 
		}) ;

		it("Should manage visibility of qSuggestions", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			expect(state.fieldsById["qSuggestions"].visible).toEqual(false) ; 

			response.answers["qWorthwhile"] = {choice:"Yes"} ;
			state.handleAnswerChanged("qWorthwhile") ;
			expect(state.fieldsById["qSuggestions"].visible).toEqual(false) ;

			response.answers["qWorthwhile"] = {choice:"No"} ;
			state.handleAnswerChanged("qWorthwhile") ;
			expect(state.fieldsById["qSuggestions"].visible).toEqual(true) ;  
		})
	}) ;

	describe('submission', function() {

		it ("Should only block submission for mandatory fields that are visible", function() {

			var response = {
				answers:{
					qVisitorId: {text:"visitorId"},
					qSessionId: {text:"sessionId"},
					qGender: {choice:"More options"},
					qPostcode: {number:2095},
					qForumMember: {choice:"Yes"},
					qMoodBefore: {mood:{name:"discouraged",valence:-0.5,arousal:-0.3}},
					qMoodNow: {mood:{name:"chill",valence:0.3,arousal:-0.5}},
					qWorthwhile: {choice:"No"}
				}
			} ;

			var state = SurveyStates.init(schema, response) ;

			state.handleContinue() ;
			expect(response.completed).toEqual(false) ;

			response.answers["qGender"] = {choice:"Male"} ;
			state.handleAnswerChanged("qGender") ;
			state.handleContinue() ;
			expect(response.completed).toEqual(true) ;
		}) ;

	}) ;


}) ;
