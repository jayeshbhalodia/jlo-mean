 'use strict';

dbMfgModule.controller('UserController', ['$scope', 'Global', '$http', '$location', '$uibModal', '$stateParams', '$rootScope', 'alertService', '$timeout',
     function($scope, Global, $http, $location, $uibModal, $stateParams, $rootScope, alertService, $timeout) {
         $scope.global = Global;


         // -- Init bg

         $scope.init = function() {
             $('body').addClass('body-wide body-auth');


         };

         // --
         // Provacca Side bar Add Active class
         $rootScope.getClass = function(path) {
             if ($location.path().substr(0, path.length) == path) {
                 $rootScope.pageId = $location.path().replace("/", "");
                 return "active"
             } else {
                 return ""
             }
         }

         // --
         // Get logged in

         $scope.user = {};
         $scope.isLoginFormSubmitted = false;
         $scope.login = function() {

             // Check form is valid or not, if not than return
             if (!$scope.loginForm.$valid) {
                 $scope.isLoginFormSubmitted = true;
                 return;
             }
             $scope.isLoginBtnDisabled = true;

             $http.post('/login', {
                 email: $scope.user.email,
                 password: $scope.user.password
             }).success(function(response) {

                console.log('response', response);

                 $rootScope.user = response.user;
                 alertService.flash('success', 'User has been successfully logged in', true);
                 $rootScope.$emit('loggedin');
                 window.location = '/';
             }).error(function(data, header, status, config) {
                 if (data == 'Unauthorized') {
                     $scope.isLoginFormSubmitted = false;
                     alertService.flash('error', 'User not found.', true);
                     $scope.user.email = '';
                     $scope.user.password = '';
                     $location.path('login');
                 }
             });
         };


         // --
         // User Logout

         $scope.userLogout = function() {                
             setTimeout(function() {
                window.location = '/logout';
             }, 1000);
         };

         // --
         // Register

         $scope.isRagisterUserFormSubmitted = false;
         $scope.isRagisterBtnDisabled = false;
         $scope.register = function() {

             // Check form is valid or not, if not than return
             $scope.isRagisterUserFormSubmitted = false;
             if (!$scope.registerForm.$valid) {
                $scope.passwordWrong = '';
                 $scope.isRagisterUserFormSubmitted = true;
                 return;
             }

             $scope.isRagisterBtnDisabled = true;
             $http.post('/register', {
                 first_name: $scope.user.first_name,
                 last_name: $scope.user.last_name,
                 email: $scope.user.email,
                 password: $scope.user.password,
             }).success(function() {
                 setTimeout(function() {
                     $('body').removeClass('body-wide body-auth');
                 }, 500);
                 $scope.isRagisterBtnDisabled = true;
                 alertService.flash('success', 'User has been registered successfully ', true);
                 setTimeout(function() {
                     window.location = '#!login';
                 }, 500);
                 // $location.path('login');
             }).error(function(error) {
                 $scope.isRagisterBtnDisabled = false;
                 for (var key in error) {
                     if (error[key].param == 'password') {

                        if (error[key].value.length < 8) {
                            $scope.passwordWrong = error[key].msg + ' short';
                        }
                        if (error[key].value.length > 20) {
                            $scope.passwordWrong = error[key].msg + ' long';
                        }
                         // $scope.user.password = '';
                     }
                 };
                 // Error: authentication failed
                 if (error === 'Username already taken') {
                     // UserName already taken
                 } else if (error === 'Email already taken') {
                     // Email already taken
                 } else {
                     // password error
                 }
             });
         };

         // --
         // Recover password

         $scope.isForgotPasswordFrmSubmitted = false;
         $scope.isForgotPasswordBtnDisabled = false;
         $scope.forgotpassword = function() {

             // Check form is valid or not, if not than return
             if (!$scope.forgotPasswordForm.$valid) {
                 $scope.isForgotPasswordBtnDisabled = false;
                 $scope.isForgotPasswordFrmSubmitted = true;
                 return;
             }
             $scope.isForgotPasswordBtnDisabled = true;
             $http.post('/forgot-password', {
                 text: $scope.user.email
             }).success(function(response) {
                 if (response.status == 'danger') {
                     alertService.flash('error', response.message, true);
                     $scope.isForgotPasswordBtnDisabled = false;
                     $scope.user.email = '';
                     $location.url('forgot-password');
                     return;
                 }
                 alertService.flash('success', 'Reset password email successfully sent', true);
                 $scope.isForgotPasswordBtnDisabled = false;
                 $location.url('login');
             }).error(function(error) {

             });
         };


         // --
         // Get User Profile

         $scope.getUserProfile = function() {
             $scope.editUserProfileInfo = {
                 first_name: $scope.loggedUser.first_name,
                 last_name: $scope.loggedUser.last_name,
                 email: $scope.loggedUser.email,
                 image: $scope.loggedUser.image
             }
         };

         // --
         // Upload Entity Avatar common action DZ

         var uploadAvatarDZCtrl = false;
         var uploadAvatarDZ = function(key, actionVar, callback) {

             if (uploadAvatarDZCtrl) {
                 return;
             }
             uploadAvatarDZCtrl = true;

             // --
             $("#common-upload-avatar-dz").html('');
             $("#common-upload-avatar-dz").html($("#upload-avatar-dz-cn").html());

             // --


             var isUserHasSelectedFile = false;

             setTimeout(function() {

                 $("#common-upload-avatar-dz .common-upload-avtar-dz").dropzone({
                     url: "/api/common/" + key + "/file-uploads",
                     maxFilesize: 500,
                     maxFiles: 1000,
                     acceptedFiles: 'image/*',
                     addRemoveLinks: true,
                     dictRemoveFile: 'Remove',
                     uploadMultiple: false,
                     init: function() {
                         $scope.$apply(function() {
                             actionVar.uploadingAvatar = true;
                         });

                         $timeout(function() {
                             if (!isUserHasSelectedFile) {
                                 actionVar.uploadingAvatar = false;
                             }
                         }, 3000);
                     },
                     processing: function(file) {
                         isUserHasSelectedFile = true;
                         $scope.$apply(function() {
                             actionVar.uploadingAvatar = true;
                         });
                     },
                     success: function(data, resData) {
                         callback(resData);
                     },
                     canceled: function() {
                         $scope.$apply(function() {
                             actionVar.uploadingAvatar = false;
                         });
                         console.log("RemoveD1");
                     }

                 });
             }, 500);

             // --

             setTimeout(function() {
                 $("#common-upload-avatar-dz .common-upload-avtar-dz").click();
                 uploadAvatarDZCtrl = false;
             }, 1000);
         }

         // --
         // update image in DB

         var updateImageInDB = function(actionVar, image, model, id) {

             // Update in render area
             $scope.$apply(function() {
                 actionVar.image = image;
                 actionVar.uploadingAvatar = false;
             });

             $http.post('/api/common/edit-data', {
                 image: image,
                 model: model,
                 userUpdate: 'profile',
                 _id: id
             }).success(function(data) {}).error(function(err) {});
         }


         // --
         // common Upload Avatar

         $rootScope.uploadAvatar = function(key, actionVar, callback) {
             switch (key) {
                 case 1:
                     uploadAvatarDZ(key, actionVar, function(cb) {
                         // Update in DB
                         updateImageInDB(actionVar, cb.image, 'User', actionVar._id);

                     });
                     break;
                 case 2:
                     uploadAvatarDZ(key, actionVar, function(cb) {
                         actionVar.image = cb.image;
                         actionVar.uploadingAvatar = false;
                         callback(cb);
                     });
                 case 3:
                     uploadAvatarDZ(key, actionVar, function(cb) {
                         updateImageInDB(actionVar, cb.image, 'Tours', actionVar._id);
                     });
                     break;
                 case 4:
                     uploadAvatarDZ(key, actionVar, function(cb) {
                         updateImageInDB(actionVar, cb.image, 'Tours', actionVar._id);
                     });
                     break;
                case 5:
                     uploadAvatarDZ(key, actionVar, function(cb) {
                         updateImageInDB(actionVar, cb.image, 'Tours', actionVar._id);
                     });
                     break;
             }
         }

         // --
         // Edit user information

         $scope.isEditUserFormSubmitted = false;
         $scope.isEditUserButtonDisabled = false;
         $scope.editUserInformation = function(userForm, userData, userId) {

             // Check form is valid or not, if not than return
             if (!userForm.$valid) {
                 $scope.isEditUserFormSubmitted = true;
                 return;
             }

             $scope.isEditUserButtonDisabled = false;

             // --
             $http.post('/edit/' + userId + '/user', userData).success(function(response) {

                 $scope.isEditUserButtonDisabled = false;
                 $scope.isEditUserFormSubmitted = false;

                 if (response.status == true) {
                     alertService.flash('success', response.message, true);
                     $location.path('profile');
                 }
                 // --
                 // Update Global user information data
                 $scope.loggedUser.first_name = userData.first_name;
                 $scope.loggedUser.last_name = userData.last_name;
                 $scope.loggedUser.email = userData.email;
                 $scope.loggedUser.image = userData.image;

             }).error(function(err) {
                 $scope.isEditUserButtonDisabled = false;
                 $scope.isEditUserFormSubmitted = false;
             });
         }


         // --
         // create user password information object

         $scope.userPassword = {
             userId: Global.user._id,
             userOldPassword: '',
             userNewPassword: '',
             userConfirmPassword: ''
         };

         // --
         // Change user password

         $scope.isChangeUserPasswordFormSubmitted = false;
         $scope.isChangePasswordBtnDisabled = false;
         $scope.changePassword = function() {
             if (!$scope.changeUserPasswordForm.$valid || $scope.isConfirmPasswordNotMatch) {
                 $scope.isChangePasswordBtnDisabled = false;
                 $scope.isChangeUserPasswordFormSubmitted = true;
                 return false;
             }
             $scope.isChangePasswordBtnDisabled = true;
             $http.post('/api/user/change-password', $scope.userPassword).success(function(response) {
                 $scope.isChangePasswordBtnDisabled = false;
                 if (response) {
                     alertService.flash('success', 'Your password has been successfully changed ', true);
                     $location.path('/');
                 }
             }).error(function(error) {
                 if (error.msg === 'Unknown user' || error.msg === 'Invalid password') {
                     $scope.isChangePasswordBtnDisabled = false;
                     alertService.flash('error', error.msg, true);
                 } else {
                     // $scope.validationError = error;
                 }
             });
         };

         // --
         // Check confirm password match or not

         $scope.isConfirmPasswordNotMatch = false;
         $scope.checkConfirmPassword = function() {
             if ($scope.userPassword.userNewPassword !== $scope.userPassword.userConfirmPassword) {
                 $scope.isConfirmPasswordNotMatch = true;
             } else {
                 $scope.isConfirmPasswordNotMatch = false;
             }
         };

        $scope.user = {};
        $scope.global = Global;
        $scope.global.registerForm = false;
        $scope.isResetPasswordBtnDisabled = false;
        $scope.resetpassword = function() {


            if (!$scope.resetPassForm.$valid) {
                $scope.isResetPasswordFrmSubmitted = true;
                return;
            }

            $scope.isResetPasswordBtnDisabled = true;

            $http.post('/reset/' + $stateParams.token, {
              password: $scope.user.password,
              confirmPassword: $scope.user.confirmPassword
            })
              .success(function(response) {
                $rootScope.user = response.user;
                $scope.isResetPasswordBtnDisabled = false;
                $scope.isResetPasswordFrmSubmitted = false;
                $rootScope.$emit('loggedin');
                if (response.redirect) {
                  if (window.location.href === response.redirect) {
                    //This is so an admin user will get full admin page
                    window.location.reload();
                  } else {
                    window.location = response.redirect;
                  }
                } else {
                  $location.url('/');
                }
              })
              .error(function(error) {
                $scope.isResetPasswordBtnDisabled = false;
                $scope.isResetPasswordFrmSubmitted = false;
                if (error.msg === 'Token invalid or expired')
                  $scope.resetpassworderror = 'Could not update password as token is invalid or may have expired';
                else
                  $scope.validationError = error;
              });
        };


     }
 ]);