'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	async = require('async'),
	uid = require('uid'),
	fs = require('fs'),
	// config = require('meanio').loadConfig(),
	users = require('../models/user'),
  	User = mongoose.model('User'),
	tagsObj = require('../models/tags');

var filePath = {
	1: __dirname + '/../../public/assets/uploads/users/'
};

/**
 * Send reset password email
 */

function sendMail(mailOptions) {
	var transporter = nodemailer.createTransport({
	    service: 'gmail',
	    auth: {
	        user: 'ajudiyatejas@gmail.com',
	        pass: 't9712210715'
	    }
	});

	transporter.sendMail(mailOptions, function(err, response) {
		if (err) return err;
		return response;
	});
};

// --
// Get Common Single Data

exports.getSingle = function(req, res) {

	if (!req.body.model || !req.body._id) {
		res.json([]);
		return;
	}

	var commonModel = mongoose.model(req.body.model);

	commonModel.findById(req.body._id, function(err, result) {
		switch(req.body.model) {
			case 'Tours':
				var beaconsModel = mongoose.model('beacons');
				var tourLoop = 0;
				if (result) {

					var resMiddle =  function(results) {
						var userIds = [];
						if (results.associates) {
							for (var row in results.associates) {
								userIds.push(results.associates[row].user_id);
							}
						}

						User.find({
							_id: { $in: userIds }
						}).exec(function(err, userD) {

							if (userD) {
								for (var uRow in userD) {
									for (var row in results.associates) {
										if (results.associates[row].user_id == userD[uRow]._id) {
											results.associates[row].assoFirstName = userD[uRow].first_name;
											results.associates[row].assoLastName = userD[uRow].last_name;
											results.associates[row].email = userD[uRow].email;
										}
									}
								}
							}

							res.json(results);
						});
					}

					if(result.pointsofInterests && result.pointsofInterests.length) {

						var fetcbBeacon = function() {

							if(tourLoop == result.pointsofInterests.length) {
								resMiddle(result);
								return;
							}

							beaconsModel.findOne({'_id' : result.pointsofInterests[tourLoop].beaconsIds}, function(err, beaconsResult) {

								result.pointsofInterests[tourLoop].beaconData = beaconsResult;
								tourLoop += 1;
								fetcbBeacon();
							});
						}

						// --

						fetcbBeacon();

					} else {
						
						resMiddle(result);
					}
				}
				break;
			default:
				res.json(result);
				break;
		}
		return;
	});
};

// --
// Get Common All Data

exports.getData = function(req, res) {

	if (!req.body.model) {
		res.json([]);
		return;
	}

	if(!(req.user && req.user._id)) {
		res.json([]);
		return;
	}

	var commonModel = mongoose.model(req.body.model);

	commonModel.find().exec(function(err, responseData) {

		if(err) {
			res.json({
				status: false,
				data: responseData
			});
			return;
		}

		res.json(responseData);
		return;
	});
};

// --
// Common file upload method

exports.commonUploadFile = function(req, res) {

	var fileObject = req.files.file,
		destinationpath = filePath[req.params.key];

	// --

	var extArray = fileObject.originalFilename.split('.');
	var ext = extArray[extArray.length - 1];
	var fileName = uid(10) + '.' + ext;

	fs.readFile(fileObject.path, function(err, data) {

		if(err) {
			res.send(err);
			return;
		}

		var newPath = destinationpath + fileName;

		fs.writeFile(newPath, data, function(err) {
			if (err) {
				res.send(err);
				return;
			}
			res.send({
				original: req.files.file.name,
				image: fileName,
				status: true
			});
			return;
		});
	});

};

/**
 * update child Record
 */
