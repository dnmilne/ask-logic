describe('trigger-states', function() {

	var schema ;

	var TriggerStates ;
	var SurveyStates ;

	beforeEach(module('ask-logic', function($provide) {

	  	$provide.value('$log', console);
	})) ;


	beforeEach(function() {

		inject(function ($injector) {
			TriggerStates = $injector.get('TriggerStates') ;
			SurveyStates = $injector.get('SurveyStates') ;
		}) ;
	}) ;

	beforeEach(function() {

		schema = {
			fields: [
				{
					id:"qFeeling",
					type:"singlechoice", 
					text:"How you doin'?", 
					choices:[
						{name:"Good"},
						{name:"Not so good"}
					]
				},
				{
					id:"qBreakfast",
					type:"multichoice", 
					text:"What did you have for breakfast?", 
					choices:[
						{name:"Cereal"},
						{name:"Toast"},
						{name:"Fruit"},
					]
				},
				{
					id:"qWeetbix",
					type:"numeric", 
					text:"How many weetbix can you handle?",
				},
				{
					id:"qName",
					type:"freetext",
					name:"What is your name?"
				},
				{
					id:"qFavorites",
					type:"multitext",
					name:"What are your favorite cereals?",
					length: "SHORT",
					minEntries: 3
				},
				{
					id:"qMood",
					type:"mood",
					name:"How you doin'?"
				},
				{
					id:"qBreakfastRating",
					type:"rating",
					ratingType:"star",
					length:5
				}

			],
			fieldRules: [],
			pageRules:[]
		}

	}) ;

	it("Should identify question ids in OR triggers", function() {


		var trigger = {
			or : [
				{questionId:'qFeeling', condition:"is", choice:"good"},
				{questionId:'qFeeling', condition:"is", choice:"bad"}
			]
		}

		expect(TriggerStates.getQuestionIds(trigger).length).toEqual(1) ;

	})




	

	it("Should handle singlechoice triggers correctly", function() {

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		response.answers['qFeeling'] = {choice:"Good"} ;

		var trigger = {questionId:'qFeeling', condition:"is", choice:"good"} ;
		expect(TriggerStates.isFired(trigger, state, response)).toBeTruthy() ;

		trigger.condition = "isNot" ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

	}) ;

	it("Should handle multichoice triggers correctly", function() {

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		response.answers['qBreakfast'] = {choices:["Cereal","Fruit"]} ;

		var trigger = {questionId:'qBreakfast', condition:'contains', choice:'fruit'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qBreakfast', condition:'contains', choice:'toast'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		trigger = {questionId:'qBreakfast', condition:'notContains', choice:'fruit'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		trigger = {questionId:'qBreakfast', condition:'notContains', choice:'toast'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

	})

	it("Should handle numeric triggers correctly", function() {

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;


		response.answers['qWeetbix'] = {number:5} ;

		var trigger = {questionId:'qWeetbix', condition:'equal', number:5}
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qWeetbix', condition:'equal', number:4}
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		trigger = {questionId:'qWeetbix', condition:'greaterThan', number:4}
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qWeetbix', condition:'greaterThan', number:5}
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		trigger = {questionId:'qWeetbix', condition:'lessThan', number:6}
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qWeetbix', condition:'lessThan', number:5}
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

	}) 

    it ("Should handle rating triggers correctly", function() {


    	var response = {answers:{}} ;
    	var state = SurveyStates.init(schema, response) ;

    	response.answers['qBreakfastRating'] = {rating:3} ;

    	var trigger = {questionId:'qBreakfastRating', condition:'equal', rating:3} ;
    	expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

    	var trigger = {questionId:'qBreakfastRating', condition:'equal', rating:4} ;
    	expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

    	var trigger = {questionId:'qBreakfastRating', condition:'greaterThan', rating:2} ;
    	expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

    	var trigger = {questionId:'qBreakfastRating', condition:'greaterThan', rating:3} ;
    	expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

    	var trigger = {questionId:'qBreakfastRating', condition:'lessThan', rating:4} ;
    	expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

    	var trigger = {questionId:'qBreakfastRating', condition:'lessThan', rating:3} ;
    	expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

    })

	it ("Should handle freetext triggers correctly", function() {

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		response.answers['qName'] = {text:"David Milne"} ;

		var trigger = {questionId:'qName', condition:'is', text:'david  milne'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qName', condition:'is', text:'dave'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;


		trigger = {questionId:'qName', condition:'isNot', text:'dave'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qName', condition:'isNot', text:'david  milne'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;


		trigger = {questionId:'qName', condition:'contains', text:'milne'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qName', condition:'contains', text:'dave'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;


		trigger = {questionId:'qName', condition:'startsWith', text:'david'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {condition:'startsWith', text:'dave'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;
	}) 

	it ("Should handle multitext triggers correctly", function() {

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		response.answers['qFavorites'] = {entries:["Cocopops", "Fruitloops", "That weird milo cereal"]} ;

		var trigger = {questionId:'qFavorites', condition:'countEquals', count:3} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qFavorites', condition:'countGreaterThan', count:3} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		trigger = {questionId:'qFavorites', condition:'countGreaterThan', count:2} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qFavorites', condition:'countLessThan', count:4} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qFavorites', condition:'countLessThan', count:3} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		trigger = {questionId:'qFavorites', condition:'entryIs', entry:'cocopops'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qFavorites', condition:'entryIs', entry:'milo'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		trigger = {questionId:'qFavorites', condition:'entryContains', entry:'milo'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qFavorites', condition:'entryContains', entry:'weetbix'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		trigger = {questionId:'qFavorites', condition:'entryStartsWith', entry:'coco'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		trigger = {questionId:'qFavorites', condition:'entryStartsWith', entry:'milo'} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;
	}) 


	it ("Should handle mood triggers correctly", function() {

		var satisfied = {name:"satisfied",valence:0.5,arousal:-0.3} ;
		var chill = {name:"chill",valence:0.3,arousal:-0.5} ;
		var comfy = {name:"comfy",valence:0.7,arousal:-0.7} ;
		var depressed = {name:"depressed",valence:-0.7,arousal:-0.7} ;

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		response.answers['qMood'] = {mood:satisfied} ;

		var trigger = {questionId:'qMood', condition:'is',mood:satisfied} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		var trigger = {questionId:'qMood', condition:'isNot',mood:satisfied} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;


		var trigger = {questionId:'qMood', condition:'is',mood:chill} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

		var trigger = {questionId:'qMood', condition:'isNot',mood:chill} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;


		var trigger = {questionId:'qMood', condition:'isNear',mood:chill} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		var trigger = {questionId:'qMood', condition:'isNear',mood:comfy} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;


		var trigger = {questionId:'qMood', condition:'isSameQuadrant',mood:comfy} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(true) ;

		var trigger = {questionId:'qMood', condition:'isSameQuadrant',mood:depressed} ;
		expect(TriggerStates.isFired(trigger, state, response)).toEqual(false) ;

	})


	it("Should handle OR triggers correctly ", function() {

		var trigger = {
			or : [
				{questionId:'qFeeling', condition:"is", choice:"good"},
				{questionId:'qFeeling', condition:"is", choice:"bad"}
			]
		}

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		expect(TriggerStates.isFired(trigger, state)).toEqual(false) ;

		response.answers['qFeeling'] = {choice:"Good"} ;
		expect(TriggerStates.isFired(trigger, state)).toBeTruthy() ;

		response.answers['qFeeling'] = {choice:"Bad"} ;
		expect(TriggerStates.isFired(trigger, state)).toBeTruthy() ;

		response.answers['qFeeling'] = {choice:"Meh"} ;
		expect(TriggerStates.isFired(trigger, state)).toEqual(false) ;

	})


	it("Should handle AND triggers correctly ", function() {

		var trigger = {
			and : [
				{questionId:'qFeeling', condition:"is", choice:"good"},
				{questionId:'qName', condition:"is", text:"dave"}
			]
		}

		var response = {answers:{}} ;
		var state = SurveyStates.init(schema, response) ;

		expect(TriggerStates.isFired(trigger, state)).toEqual(false) ;

		response.answers['qFeeling'] = {choice:"Good"} ;
		expect(TriggerStates.isFired(trigger, state)).toEqual(false) ;

		response.answers['qName'] = {text:"Dave"} ;
		expect(TriggerStates.isFired(trigger, state)).toBeTruthy() ;

	})


}) ;