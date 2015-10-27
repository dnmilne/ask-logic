'use strict';

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        concat: {
            js: {
                options: {
                    banner:
                    'var askjs_core = angular.module(\'askjs.core\', []);\n\n'
                },
                src: ['./src/*.js'],
                dest: './dist/askjs-core.js'
            }
        },
        uglify: {
            js: {
                src: ['./dist/askjs-core.js'],
                dest: './dist/askjs-core.min.js'
            }
        },
        watch: {
            files: [
                './src/*.js'
            ],
            tasks: 'default'
        }
    });

    grunt.registerTask('default', [
        'concat',
        'uglify'
    ]);

};