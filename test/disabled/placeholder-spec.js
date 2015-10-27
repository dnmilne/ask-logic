describe('placeholder', function() {

	var PlaceholderResolver ;
	var SurveyStates ;
	var schema ;


	beforeEach(module('askjs.core', function($provide) {

	  $provide.value('$log', console);

	  jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
	  schema = getJSONFixture('fitnessCoach.json') ;
	})) ;



	beforeEach(function() {

		module('askjs.core') ;

		inject(function ($injector) {
			PlaceholderResolver = $injector.get('PlaceholderResolver') ;
			SurveyStates = $injector.get('SurveyStates') ;
		}) ;
	}) ;



	it("Should resolve qStreak placeholder properly", function() {

		var response = {
			answers:{
				qGender:{choice:"Male"},
				qStreak: {number:2},
				qDaysTired: {number:2},
				qSickStreak: {number:0},
				qDaysBusy: {number:2},
				qStepsYesterday: {number: 3581},
				qDifficulty: {choice:"Easy"}
			}
		} ;
		var state = SurveyStates.init(schema, response) ;

		var message ;

		message = "a:[[qStreak]] b:[[qDifficulty]] c:blah" ;
		expect(PlaceholderResolver.resolve(message, state, response)).toEqual("a:2 b:Easy c:blah") ;

		message = "You have been good for [[qStreak]] days straight!" ;
		expect(PlaceholderResolver.resolve(message, state, response)).toEqual("You have been good for 2 days straight!") ;

		message = "Yesterday you did [[qStepsYesterday]] steps and found it [[qDifficulty]]!" ;
		expect(PlaceholderResolver.resolve(message, state, response)).toEqual("Yesterday you did 3581 steps and found it Easy!") ;

	}) ;




}) ;