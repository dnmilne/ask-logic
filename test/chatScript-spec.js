describe('chatScript', function() {

	var SurveyStates ;
	var AnswerStates ;

	beforeEach(module('ask-logic', function($provide) {

	  $provide.value('$log', console);

	  jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
	  schema = getJSONFixture('chatScript.json') ;

	})) ;


	beforeEach(

	 	inject(function ($injector) {
	        SurveyStates = $injector.get('SurveyStates') ;
	        AnswerStates = $injector.get('AnswerStates') ;
		}) 
	);


	



		it("Should manage field visibility in response to qLaunch question", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			console.log("qLaunch: ") ;
			console.log(state.fieldsById["qLaunch"]) ;

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

		

		it ("Should clear answers (recursively) for fields that get hidden by field rules", function() {

			response = {
				answers: {
					qLaunch: {choice: "No"} ,
					qAge: {number:15},
					qConsentGiven: {choice:"No"},
					qInCrisis: {choice:"Yes"}
				},
				pageIndex: 3
			} ;

			var state = SurveyStates.init(schema, response) ;

			//follow path for at-risk visitor
			response.answers.qAtRisk = {choice:"Yes"} ;
			state.handleAnswerChanged("qAtRisk") ;
			expect(state.fieldsById.iRiskSelfReferral.visible).toEqual(true) ;

			response.answers.qCalled000 = {choice:"No"} ;
			state.handleAnswerChanged("qCalled000") ;
			expect(state.fieldsById.iRiskReferral.visible).toEqual(true) ;

			response.answers.qGaveDetails = {choice:"No"} ;
			state.handleAnswerChanged("qGaveDetails") ;
			expect(state.fieldsById.iRiskNoncompliant.visible).toEqual(true) ;
			expect(state.fieldsById.iRiskReported.visible).toEqual(true) ;

			//now change path to non-at-risk
			response.answers.qAtRisk = {choice:"No"} ;
			state.handleAnswerChanged("qAtRisk") ;

			expect(AnswerStates.isAnswered(state.fieldsById.qCalled000, response.answers.qCalled000)).toEqual(false) ;
			expect(AnswerStates.isAnswered(state.fieldsById.qGaveDetails, response.answers.qGaveDetails)).toEqual(false) ;

			expect(state.fieldsById.iRiskSelfReferral.visible).toEqual(false) ;
			expect(state.fieldsById.iRiskReferral.visible).toEqual(false) ;
			expect(state.fieldsById.iRiskNoncompliant.visible).toEqual(false) ;
			expect(state.fieldsById.iRiskReported.visible).toEqual(false) ;

		})



		it ("Should manage page rules in response to qAge question", function() {

			var response = {
				answers:{
					qLaunch: {choice:"No"}
				}
			} ;
			var state = SurveyStates.init(schema, response) ;

			response.answers["qAge"] = {number:12} ;
			state.handleAnswerChanged("qAge") ;
			state.handleContinue() ;
			expect(response.completed).toEqual(true) ;

			state.handleBack() ;
			expect(response.pageIndex).toEqual(0) ;

			response.answers["qAge"] = {number:28} ;
			state.handleAnswerChanged("qAge") ;
			state.handleContinue() ;
			expect(response.completed).toEqual(true) ;

			state.handleBack() ;
			expect(response.pageIndex).toEqual(0) ;

			response.answers["qAge"] = {number:20} ;
			state.handleAnswerChanged("qAge") ;
			state.handleContinue() ;
			expect(response.completed).toEqual(false) ;
			expect(response.pageIndex).toEqual(0) ;

		})



});