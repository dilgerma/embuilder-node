/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator')

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);
    }

    writing() {
        this._generateSkeleton();
    }

    _generateSkeleton() {
        this.fs.copy(
            this.templatePath('root/**/*'),
            this.destinationPath("."),
            {globOptions: {dot: true}}
        );
    }

}
