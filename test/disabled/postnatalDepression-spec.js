describe('postnatalDepression', function() {

	var SurveyStates ;
	var AnswerStates ;

	beforeEach(module('askjs.core', function($provide) {

	  $provide.value('$log', console);

	  jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
	  schema = getJSONFixture('postnatalDepression.json') ;

	})) ;


	beforeEach(

	 	inject(function ($injector) {
	        SurveyStates = $injector.get('SurveyStates') ;
	        AnswerStates = $injector.get('AnswerStates') ;
		}) 
	);

	it("Should prepare weights", function() {

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		//console.log(state.fieldsById["qMotherSupportive"]) ;

		expect(state.schema.fieldsById["qMotherSupportive"].weights.length).toEqual(5) ;
		expect(state.schema.fieldsById["qMotherSupportive"].weights[0]).toEqual(5) ;
		expect(state.schema.fieldsById["qMotherSupportive"].weights[4]).toEqual(1) ;

		//console.log(state.schema.fieldsById["qDepressionImpact"]) ;

		expect(state.schema.fieldsById["qDepressionImpact"].weights.length).toEqual(5) ;
		expect(state.schema.fieldsById["qDepressionImpact"].weights[0]).toEqual(1) ;
		expect(state.schema.fieldsById["qDepressionImpact"].weights[4]).toEqual(5) ;
	})

	it("Should backlink to score fields", function() {

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		//console.log(state.schema.fieldsById["qWorrier"]) ;

		expect(state.schema.fieldsById["qWorrier"].affectedScoreFields.length).toEqual(1) ;
		expect(state.schema.fieldsById["qWorrier"].affectedScoreFields[0]).toEqual("sPersonality") ;
	})

});