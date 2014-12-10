describe('chatScript', function() {

	var SurveyStates ;

	beforeEach(function() {

		module('ask-logic') ;

		inject(function ($injector) {
			SurveyStates = $injector.get('SurveyStates') ;
		}) ;

		jasmine.getJSONFixtures().fixturesPath='base/test/schemas';

		schema = getJSONFixture('chatScript.json') ;
	}) ;

	describe('field rules', function() {

		it("Should manage field visibility in response to qLaunch question", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			expect(state.fieldsById["qLaunch"].visible).toEqual(true) ;
			expect(state.fieldsById["iHiWithoutQuestion"].visible).toEqual(false) ; 
			expect(state.fieldsById["iHiWithQuestion"].visible).toEqual(false) ; 
			expect(state.fieldsById["qAge"].visible).toEqual(false) ;

			response.answers["qLaunch"] = {choice:"Yes"} ;
			state.handleAnswerChanged("qLaunch") ;
			expect(state.fieldsById["iHiWithoutQuestion"].visible).toEqual(false) ; 
			expect(state.fieldsById["iHiWithQuestion"].visible).toEqual(true) ; 
			expect(state.fieldsById["qAge"].visible).toEqual(true) ;

			response.answers["qLaunch"] = {choice:"No"} ;
			state.handleAnswerChanged("qLaunch") ;
			expect(state.fieldsById["iHiWithoutQuestion"].visible).toEqual(true) ; 
			expect(state.fieldsById["iHiWithQuestion"].visible).toEqual(false) ; 
			expect(state.fieldsById["qAge"].visible).toEqual(true) ;
		}) 


		it("Should manage field visibility in response to qAge question", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			response.answers["qLaunch"] = {choice:"Yes"} ;
			state.handleAnswerChanged("qLaunch") ;

			response.answers["qAge"] = {number:12} ;
			state.handleAnswerChanged("qAge") ;
			expect(state.fieldsById["iUnderage"].visible).toEqual(true) ;
			expect(state.fieldsById["iOverage"].visible).toEqual(false) ;
			expect(state.fieldsById["iConsentCheck1"].visible).toEqual(false) ;
			expect(state.fieldsById["iConsentCheck2"].visible).toEqual(false) ;
			expect(state.fieldsById["iConsentCheck3"].visible).toEqual(false) ;

			response.answers["qAge"] = {number:28} ;
			state.handleAnswerChanged("qAge") ;
			expect(state.fieldsById["iUnderage"].visible).toEqual(false) ;
			expect(state.fieldsById["iOverage"].visible).toEqual(true) ;
			expect(state.fieldsById["iConsentCheck1"].visible).toEqual(false) ;
			expect(state.fieldsById["iConsentCheck2"].visible).toEqual(false) ;
			expect(state.fieldsById["iConsentCheck3"].visible).toEqual(false) ;

			response.answers["qAge"] = {number:18} ;
			state.handleAnswerChanged("qAge") ;
			expect(state.fieldsById["iUnderage"].visible).toEqual(false) ;
			expect(state.fieldsById["iOverage"].visible).toEqual(false) ;
			expect(state.fieldsById["iConsentCheck1"].visible).toEqual(true) ;
			expect(state.fieldsById["iConsentCheck2"].visible).toEqual(true) ;
			expect(state.fieldsById["iConsentCheck3"].visible).toEqual(true) ;

		})
	}) ;

});