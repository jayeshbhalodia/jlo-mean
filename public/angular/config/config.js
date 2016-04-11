'use strict';


angular.module('mean.ic-mean').config(function(toastrConfig) {
    angular.extend(toastrConfig, {
        allowHtml: false,
        closeButton: true,
        closeHtml: '<button><i class="fa fa-times-circle"></i></button>',
        containerId: 'toast-container',
        extendedTimeOut: 1000,
        iconClasses: {
            error: 't-icon fa fa-exclamation-triangle',
            info: 't-icon fa fa-info-circle',
            success: 't-icon fa fa-check-square',
            warning: 't-icon fa fa-exclamation-triangle'
        },
        maxOpened: 0,
        messageClass: 'toast-message',
        newestOnTop: true,
        onHidden: null,
        onShown: null,
        positionClass: 'toast-bottom-full-width',
        tapToDismiss: true,
        timeOut: 3000,
        titleClass: 'toast-title',
        toastClass: 'toast'
    });
});