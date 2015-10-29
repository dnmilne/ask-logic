/*
    functions for calculating scores
 */


askjs_core.factory('ScoreCalculator', ['Logger','AnswerStates', 'Normalizer', function(Logger, AnswerStates, Normalizer) {

    function getForSinglechoice(field, answer) {

        var choice = _.find(field.choices, function(choice) {
            return Normalizer.normalize(choice.name) == Normalizer.normalize(answer.choice) ;
        }) ;

        if (!choice) {
            Logger.warn("Could not find choice " + field.choice) ;
            return undefined ;
        }

        return choice.weight ;
    }

    function getRangeForSinglechoice(field) {

        var range = [null,null] ;

        if (field.optional) {
            range[0] = 0;
            range[1] = 0;
        }

        _.each(field.choices, function(choice) {
            if (range[0] == null || choice.weight < range[0])
                range[0] = choice.weight ;

            if (range[1] == null || choice.weight > range[1])
                range[1] = choice.weight ;

        }, this) ;

        return range ;
    }

    function getForMultichoice(field, answer) {

        var answerChoices = Normalizer.normalizeAll(answer.choices) ;

        var weight = 0 ;

        _.each(field.choices, function(choice) {

            if (_.contains(answerChoices, Normalizer.normalize(choice.name))){
                weight = weight + choice.weight ;
            }

        }, this) ;

        return weight ;
    }

    function getRangeForMultichoice(field, answer) {

        var range = [null,null] ;

        if (field.optional) {
            range[0] = 0;
            range[1] = 0;
        }

        _.each(field.choices, function(choice) {

            if (choice.weight >= 0) {

                if (range[0] == null || choice.weight < range[0])
                    range[0] = choice.weight;

                if (range[1] == null)
                    range[1] = choice.weight ;
                else
                    range[1] = range[1] + choice.weight ;

            } else {

                if (range[0] == null)
                    range[0] = choice.weight;
                else
                    range[0] = range[0] + choice.weight ;

                if (range[1] == null || choice.weight > range[1])
                    range[1] = choice.weight;
            }

        }, this) ;

        return range ;
    }

    function getForRating(field, answer) {
        return field.weights[answer.rating -1] ;
    }

    function getRangeForRating(field) {

        var range = [null,null] ;

        if (field.optional) {
            range[0] = 0;
            range[1] = 0;
        }

        _.each(field.weights, function(weight) {

            if (range[0] == null || weight < range[0])
                range[0] = weight ;

            if (range[1] == null || weight > range[1])
                range[1] = weight ;

        }) ;
    }

    function getRangeForScore(field, survey) {


        //motherRelation only shown if mother:yes
        //so, score for mother:!yes cannot be combined with score for motherRelation:any
        //so, score is widest of range[mother:no] and range[mother:!yes + motherRelation:any]

        //for every field rule that effects visibility of a source field,


        //


        //then try every purmutation of rules

        var relevantFieldRuleIndexes = [] ;

        _.each(field.sources, function(source){

            var sourceField = survey.fieldsById[source.id];

            _.each(sourceField.affectingShowFieldRules, function(rule) {
                relevantFieldRuleIndexes.push(rule.index) ;
            }, this) ;

            _.each(sourceField.affectingHideFieldRules, function(rule) {
                relevantFieldRuleIndexes.push(rule.index) ;
            }, this) ;

        }, this) ;

        relevantFieldRuleIndexes = _.uniq(relevantFieldRuleIndexes) ;
        console.log(field.id + " is effected by rules [" + relevantFieldRuleIndexes.join(",") + "]") ;


        //generate all possible permutations for whether these rules are fired or not.







    }

    function getNormalizedScore(score, field) {

        var normScore = score ;

        if (normScore < field.range[0])
            normScore = field.range[0] ;

        if (normScore > field.range[1])
            normScore = field.range[1] ;

        return normScore ;
    }


    function getPercent(score, field) {

        var normScore = getNormalizedScore(score, field) ;
        return ((normScore - field.range[0]) / (field.range[1] - field.range[0])) * 100 ;
    }

    function getCategoryNormalizedPercent(score, field) {

        if (!field.categories || !field.categories.length)
            return ;

        var normScore = getNormalizedScore(score, field) ;

        var categoryPercent = 1/ field.categories.length ;

        var categoryNormalizedPercent = 0 ;

        _.each(field.categories, function(category, index) {

            //console.log(score + " [" + )

            var catWidth = category.range[1] - category.range[0] ;

            if (index < (field.categories.length-1))
                catWidth = catWidth+1;

            if (score <= category.range[0]) {
                return;
            } else if (score > category.range[1]) {
                categoryNormalizedPercent = categoryNormalizedPercent + categoryPercent ;
            } else {
                var withinCategoryPercentage = (score - category.range[0]) / catWidth ;
                categoryNormalizedPercent = categoryNormalizedPercent + (withinCategoryPercentage * categoryPercent) ;
            }

        }, this) ;

        return categoryNormalizedPercent * 100 ;
    }

    function getCategory(score, field) {

        if (!field.categories || !field.categories.length)
            return ;

        var normScore = getNormalizedScore(score, field) ;

        var category = _.findLast(field.categories, function(cat) {

            return normScore >= cat.range[0] && normScore <= cat.range[1] ;

        }) ;

        if (category)
            return category.id ;
    }


    return {

        getScoreForQuestion: function(field, answer) {

            if (!AnswerStates.isAnswered(field, answer))
                return 0 ;

            switch (field.type) {

                case "singlechoice":
                    return getForSinglechoice(field, answer) ;
                case "multichoice":
                    return getForMultichoice(field, answer) ;
                case "rating":
                    return getForRating(field, answer) ;
            }

        },

        getScoreSummary: function(score, field) {

            var summary = {
                score: score,
                percent: getPercent(score, field),
                categoryNormalizedPercent:getCategoryNormalizedPercent(score, field)
            } ;

            var category = getCategory(score, field) ;

            if (category)
                summary.category = category ;

            return summary ;
        }

    }



}]) ;