'use strict';

var express = require('express');
var router = express.Router();
var cors = require('cors');
var passport = require('passport');
var multipart = require('connect-multiparty'),
    multipartMiddleware = multipart();


var ctrl = {
    home: require('../controllers/home'),
    common: require('../controllers/common'),
    users: require('../controllers/users'),
};


// define the home page route
router.get('/', ctrl.home.index);


router.post('/api/common/add-data', ctrl.common.postAddData);
// router.post('/api/common/get-data', ctrl.common.getData);
// router.post('/api/common/single-data', ctrl.common.getSingle);    
// router.post('/api/common/edit-data', ctrl.common.getEditData);
// router.post('/api/common/update-data', ctrl.common.postUpdateData);
// router.post('/api/common/update-child-data', ctrl.common.postUpdateChildData);
// router.post('/api/common/delete', ctrl.common.getDeleteData);
// router.get('/api/common/checkUnique', ctrl.common.checkUniqueValidation);
// router.post('/api/common/:key/file-uploads', multipartMiddleware, ctrl.common.commonUploadFile);
// router.get('/tags', ctrl.common.getTagData);



router.get('/logout', ctrl.users.signout);
router.get('/users/me', ctrl.users.me);
router.post('/register', ctrl.users.create);
router.post('/forgot-password', ctrl.users.forgotpassword);
router.post('/reset/:token', ctrl.users.resetpassword);
router.get('/activation/:token/link', ctrl.users.userActivation);
// router.post('/api/user/change-password', ctrl.users.changeUserPassword);
// router.post('/edit/:userId/user', ctrl.users.editUser);
router.get('/loggedin', function(req, res) {
    res.send(req.isAuthenticated() ? req.user : '0');
});


router.post('/login', passport.authenticate('local', {
    failureFlash: true
}), function(req, res) {
    req.session.user = req.user;
    res.send({
        user: req.user,
        redirect: (req.user.roles.indexOf('admin') !== -1) ? req.get('referer') : false
    });
});

module.exports = router;