#ask-logic

**ask-logic** is an angular module for processing [ask survey schemas](http://ask.poscomp.org/#/help/schema). The schema defines what fields (e.g. questions, instructions, page breaks) your survey has and the rules for how to flow from one to the next. This module provides the logic that implements that flow (so you tell it what questions have been answered, and it tells you what page you are on, what fields are visible, and whether you are allowed to continue to the next page).

Using this module directly is only necessary if you want full control over how your ask survey looks and feels. If you are happy using our standard look and feel (with a little CSS for theming), then check out [ask-bootstrap](https://github.com/dnmilne/ask-bootstrap).

##Dependencies

This requires

 * [AngularJS](http://angularjs.org/)
 * [Underscore.js](http://underscorejs.org/)

But that's handled automatically if you install via bower.

##Installation

We assume you are working within an angular app. 

1. Install with bower using `bower install ask-logic`

2. Include `ask-logic.js`, which should be located in `bower_components/ask-logic/`

3. Include the dependency`underscore-min.js` (`bower_components/underscore`)

4. Add `ask-logic` as a module dependency to your app

##Usage

The source code of [ask-bootstrap]() provides fairly clean examples of how to use `ask-logic`. We recommend copying this, and modifying to suit.

###Setting up the schema, response, and state 

Within a controller, set up a `schema` object to store your ask schema. Below we construct it in place, but you are more likely to retrieve it from a server, or load it from a file.

    scope.schema = {
	  "title" : "Simple test survey",
	  "fields" : [ {
	    "id" : "qName",
	    "text" : "What is your name?",
	    "length" : "SHORT",
	    "type" : "freetext"
	  }, {
	    "id" : "qHappy",
	    "text" : "Are you happy?",
	    "choices" : [ {"name" : "Yes"}, {"name" : "No"} ],
	    "allowOther" : false,
	    "type" : "singlechoice"
	  }, {
	    "id" : "iGood",
	    "text" : "Good for you!",
	    "hidden" : false,
	    "type" : "instruction"
	  }, {
	    "id" : "qBadReason",
	    "text" : "Oh no! How come?",
	    "hidden" : false,
	    "optional" : false,
	    "length" : "LONG",
	    "type" : "freetext"
	  } ],
	  "fieldRules" : [ {
	    "triggers" : [ {
	      "questionId" : "qHappy",
	      "condition" : "is",
	      "value" : "Yes"
	    } ],
	    "actions" : [ {
	      "action" : "show",
	      "fieldId" : "iGood"
	    } ]
	  }, {
	    "triggers" : [ {
	      "questionId" : "qHappy",
	      "condition" : "is",
	      "value" : "No"
	    } ],
	    "actions" : [ {
	      "action" : "show",
	      "fieldId" : "qBadReason"
	    } ]
	  } ]
	}

Also set up a `response` object, that will store a user's response to this survey. This is just a blank object, unless you want some of the fields to be pre-populated.

    scope.response = {} ;    

Finally, use the `SurveyStates` service to construct a `state` variable. 

	scope.state = SurveyStates.init(schema, response) ;


###Keeping the state informed	

This state object needs to be kept informed of what is going on. It doesn't listen for changes automatically. 

* Whenever an answer to a question field changes, you should make sure the response object stores the updated answer, and then call `state.handleAnswerChanged(fieldId)`.
* Whenever the user wants to continue to the next page or complete the survey, you should call 
`state.handleContinue()`. 
* Whenever the user wants to step back to a previous page, you should call
`state.handleBack()`. 

The state object assumes the schema is immutable, and will never change. If you do change it, then you should create a new state object. 


###Managing the response

The response object stores the users' progress through the survey; their answers to questions and (for multi-page surveys) the page they are on. So, the process of answering fields should produce a response object like this:

	{
		answers: {
			"qName":{text:"Dave"},
			"qHappy":{choice:"Yes"}
		},
		pageIndex: 0,
		completed: false
	}

The `answers` are a simple map of field ids to answer objects. You are expected to manipulate them directly, so you will probably want them wired to the text inputs, radio buttons and whatnot. 

You should never directly modify any other part of the response object, however. The state object will take care of that. 


###Managing fields

The `state` provides a list of `fields`, which are clones of the `schema.fields` but with a few extra properties:

 * `field.visible` is set to **false** if the field is not part of the current page, or if it has been hidden by a field rule. The idea is that your survey page should contain ALL fields, and use `ng-hide` to hide the ones that aren't currently visible.
 * `field.answered` is set to **true** if the field has been satisfactorily answered.
 * `field.missing` is set to **true** if one has attempted to continue, but has not satisfactorily answered this (mandatory) question. The idea is that you should visibly flag such fields to the user.
 * `field.pageIndex` indicates which page this field is shown with. This is an index into the `scope.pages` array described in the next section.  

For each field, you will want to inspect the `field.type` variable to display the appropriate widget (text input, radio buttons, etc). You will also probably want to ignore any fields with `field.type=='pagebreak'` since these get treated a bit differently (below). 


###Managing pages

Page breaks are special fields that you probably always want to hide. These define where the survey should be split into multiple pages. 

`state.pages` provides an array of these pagebreak fields. If there are any fields specified before the first pagebreak in the schema, then a new (untitled) pagebreak field will be added to the start of this array. 

Each entry of in the array is a field (with `type=pagebreak`), along with a few extra properties:

* `page.pageIndex` is the index of this page in the `state.pages` array
* `page.current` is set to **true** if the user is currently on this page

The index of the current page is also stored in `scope.response.pageIndex`


###Extra notes

* The `state` is not a singleton. A new instance is create every time `SurveyStates.init()` is called. This means that you can happily display multiple surveys to the user at once, and have separate `response` and `state` objects for each. 

* The `state` never manipulates the `schema`, and assumes it is immutable. If the `schema` changes, then the `state` object will be invalid and bugs are likely. It might be a good idea to set up a watch on the `schema`, and recreate the `state` whenever it changes. 







