describe('genderAndParenthood', function() {

	var Logger ;
	var SurveyStates ;

	beforeEach(module('askjs.core', function($provide) {

	  $provide.value('$log', console);

	  jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
	  schema = getJSONFixture('genderAndParenthood.json') ;

	})) ;

	beforeEach(

	 	inject(function ($injector) {
	 		Logger = $injector.get('Logger') ;
	        SurveyStates = $injector.get('SurveyStates') ;
		}) 
	);

	/*

	it ("Should inject blank answers for question fields", function() {

		var response = {} ;
		var state = SurveyStates.init(schema, response) ;

		expect(response.answers.qGender).toBeTruthy() ;
		expect(response.answers.qDependents).toBeTruthy() ;

		expect(response.answers.pMales).toBeUndefined() ;
		expect(response.answers.iMales).toBeUndefined() ;

	}) ;
	

	it("Should handle no gender (skip to end)", function() {

		//Logger.setLogLevel('debug', 'ask.logic.state.pageRules') ;
		//Logger.setLogLevel('info', 'ask.logic.triggers') ;

		//can skip right to end if user doesn't give a gender,
		//and then skip right back to start if they ask to go back
		var response = {
			answers:{
				qGender:{choice:"I'd rather not say"},
				qDependents: {number:2}
			}
		} ;
		var state = SurveyStates.init(schema, response) ;


		debugger ;

		//console.log(state.schema.pageRules[0]) ;
		//console.log(state.schema.pages[1].pageRuleStates) ;

		state.handleContinue() ;

		//console.log("PAGE INDEX " + response.pageIndex) ;
		
		expect(response.completedAt).toBeDefined() ;

		state.handleBack() ;
		expect(response.pageIndex).toEqual(0) ;
		expect(response.completed).not.toBeDefined() ;
	}) ;

	it("Should handle male with no dependents", function() {

		//Logger.setLogLevel('debug', 'ask.logic.state.pageRules') ;

		var response = {
			answers:{
				qGender:{choice:"Male"},
				qDependents: {number:0}
			}
		} ;
		var state = SurveyStates.init(schema, response) ;

		state.handleContinue()

		//console.log(response.pageIndex) ;
		//console.log(state.schema.page.id) ;

		expect(state.schema.page.id).toEqual('pMales') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleContinue() ;
		expect(response.completedAt).toBeDefined() ;

		state.handleBack()
		expect(state.schema.page.id).toEqual('pMales') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleBack()
		expect(response.pageIndex).toEqual(0) ;
		expect(response.completedAt).not.toBeDefined() ;
	}) ;

	
	it("Should handle male with dependents", function() {

		var response = {
			answers:{
				qGender:{choice:"Male"},
				qDependents: {number:2}
			}
		} ;
		var state = SurveyStates.init(schema, response) ;

		state.handleContinue()
		expect(state.schema.page.id).toEqual('pMales') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleContinue() ;
		expect(state.schema.page.id).toEqual('pFathers') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleContinue() ;
		expect(response.completedAt).toBeDefined() ;

		state.handleBack()
		expect(state.schema.page.id).toEqual('pFathers') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleBack()
		expect(state.schema.page.id).toEqual('pMales') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleBack()
		expect(response.pageIndex).toEqual(0) ;
		expect(response.completedAt).not.toBeDefined() ;
	}) ;

	it("Should handle female with no dependents", function() {

		var response = {
			answers:{
				qGender:{choice:"Female"},
				qDependents: {number:0}
			}
		} ;
		var state = SurveyStates.init(schema, response) ;

		state.handleContinue()
		expect(state.schema.page.id).toEqual('pFemales') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleContinue() ;
		expect(response.completedAt).toBeDefined() ;

		state.handleBack()
		expect(state.schema.page.id).toEqual('pFemales') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleBack()
		expect(response.pageIndex).toEqual(0) ;
		expect(response.completedAt).not.toBeDefined() ;
	}) ;

	it("Should handle female with dependents", function() {

		var response = {
			answers:{
				qGender:{choice:"Female"},
				qDependents: {number:2}
			}
		} ;
		var state = SurveyStates.init(schema, response) ;

		state.handleContinue()
		expect(state.schema.page.id).toEqual('pFemales') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleContinue() ;
		expect(state.schema.page.id).toEqual('pMothers') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleContinue() ;
		expect(response.completedAt).toBeDefined() ;

		state.handleBack()
		expect(state.schema.page.id).toEqual('pMothers') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleBack()
		expect(state.schema.page.id).toEqual('pFemales') ;
		expect(response.completedAt).not.toBeDefined() ;

		state.handleBack()
		expect(response.pageIndex).toEqual(0) ;
		expect(response.completedAt).not.toBeDefined() ;
	}) ;

	*/

	it("Should handle autoAdvance", function() {

		var response = {} ;
		var config = {autoAdvance:true} ;

		var state = SurveyStates.init(schema, response, config) ;

		response.answers["qGender"] = {choice:"Male"} ;
		state.handleFieldChanged("qGender") ;

		expect(state.schema.page.id).toEqual('pIntro') ;

		response.answers["qDependents"] = {number:0} ;
		state.handleFieldChanged("qDependents") ;

		expect(state.schema.page.id).toEqual('pMales') ;

	}) ;




}) ;