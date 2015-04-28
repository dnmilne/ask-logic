describe('chatScript', function() {

	var SurveyStates ;
	var AnswerStates ;

	beforeEach(module('ask-logic', function($provide) {

	  $provide.value('$log', console);

	  jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
	  schema = getJSONFixture('choiceSources.json') ;

	})) ;


	beforeEach(

	 	inject(function ($injector) {
	        SurveyStates = $injector.get('SurveyStates') ;
	        AnswerStates = $injector.get('AnswerStates') ;
		}) 
	);


	



		it("Should track choice destinations", function() {

			var response = {answers:{}} ;
			var state = SurveyStates.init(schema, response) ;

			expect(_.contains(state.fieldsById["qName"].choiceDestinations, "qCombined")).toEqual(true) ;
			expect(_.contains(state.fieldsById["qName"].choiceDestinations, "qCombined2")).toEqual(false) ;

			expect(_.contains(state.fieldsById["qGender"].choiceDestinations, "qCombined")).toEqual(true) ;
			expect(_.contains(state.fieldsById["qGender"].choiceDestinations, "qCombined2")).toEqual(false) ;

			expect(_.contains(state.fieldsById["qHobbies"].choiceDestinations, "qCombined")).toEqual(true) ;
			expect(_.contains(state.fieldsById["qHobbies"].choiceDestinations, "qCombined2")).toEqual(true) ;

			expect(_.contains(state.fieldsById["qMood"].choiceDestinations, "qCombined")).toEqual(false) ;
			expect(_.contains(state.fieldsById["qMood"].choiceDestinations, "qCombined2")).toEqual(true) ;

			expect(_.contains(state.fieldsById["qCereals"].choiceDestinations, "qCombined")).toEqual(false) ;
			expect(_.contains(state.fieldsById["qCereals"].choiceDestinations, "qCombined2")).toEqual(true) ;
		
		}) 

		it("Should maintain autochoices", function() {

			var response = {
				answers:{
					qName: {text:"Bob"},
					qGender: {choice:"Male"},
					qHobbies: {choices:["a lover"]},
					qCereals: {entries: ["Cocopops", "Fruitloops"]}
				}
			} ;

			var state = SurveyStates.init(schema, response) ;

			expect(_.find(state.fieldsById["qCombined"].autochoices, {name:"Bob"})).not.toBe(undefined) ;
			expect(_.find(state.fieldsById["qCombined"].autochoices, {name:"Male"})).not.toBe(undefined) ;
			expect(_.find(state.fieldsById["qCombined"].autochoices, {name:"Female"})).toBe(undefined) ;

			
			expect(_.find(state.fieldsById["qCombined"].autochoices, {name:"a lover"})).not.toBe(undefined) ;
			expect(_.find(state.fieldsById["qCombined"].autochoices, {name:"a joker"})).toBe(undefined) ;
			expect(_.find(state.fieldsById["qCombined"].autochoices, {name:"a midnight toker"})).toBe(undefined) ;

			expect(_.find(state.fieldsById["qCombined2"].autochoices, {name:"a lover"})).not.toBe(undefined) ;
			expect(_.find(state.fieldsById["qCombined2"].autochoices, {name:"a joker"})).toBe(undefined) ;
			expect(_.find(state.fieldsById["qCombined2"].autochoices, {name:"a midnight toker"})).toBe(undefined) ;

			response.answers["qName"] = {text:"Dave"} ;
			state.handleAnswerChanged("qName") ;

			expect(_.find(state.fieldsById["qCombined"].autochoices, {name:"Bob"})).toBe(undefined) ;
			expect(_.find(state.fieldsById["qCombined"].autochoices, {name:"Dave"})).not.toBe(undefined) ;
			
		})
		

		



});