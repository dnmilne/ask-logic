describe('normalizer', function() {

	var Normalizer ;

	beforeEach(function() {

		module('ask-logic') ;

		inject(function ($injector) {
			Normalizer = $injector.get('Normalizer') ;
		}) ;
	}) ;

	it("Should normalize tricky strings correctly", function() {

		expect(Normalizer.normalize(".Asxkd..0823lm=")).toEqual("asxkd 0823lm") ;
		expect(Normalizer.normalize("   lots of    random\n space")).toEqual("lots of random space") ;

	}) ;




}) ;
