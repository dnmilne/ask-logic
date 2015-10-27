describe('pleasurableActivitiesSpec', function() {

    var Logger ;
	var SurveyStates ;
	var AnswerStates ;

	beforeEach(module('askjs.core', function($provide) {

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

		Logger.setLogLevel('debug', 'ask.core.init') ;

		var response = {answers:{}} ;
		response.answers["qVerbosity"] = {choice:"verbose"} ;
		response.answers["qPersonas"] = {choice:"true"} ;
		response.answers["qMedia"] = {choice:"text"} ;

		var state = SurveyStates.init(schema, response) ;

        debugger;

		console.log(state.schema.fieldsById["iStartVerbose"]) ;
		expect(state.schema.fieldsById["iStartVerbose"].visible).toEqual(true) ;
		expect(state.schema.fieldsById["iStartConcise"].visible).toEqual(false) ;
		expect(state.schema.fieldsById["vStartVerbose"].visible).toEqual(false) ;
		expect(state.schema.fieldsById["vStartConcise"].visible).toEqual(false) ;

		response.answers["qVerbosity"] = {choice:"concise"} ;
		state.handleAnswerChanged('qVerbosity') ;
		expect(state.schema.fieldsById["iStartVerbose"].visible).toEqual(false) ;
		expect(state.schema.fieldsById["iStartConcise"].visible).toEqual(true) ;
		expect(state.schema.fieldsById["vStartVerbose"].visible).toEqual(false) ;
		expect(state.schema.fieldsById["vStartConcise"].visible).toEqual(false) ;

		response.answers["qMedia"] = {choice:"video"} ;
		state.handleAnswerChanged('qMedia') ;
		expect(state.schema.fieldsById["iStartVerbose"].visible).toEqual(false) ;
		expect(state.schema.fieldsById["iStartConcise"].visible).toEqual(false) ;
		expect(state.schema.fieldsById["vStartVerbose"].visible).toEqual(false) ;
		expect(state.schema.fieldsById["vStartConcise"].visible).toEqual(true) ;

	})
});