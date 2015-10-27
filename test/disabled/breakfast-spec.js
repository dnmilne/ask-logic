describe('chatScript', function() {

	var SurveyStates ;
	var AnswerStates ;

	beforeEach(module('askjs.core', function($provide) {

	  $provide.value('$log', console);

	  jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
	  schema = getJSONFixture('breakfast.json') ;

	})) ;


	beforeEach(

	 	inject(function ($injector) {
	        SurveyStates = $injector.get('SurveyStates') ;
	        AnswerStates = $injector.get('AnswerStates') ;
		}) 
	);


	



		it("Should track completion of qFavorites", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			console.log(state.schema.fieldsById["qFavorites"]) ;

			response.answers["qFavorites"] = {entries:[""]} ;
			state.handleAnswerChanged("qFavorites") ;
			expect(state.schema.fieldsById["qFavorites"].answered).toEqual(false) ;

			response.answers["qFavorites"] = {entries:["","",""]} ;
			state.handleAnswerChanged("qFavorites") ;
			expect(state.schema.fieldsById["qFavorites"].answered).toEqual(false) ;

			response.answers["qFavorites"] = {entries:["Cocopops","Rice Krispies","Fruit loops"]} ;
			state.handleAnswerChanged("qFavorites") ;
			expect(state.schema.fieldsById["qFavorites"].answered).toEqual(true) ;

			response.answers["qFavorites"] = {entries:["Cocopops","Rice Krispies"]} ;
			state.handleAnswerChanged("qFavorites") ;
			expect(state.schema.fieldsById["qFavorites"].answered).toEqual(false) ;

			response.answers["qFavorites"] = {entries:["Cocopops","", "Fruit loops"]} ;
			state.handleAnswerChanged("qFavorites") ;
			expect(state.schema.fieldsById["qFavorites"].answered).toEqual(false) ;
			
		}) 
		

		



});