exports.postUpdateChildData = function(req, res) {
	
	if (!req.body.model || !req.body.entityId) {
		return res.json([]);
	}

	var commonModel = mongoose.model(req.body.model);

	// Add Specific Trigger & Filter mongoose Id
	if(req.body.model == 'Tours') {
		if(req.body.trigger) {
			for(var editpoiTrigerKey in req.body.trigger) {
				if(!req.body.trigger[editpoiTrigerKey]._id) {
					req.body.trigger[editpoiTrigerKey]._id = mongoose.Types.ObjectId(uid(12));
				}

				for(var editpoiFilterKey in req.body.trigger[editpoiTrigerKey].filter) {
					if(!req.body.trigger[editpoiTrigerKey].filter[editpoiFilterKey]._id) {
						req.body.trigger[editpoiTrigerKey].filter[editpoiFilterKey]._id = mongoose.Types.ObjectId(uid(12));
					}
				}
			}
		}
	}

	if (req.body.entityKey == 'tourCategory') {
		req.body.userId = req.user._id;
		delete req.body.model;
	}

	var entityId = req.body.entityId,
		childEntityId = req.body.childEntityId,
		entityKey = req.body.entityKey;

	delete req.body.entityId;
	delete req.body.childEntityId;
	delete req.body.entityKey;

	// --

	var saveData = function() {

		var updateData = {};
		for (var row in req.body) {
			updateData[row] = req.body[row];
		}

		var condition = {
			_id: entityId
		};

		var pull = {};
		pull[entityKey] = {
			_id: mongoose.Types.ObjectId(childEntityId)
		}

		var push = {};
		updateData._id = mongoose.Types.ObjectId(childEntityId);
		push[entityKey] = updateData;

		commonModel.update({
			'_id': entityId
		}, {
			$pull: pull
		}).exec(function(err, result) {

			if (err) {
				res.json({
					status: false,
					err: err
				});
				return;
			}

			// --

			commonModel.update({
				'_id': entityId
			}, {
				$push: push
			}).exec(function(err, result) {

				if (err) {
					res.json({
						status: false,
						err: err
					});
					return;
				}

				// --

				var sendRS = function() {
					res.json({
						status: true,
						result: updateData
					});
				}

				switch(entityKey) {
					case 'pointsofInterests':

						if(updateData.beaconsIds) {
							var beaconsDataModel = mongoose.model('beacons');
							beaconsDataModel.findOne({'_id' : updateData.beaconsIds}).exec(function(err, singleBeaconsData) {
								updateData.beaconData = singleBeaconsData;
								sendRS();
								return;
							});
						} else {
							updateData.beaconData = '';
							sendRS();
							return;
						}

					break;
						default:
						sendRS();
						break;
				}
				return;
			});
		});

		// commonModel.update(condition, {
		// 		$set: updateData
		// 	}, {
		// 		upsert: true
		// 	},
		// 	function(err, status) {

		// 		console.log('err > ', err);
		// 		console.log('status > ', status);

		// 		if(!err) {
		// 			res.send({
		// 				status: false,
		// 				err: err,
		// 				result: status
		// 			});
		// 			return;
		// 		}

		// 		res.send({
		// 			status: true,
		// 			result: status
		// 		});
		// 	});
	}

	// --
	if (req.body.tags) {
		getDynamicTagsByName(req.body.tags, function(tags) {
			req.body.tags = tags;
			saveData();
		});
	} else {
		saveData();
	}
}

// --
// update Main Record
exports.postUpdateData = function(req, res) {

	if (!req.body.model || !req.body.entityId) {
		return res.json([]);
	}

	var commonModel = mongoose.model(req.body.model);

	if (req.body.entityKey && req.body.entityKey == 'updateAssociate') {


		var updateAction = function() {
			commonModel.update({
				'_id': req.body.entityId
			}, {
				$pull: {
					associates: {
						'_id': mongoose.Types.ObjectId(req.body.associateId)
					}
				}
			}).exec(function(err, result) {

				commonModel.update({
					'_id': req.body.entityId
				}, {
					$push: {
						associates: {
							_id: mongoose.Types.ObjectId(req.body.id),
							assoFirstName: req.body.assoFirstName,
							assoLastName: req.body.assoLastName,
							email: req.body.email,
							role: req.body.role,
							categoryIds: req.body.categoryIds,
							image: req.body.image,
							tags: req.body.tags
						}
					}
				}).exec(function(err, result) {
					if (err) {
						res.json({
							status: false
						});
						return;
					}

					res.json({
						status: true,
						responseIds: req.body.entityId
					});
					return;
				});
			});
		}

		// --

		if (req.body.tags && req.body.tags.length) {
			getDynamicTagsByName(req.body.tags, function(tags) {
				req.body.tags = tags;
				updateAction();
			});
		} else {
			updateAction();
		}
	}

	if (req.body.entityKey && req.body.entityKey == 'editPointsofInterests') {

		var updateAction = function() {

			commonModel.update({
				'_id': req.body.entityId
			}, {
				$pull: {
					pointsofInterests: {
						'_id': mongoose.Types.ObjectId(req.body.pointOfInsId)
					}
				}
			}).exec(function(err, result) {

				commonModel.update({
					'_id': req.body.entityId
				}, {
					$push: {
						pointsofInterests: {
							_id: mongoose.Types.ObjectId(req.body.id),
							name: req.body.name,
							description: req.body.description,
							contentDescription: req.body.contentDescription,
							tags: req.body.tags,
							categoryIds: req.body.categoryIds
						}
					}
				}).exec(function(err, result) {
					if (err) {
						res.json({
							status: false
						});
						return;
					}

					res.json({
						status: true,
						responseIds: req.body.entityId
					});
					return;
				});
			});
		}

		// --

		if (req.body.tags && req.body.tags.length) {
			getDynamicTagsByName(req.body.tags, function(tags) {
				req.body.tags = tags;
				updateAction();
			});
		} else {
			updateAction();
		}
	}
}

/**
 * Get Tags Id by Name of array
 * @param  {Array}
 */
