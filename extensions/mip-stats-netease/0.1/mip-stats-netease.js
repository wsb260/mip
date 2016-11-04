/**
 * @file 网易统计
 *
 * @author menglingjun
 * @copyright 2016 Baidu.com, Inc. All Rights Reserved
 */

define(function() {

    var customElem = require('customElement');

    customElem.prototype.init = function() {
        this.mipCreatedCallback = render;
    };


    function render() {

        if (this.isRender) {
            return;
        }

        this.isRender = true;

        var id = this.getAttribute('id') || '';

        $.getScript(location.protocol + '//analytics.163.com/ntes_ex.js', function() {
            // 网易小伙伴 居然支持 amd
            require(['NTES'], function (NTES) {
                NTES(id).pageTracker();
            });

        });

    }

    return customElem;

});
require(['mip-stats-netease'], function (netease) {
    //注册组件
    MIP.registerMipElement('mip-stats-netease', netease);
    MIP.registerMipElement('mip-netease-tongji', netease);
});
