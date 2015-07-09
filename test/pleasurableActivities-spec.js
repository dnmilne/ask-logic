describe('pleasurableActivitiesSpec', function() {

    var Logger ;
	var SurveyStates ;
	var AnswerStates ;

	beforeEach(module('ask-logic', function($provide) {

	  $provide.value('$log', console);

	  jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
	  schema = getJSONFixture('pleasurableActivities.json') ;

	})) ;


	beforeEach(

	 	inject(function ($injector) {
	 		Logger = $injector.get('Logger') ;
	        SurveyStates = $injector.get('SurveyStates') ;
	        AnswerStates = $injector.get('AnswerStates') ;

		}) 
	);

	it("Should handle field rules involving tags", function() {

		//Logger.setLogLevel('debug', 'ask.logic.state.rules') ;

		var response = {answers:{}} ;
		response.answers["qVerbosity"] = {choice:"verbose"} ;
		response.answers["qPersonas"] = {choice:"true"} ;
		response.answers["qMedia"] = {choice:"text"} ;

		var state = SurveyStates.init(schema, response) ;

		console.log(state.fieldsById["iStartVerbose"]) ;
		expect(state.fieldsById["iStartVerbose"].visible).toEqual(true) ;
		expect(state.fieldsById["iStartConcise"].visible).toEqual(false) ;
		expect(state.fieldsById["vStartVerbose"].visible).toEqual(false) ;
		expect(state.fieldsById["vStartConcise"].visible).toEqual(false) ;

		response.answers["qVerbosity"] = {choice:"concise"} ;
		state.handleAnswerChanged('qVerbosity')
		expect(state.fieldsById["iStartVerbose"].visible).toEqual(false) ;
		expect(state.fieldsById["iStartConcise"].visible).toEqual(true) ;
		expect(state.fieldsById["vStartVerbose"].visible).toEqual(false) ;
		expect(state.fieldsById["vStartConcise"].visible).toEqual(false) ;

		response.answers["qMedia"] = {choice:"video"} ;
		state.handleAnswerChanged('qMedia')
		expect(state.fieldsById["iStartVerbose"].visible).toEqual(false) ;
		expect(state.fieldsById["iStartConcise"].visible).toEqual(false) ;
		expect(state.fieldsById["vStartVerbose"].visible).toEqual(false) ;
		expect(state.fieldsById["vStartConcise"].visible).toEqual(true) ;

	})
});