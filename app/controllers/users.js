'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    users = require('../models/user'),
    User = mongoose.model('User'),
    async = require('async'),
    hbs = require('hbs'),
    fs = require('fs'),
    crypto = require('crypto'),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    expressValidator = require('express-validator');

/**
 * Auth callback
 */

exports.authCallback = function(req, res) {
    res.redirect('/');
};

/**
 * Send reset password email
 */

function sendMail(mailOptions) {
    var transport = nodemailer.createTransport(smtpTransport({
        host: 'smtp.mandrillapp.com',
        port: 587,
        auth: {
            user: 'jsbhalodia.dev@gmail.com',
            pass: '7nydSeBrxMHrEkfPiMvJ_g'
        }
    }));
    transport.sendMail(mailOptions, function(err, response) {
        if (err) return err;
        return response;
    });
};

/**
 * Edit user
 */

exports.editUser = function(req, res) {

    // because we set our user.provider to local our models/user.js validation will always be true
    req.assert('first_name', 'You must enter a first name').notEmpty();
    req.assert('last_name', 'You must enter a last name').notEmpty();
    // req.assert('email', 'You must enter a valid email address').isEmail();
    // req.assert('username', 'Username cannot be more than 20 characters').len(1, 20);

    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }

    User.update({
            '_id': req.params.userId
        },
        req.body
    ).exec(function(err, result) {
        if (result) {
            return res.json({
                status: true,
                message: 'Your Profile has been updated successfully'
            });
        }
        return res.json({
            status: false,
            message: 'Your Profile has been updated successfully'
        });
    });
};


exports.userActivation = function(req, res) {
    User.update({
        '_id': req.params.token
    }, {
        isActivate: true
    }).exec(function(err, result) {

        if (err) {
            res.json({
                status: false
            });
            return res.redirect('/');
        }
        return res.redirect('/');
    });
}

/**
 * Show login form
 */

exports.signin = function(req, res) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.redirect('#!/login');
};

/**
 * Logout
 */
exports.signout = function(req, res) {

    if (res.session && res.session.user) {
        res.session.user = undefined;
    }

    req.logout();
    // res.redirect('/');
    /*res.end();*/
    req.session.destroy(function(err) {
        res.redirect('/'); //Inside a callback… bulletproof!
    });


};

/**
 * Session
 */

exports.session = function(req, res) {
    res.redirect('/');
};

/**
 * Create user
 */

exports.create = function(req, res, next) {
    var user = new User(req.body);

    user.provider = 'local';

    // because we set our user.provider to local our models/user.js validation will always be true
    req.assert('first_name', 'You must enter a firstname').notEmpty();
    req.assert('last_name', 'You must enter a lastname').notEmpty();
    req.assert('email', 'You must enter a valid email address').isEmail();
    // req.assert('password', 'Password must be between 8-20 characters long').len(8, 20);
    req.assert('password', 'Password too').len(8, 20);

    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }

    // Hard coded for now. Will address this with the user permissions system in v0.3.5
    user.roles = ['admin'];
    user.save(function(err, result) {
        if (err) {
            switch (err.code) {
                case 11000:
                case 11001:
                    res.status(400).json([{
                        msg: 'Username already taken',
                        param: 'username'
                    }]);
                    break;
                default:
                    var modelErrors = [];

                    if (err.errors) {

                        for (var x in err.errors) {
                            modelErrors.push({
                                param: x,
                                msg: err.errors[x].message,
                                value: err.errors[x].value
                            });
                        }

                        res.status(400).json(modelErrors);
                    }
            }

            return res.status(400);
        }

        req.logIn(user, function(err) {
            if (err) return next(err);

            var mailOptions = {
                to: user.email,
                from: 'jsbhalodia.dev@gmail.com'
            };

            fs.readFile(__dirname + '/../views/signup-user-activation.html', 'utf8', function(err, htmlData) {

                var template = hbs.compile(htmlData);

                var compiledHTML = template({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    token: user._id,
                    host: req.headers.host
                });

                mailOptions.html = compiledHTML;

                sendMail(mailOptions);
            });


            return res.redirect('/');
        });
        res.status(200);
    });
};

/**
 * Send User
 */
exports.me = function(req, res) {
    res.json(req.user || null);
};

/**
 * Find user by id
 */
exports.user = function(req, res, next, id) {
    User
        .findOne({
            _id: id
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to load User ' + id));
            req.profile = user;
            next();
        });
};

/**
 * Change the password
 */

exports.changeUserPassword = function(req, res, next) {

    User.findOne({
        _id: req.body.userId
    }, function(err, user) {
        if (err) {
            return res.status(400).json({
                msg: err
            });
        }
        if (!user) {
            return res.status(400).json({
                msg: 'Unknown user'
            });
        }
        if (!user.authenticate(req.body.userOldPassword)) {
            return res.status(400).json({
                msg: 'Invalid password'
            });
        }

        req.assert('userNewPassword', 'New password must be between 8-20 characters long').len(8, 20);
        req.assert('userConfirmPassword', 'Passwords do not match').equals(req.body.userNewPassword);

        var errors = req.validationErrors();
        if (errors) {
            return res.status(400).send(errors);
        }

        user.password = req.body.userNewPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save(function(err) {
            req.logIn(user, function(err) {
                if (err) return next(err);
                return res.send({
                    user: user,
                });
            });
        });
    });
};


/**
 * Resets the password
 */

exports.resetpassword = function(req, res, next) {

    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, function(err, user) {
        if (err) {
            return res.status(400).json({
                msg: err
            });
        }
        if (!user) {
            return res.status(400).json({
                msg: 'Token invalid or expired'
            });
        }
        req.assert('password', 'Password must be between 8-20 characters long').len(8, 20);
        req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
        var errors = req.validationErrors();
        if (errors) {
            return res.status(400).send(errors);
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save(function(err) {
            req.logIn(user, function(err) {
                if (err) return next(err);
                return res.send({
                    user: user
                });
            });
        });
    });
};

/**
 * Callback for forgot password link
 */
exports.forgotpassword = function(req, res, next) {
    async.waterfall([

            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                User.findOne({
                    $or: [{
                        email: req.body.text
                    }, {
                        username: req.body.text
                    }]
                }, function(err, user) {
                    if (err || !user) return done(true);
                    done(err, user, token);
                });
            },
            function(user, token, done) {
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                user.save(function(err) {
                    done(err, token, user);
                });
            },
            function(token, user, done) {
                var mailOptions = {
                    to: user.email,
                    from: 'jsbhalodia.dev@gmail.com'
                };


                fs.readFile(__dirname + '/../views/forgot-password.html', 'utf8', function(err, htmlData) {

                    var template = hbs.compile(htmlData);

                    var compiledHTML = template({
                        first_name: user.first_name,
                        last_name: user.last_name,
                        token: token,
                        host: req.headers.host
                    });

                    mailOptions.html = compiledHTML;

                    sendMail(mailOptions);
                });

                done(null, true);
            }
        ],
        function(err, status) {
            var response = {
                message: 'Mail successfully sent',
                status: 'success'
            };
            if (err) {
                response.message = 'User does not exist';
                response.status = 'danger';
            }
            res.json(response);
        }
    );
};