var getDynamicTagsByName = function(names, cb) {

	if (!(names && names.length)) {
		cb([]);
		return;
	};

	var returns = [];
	var loopInc = 0;
	var loops = function() {

		if (names.length <= loopInc) {
			cb(returns);
			return;
		}

		// --

		names[loopInc].text = names[loopInc].text.toLowerCase();

		TagsModel.find({
			name: names[loopInc].text
		}).exec(function(err, tags) {

			if (tags && tags.length) {
				returns[returns.length] = tags[0]._id;
				loopInc += 1;
				loops();
			} else {
				var tagsFormData = new TagsModel({
					name: names[loopInc].text
				});
				tagsFormData.save(function(err, tag) {
					returns[returns.length] = tag._id;
					loopInc += 1;
					loops();
				});
			}
		});
	}

	loops();
};

// --
// Add Common All Data

exports.postAddData = function(req, res) {

	// if model is not default as input
	// lets say tata!
	if (!req.body.model) {
		res.json([]);
		return;
	}

	// create model obj
	var commonModel = mongoose.model(req.body.model);


	// clear the model value
	// we are sure its extra field
	req.body.model = '';

	// #Filter stuff
	// #Permission logic
	// #remove extra fields

	// Save data in main collection
	if (!req.body.isChildInsert) {

		var insertP = function()  {

			// Common Action to save data
			var commonFormData = new commonModel(req.body);

			commonFormData.save(function(err, result) {

				if (err) {
					res.json({
						status: false
					});
					return;
				}

				// Create Tour [x] purchase checkbox logic
				// @todo its only for PoC, we will remove it for real prod

				res.json({
					status: true,
					result: result
				});
			});
			return;
		}

		if (req.body.tags) {
			getDynamicTagsByName(req.body.tags, function(tags) {
				req.body.tags = tags;

				insertP();
			});
		} else {
			insertP();
		}
	}

	// --
	// @param isChildInsert = true
	// @param entityId
	// @param entityKey

	if (req.body.isChildInsert) {
		// define temp vars so we could empty value of
		// body.* extra action vars
		var entityId = req.body.entityId,
			entityKey = req.body.entityKey,
			pushData = {};

		// assign default _id mongoObj
		req.body._id = mongoose.Types.ObjectId(uid(12));

		// clear data which passed for action purpose
		delete req.body.entityId;
		delete req.body.entityKey;

		var tempTags = [];
		var saveTagDataStatus = 0;

		var finalProcess = function() {

			pushData = req.body;
			pushData._id = mongoose.Types.ObjectId(uid(12));

			// --
			// Insert new child

			commonModel.findOne({ _id : entityId }, function(err, data) {
				if (data) {

					data[entityKey].push(req.body);

					data.save(function(err, data) {

						if (err) {
							res.json({
								status: false,
								err: err
							});
						}
						// --

						res.json({
							status: true,
							result: pushData
						});
					});
				} else {
					res.json({
						status: false,
						err: err
					});
				}
			});
		};

		// --

		if (req.body.tags && req.body.tags.length) {
			getDynamicTagsByName(req.body.tags, function(tags) {
				req.body.tags = tags;
				finalProcess();
			});
		} else {
			finalProcess();
		}
	}
}

// --
// Delete Common All Data

exports.getDeleteData = function(req, res) {

	if (!req.body.model || !req.body._id) {
		res.json([]);
		return;
	}

	var commonModel = mongoose.model(req.body.model);

	if (req.body.entityKey && req.body.entityKey == 'deletePointsofInterests') {

		commonModel.update({
			'_id': req.body._id
		}, {
			$pull:{
				pointsofInterests: {
						'_id': mongoose.Types.ObjectId(req.body.pointOfInsId)
				}
			}

		}).exec(function(err, result) {
			if (err) {
				res.json({
					status: false
				});
				return;
			}

			res.json({
				status: true,
				responseIds: req.body._id
			});
			return;
		});

	} else if (req.body.entityKey && req.body.entityKey == 'deleteAssociate') {

		commonModel.update({
			'_id': req.body._id
		}, {
			$pull: {
				associates: {
					'_id': mongoose.Types.ObjectId(req.body.associateId)
				}
			}
		}).exec(function(err, result) {
			if (err) {
				res.json({
					status: false
				});
				return;
			}

			res.json({
				status: true,
				responseIds: req.body._id
			});
			return;
		});

	} else {

		// Delete common Data
		commonModel.findOne({ _id: req.body._id, userId: req.user._id}).remove(function(err, result) {
			if (err) {
				res.json({
					status: false
				});
				return;
			}

			res.json({
				status: true,
				responseIds: req.body._id
			});
			return;
		});
	}
};


// --
// Get Tags Data
exports.getTagData = function(req, res) {

	var regex = new RegExp(req.query['query'], 'i');
	TagsModel.find({
		name: regex
	}).exec(function(err, result) {
		if (err) {
			res.json({
				status: false
			});
			return;
		}
		res.json({
			status: true,
			result: result
		});
		return;
	});
}
