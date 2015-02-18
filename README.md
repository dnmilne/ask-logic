#ask-logic

**ask-logic** is an angular module for processing [ask survey schemas](http://ask.poscomp.org/#/help/schema). The schema defines what fields (e.g. questions, instructions, page breaks) your survey has and the rules for how to flow from one to the next. This module provides the logic that implements that flow (so you tell it what questions have been answered, and it tells you what page you are on, what fields are visible, and whether you are allowed to continue to the next page).

Using this module directly is only necessary if you want full control over how your ask survey looks and feels. If you are happy using our standard look and feel (with a little CSS for theming), then check out [ask-bootstrap](https://github.com/dnmilne/ask-bootstrap).

##Dependencies

This requires

 * [AngularJS](http://angularjs.org/)
 * [Lo-Dash](http://lodash.com)

But that's handled automatically if you install via bower.

##Installation

We assume you are working within an angular app. 

1. Install with bower using `bower install ask-logic`

2. Include `ask-logic.js`, which should be located in `bower_components/ask-logic/`

3. Include the dependency`lodash.min.js` (`bower_components/lodash/dist/`)

4. Add `ask-logic` as a module dependency to your app

##Usage

The source code of [ask-bootstrap](http://github.com/dnmilne/ask-bootstrap) provides fairly clean examples of how to use `ask-logic`. We recommend copying this, and modifying to suit.

###Setting up the schema, response, and state 

Within a controller, set up a `schema` object to store your ask schema. Below we construct it in place, but you are more likely to retrieve it from a server, or load it from a file.

    scope.schema = {
	  "title" : "Simple test survey",
	  "fields" : [ {
	    "id" : "qName",
	    "question" : "What is your name?",
	    "optional" : false,
	    "length" : "SHORT",
	    "type" : "freetext"
	  }, {
	    "id" : "qHappy",
	    "question" : "Are you happy?",
	    "optional" : false,
	    "choices" : [ {
	      "name" : "Yes"
	    }, {
	      "name" : "No"
	    } ],
	    "allowOther" : false,
	    "type" : "singlechoice"
	  }, {
	    "id" : "iGood",
	    "text" : "Good for you!",
	    "type" : "instruction"
	  }, {
	    "id" : "qBadReason",
	    "question" : "Oh no! How come?",
	    "optional" : false,
	    "length" : "LONG",
	    "type" : "freetext"
	  } ],
	  "fieldRules" : [ {
	    "trigger" : {
	      "questionId" : "qHappy",
	      "condition" : "is",
	      "value" : "Yes"
	    },
	    "actions" : [ {
	      "action" : "show",
	      "fieldId" : "iGood"
	    } ]
	  }, {
	    "trigger" : {
	      "questionId" : "qHappy",
	      "condition" : "is",
	      "value" : "No"
	    },
	    "actions" : [ {
	      "action" : "show",
	      "fieldId" : "qBadReason"
	    } ]
	  } ]
	}

Also set up a `response` object, that will store a user's response to this survey. 

    scope.response = {
    	id: "qpwek2l3jk3",
    	surveyId: "simpleTestSurvey",
    	respondentId: "dave@dave.com"
    } ;  

Finally, use the `SurveyStates` service to construct a `state` variable. 

	scope.state = SurveyStates.init(schema, response) ;
	


###Keeping the state informed	

The `state` needs to be kept informed of what is going on. It doesn't listen for changes automatically. 

* Whenever an answer to a question field changes, you should make sure `response`  stores the updated answer, and then call `state.handleAnswerChanged(fieldId)`.
* Whenever the user wants to continue to the next page or complete the survey, you should call 
`state.handleContinue()`. 
* Whenever the user wants to step back to a previous page, you should call
`state.handleBack()`. 
* If the entire `response` object changes (i.e. because you retrieved it from a server), you should call
`state.handleResponseUpdated(response)`. You should only call this when you clobber the `response` entirely. Use the methods above to handle incremental changes to it. 

The `state` assumes the `schema` is immutable, and will never change. If the `schema` changes, then the `state` object will be invalid and bugs are likely. It might be a good idea to set up a watch on the `schema`, and recreate the `state` whenever it changes. 

* **note:** `state` is not a singleton. A new instance is created every time `SurveyStates.init()` is called. This means that you can happily display multiple surveys to the user at once, and have separate `response` and `state` objects for each. 

###Managing the response

The `response` stores a user's progress through the survey; their answers to questions and (for multi-page surveys) the page they are on. So, the process of answering fields should build up a response object like this:

	{
		id: "qpwek2l3jk3",
    	surveyId: "simpleTestSurvey",
    	respondentId: "dave@dave.com",
		answers: {
			"qName":{text:"Dave"},
			"qHappy":{choice:"Yes"}
		},
		tags: ["cohort_1"]
		pageIndex: 0,
		completed: false
	}

The `answers` are a simple map of field ids to answer objects. You are expected to manipulate them directly, so you will probably want them wired to the text inputs, radio buttons and whatnot. 

The `tags` are a simple array of string tags, which you are also free to modify directly. 

You should never directly modify any other part of the response object, however. The state object will take care of that. 


###Managing fields

The `state` provides a list of `fields`, which are clones of the `schema.fields` but with a few extra properties:

 * `field.visible` is set to **false** if the field is not part of the current page, or if it has been hidden by a field rule. The idea is that, to present the survey, you do an `ng-repeat` over all fields, and use `ng-if` or `ng-show` to only present the visible ones. 
 * `field.answered` is set to **true** if the field has been satisfactorily answered.
 * `field.missing` is set to **true** if one has attempted to continue, but has not satisfactorily answered this (mandatory) question. The idea is that you should visibly flag such fields to the user.
 * `field.pageIndex` indicates which page this field is shown with. This is an index into the `state.pages` array described in the next section.  

For each field, you will want to inspect the `field.type` variable to display the appropriate widget (text input, radio buttons, etc). You will also probably want to ignore any fields with `field.type=='pagebreak'` since these get treated a bit differently (below). 


###Managing pages

Pagebreaks are special fields that define where the survey should be split into multiple pages. 

`state.pages` provides an array of these pagebreak fields. If there are any fields specified before the first pagebreak in the schema, then a new (untitled) pagebreak field will be added to the start of this array. 

Each entry of in the array is a field (with `type=pagebreak`), along with a few extra properties:

* `page.pageIndex` is the index of this page in the `state.pages` array
* `page.current` is set to **true** if the user is currently on this page

The index of the user's current page is also stored in `response.pageIndex`, and for convenience the current page is stored in `state.page`





