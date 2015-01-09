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

		var trigger = {condition:"is", choice:"good"} ;
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

		var trigger = {condition:'contains', choice:'fruit'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'contains', choice:'toast'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		trigger = {condition:'notContains', choice:'fruit'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		trigger = {condition:'notContains', choice:'toast'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

	})

	it("Should handle numeric triggers correctly", function() {

		var field = {
			type:"numeric", 
			text:"How many weetbix can you handle?", 
		} ;

		var answer = {number:5} ;

		var trigger = {condition:'equal', number:5}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'equal', number:4}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		trigger = {condition:'greaterThan', number:4}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'greaterThan', number:5}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		trigger = {condition:'lessThan', number:6}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'lessThan', number:5}
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

	}) 

	it ("Should handle freetext triggers correctly", function() {

		var field = {
			type:"freetext",
			name:"What is your name?"
		}

		var answer = {text:"David Milne"} ;

		var trigger = {condition:'is', text:'david  milne'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'is', text:'dave'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		trigger = {condition:'isNot', text:'dave'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'isNot', text:'david  milne'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		trigger = {condition:'contains', text:'milne'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'contains', text:'dave'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		trigger = {condition:'startsWith', text:'david'} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		trigger = {condition:'startsWith', text:'dave'} ;
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

		var trigger = {condition:'is',mood:satisfied} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		var trigger = {condition:'isNot',mood:satisfied} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		var trigger = {condition:'is',mood:chill} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

		var trigger = {condition:'isNot',mood:chill} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;


		var trigger = {condition:'isNear',mood:chill} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		var trigger = {condition:'isNear',mood:comfy} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;


		var trigger = {condition:'isSameQuadrant',mood:comfy} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(true) ;

		var trigger = {condition:'isSameQuadrant',mood:depressed} ;
		expect(TriggerStates.isFired(trigger, field, answer)).toEqual(false) ;

	})




}) ;