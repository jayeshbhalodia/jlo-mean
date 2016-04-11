'use strict';

/**
 * Module dependencies.
 */
var mongoose  = require('mongoose'),
    Schema    = mongoose.Schema;

var TagsSchema = new Schema({
	name:String
});

mongoose.model('Tags', TagsSchema);