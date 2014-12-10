describe('trigger-states', function() {

	var TriggerStates ;

	beforeEach(function() {

		module('ask-logic') ;

		inject(function ($injector) {
			TriggerStates = $injector.get('TriggerStates') ;
		}) ;
	}) ;


	it("Should handle singlechoice triggers correctly", function() {

		var field = {
			type:"singlechoice", 
			text:"How you doin'?", 
			choices:[
				{name:"Good"},
				{name:"Not so good"}
			]
		} ;

		var answer = {choice:"Good"} ;

		var trigger = {condition:"is", value:"good"} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toBeTruthy() ;

		trigger.condition = "isNot" ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

	}) ;

	it("Should handle multichoice triggers correctly", function() {

		var field = {
			type:"multichoice", 
			text:"What did you have for breakfast?", 
			choices:[
				{name:"Cereal"},
				{name:"Toast"},
				{name:"Fruit"},
			]
		} ;

		var answer = {choices:["Cereal","Fruit"]} ;

		var trigger = {condition:'contains', value:'fruit'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'contains', value:'toast'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		trigger = {condition:'notContains', value:'fruit'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		trigger = {condition:'notContains', value:'toast'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

	})

	it("Should handle numeric triggers correctly", function() {

		var field = {
			type:"numeric", 
			text:"How many weetbix can you handle?", 
		} ;

		var answer = {number:5} ;

		var trigger = {condition:'equal', value:5}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'equal', value:4}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		trigger = {condition:'greaterThan', value:4}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'greaterThan', value:5}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		trigger = {condition:'lessThan', value:6}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'lessThan', value:5}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

	}) 

	it ("Should handle freetext triggers correctly", function() {

		var field = {
			type:"freetext",
			name:"What is your name?"
		}

		var answer = {text:"David Milne"} ;

		var trigger = {condition:'is', value:'david  milne'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'is', value:'dave'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		trigger = {condition:'isNot', value:'dave'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'isNot', value:'david  milne'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		trigger = {condition:'contains', value:'milne'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'contains', value:'dave'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		trigger = {condition:'startsWith', value:'david'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'startsWith', value:'dave'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;
	}) 

	it ("Should handle mood triggers correctly", function() {

		var field = {
			type:"mood",
			name:"How you doin'?"
		} ;

		var satisfied = {name:"satisfied",valence:0.5,arousal:-0.3} ;
		var chill = {name:"chill",valence:0.3,arousal:-0.5} ;
		var comfy = {name:"comfy",valence:0.7,arousal:-0.7} ;
		var depressed = {name:"depressed",valence:-0.7,arousal:-0.7} ;

		var answer = {mood:satisfied} ;

		var trigger = {condition:'is',value:satisfied} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		var trigger = {condition:'isNot',value:satisfied} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		var trigger = {condition:'is',value:chill} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		var trigger = {condition:'isNot',value:chill} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;


		var trigger = {condition:'isNear',value:chill} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		var trigger = {condition:'isNear',value:comfy} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		var trigger = {condition:'isSameQuadrant',value:comfy} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		var trigger = {condition:'isSameQuadrant',value:depressed} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

	})




}) ;