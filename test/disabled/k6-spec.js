describe('chatScript', function() {

    var SurveyStates ;
    var AnswerStates ;

    beforeEach(module('askjs.core', function($provide) {

        $provide.value('$log', console);

        jasmine.getJSONFixtures().fixturesPath='base/test/schemas';
        schema = getJSONFixture('k6.json') ;

    })) ;

    beforeEach(

        inject(function ($injector) {
            SurveyStates = $injector.get('SurveyStates') ;
            AnswerStates = $injector.get('AnswerStates') ;
        })
    );

    it("Should update score field", function() {

        var response = {answers:{}} ;
        var state = SurveyStates.init(schema, response) ;

        response.answers["qNervous"] = {rating:1, score:5} ;
        response.answers["qHopeless"] = {rating:1, score:5} ;
        response.answers["qRestless"] = {rating:1, score:5} ;
        response.answers["qDepressed"] = {rating:1, score:5} ;
        response.answers["qEffort"] = {rating:1, score:5} ;
        response.answers["qWorthless"] = {rating:1, score:5} ;

        state.handleResponseUpdated(response) ;

        expect(response.summaries["sDepression"].score).toEqual(30) ;


        response.answers["qNervous"] = {rating:5, score:1} ;
        state.handleFieldChanged("qNervous") ;

        expect(response.summaries["sDepression"].score).toEqual(26) ;


        response.answers["qHopeless"] = {rating:5, score:1} ;
        response.answers["qRestless"] = {rating:5, score:1} ;
        response.answers["qDepressed"] = {rating:5, score:1} ;
        response.answers["qEffort"] = {rating:5, score:1} ;
        response.answers["qWorthless"] = {rating:5, score:1} ;

        state.handleResponseUpdated(response) ;

        expect(response.summaries["sDepression"].score).toEqual(6) ;
        expect(response.summaries["sDepression"].category).toEqual("poor") ;


    })






});