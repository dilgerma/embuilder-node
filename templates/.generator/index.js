/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator').default;
var slugify = require('slugify');

var config = {}

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);

        this.argument('appname', {type: String, required: false});
    }

    writing() {
        this._generateSkeleton();
    }

    _generateSkeleton() {
        const appName = this.answers.appName;

        this.log(`Generating skeleton app: ${appName}`);

        this.fs.copy(
            this.templatePath('root/**/*'),
            this.destinationPath("."),
            {globOptions: {dot: true}}
        );
    }

}
