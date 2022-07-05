// ==UserScript==
// @name         粉笔选项复制
// @namespace    http://tampermonkey.net/
// @version      0.14
// @description  try to take over the world!
// @author       You
// @match        https://www.fenbi.com/spa/tiku/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=fenbi.com
// @grant        none
// @info         只支持搜索和收藏，不支持错题
// @todo         美化
// @note         2022.06.23-V0.15 非收藏界面自动隐藏功能按钮
// @note         2022.06.22-V0.14 增加充值按钮和复制答案后增加序号的功能（用于同时使用Chrome、火狐）
// @note         2022.04.15-V0.13 增加显示/隐藏按钮
// @note         2022.04.15-V0.12 增加材料题和一键取消收藏功能
// @note         2022.04.15-V0.11 增加序号复制和自由加减功能
// @note         已知问题1：Chrome 不能一次添加多个选中，会被覆盖，火狐可以
// @note         已知问题2：火狐解析中图片不能正常加载（第二道及之后）
// @run-at document-end
// ==/UserScript==

(function() {
    'use strict';

    // 获取浏览器标识，区分谷歌和火狐
    function getBrowser() {
        var UserAgent = navigator.userAgent.toLowerCase();
        var browserInfo = {};
        var browserArray = {
            IE: window.ActiveXObject || "ActiveXObject" in window, // IE
            Chrome: UserAgent.indexOf('chrome') > -1 && UserAgent.indexOf('safari') > -1, // Chrome浏览器
            Firefox: UserAgent.indexOf('firefox') > -1, // 火狐浏览器
            Opera: UserAgent.indexOf('opera') > -1, // Opera浏览器
            Safari: UserAgent.indexOf('safari') > -1 && UserAgent.indexOf('chrome') == -1, // safari浏览器
            Edge: UserAgent.indexOf('edge') > -1, // Edge浏览器
            QQBrowser: /qqbrowser/.test(UserAgent), // qq浏览器
            WeixinBrowser: /MicroMessenger/i.test(UserAgent) // 微信浏览器
        };

        for (var i in browserArray) {
            if (browserArray[i]) {
                var versions = '';
                if (i == 'IE') {
                    versions = UserAgent.match(/(msie\s|trident.*rv:)([\w.]+)/)[2];
                } else if (i == 'Chrome') {
                    for (var mt in navigator.mimeTypes) {
                        //检测是否是360浏览器(测试只有pc端的360才起作用)
                        if (navigator.mimeTypes[mt].type == 'application/360softmgrplugin') {
                            i = '360';
                        }
                    }
                    versions = UserAgent.match(/chrome\/([\d.]+)/)[1];
                } else if (i == 'Firefox') {
                    versions = UserAgent.match(/firefox\/([\d.]+)/)[1];
                } else if (i == 'Opera') {
                    versions = UserAgent.match(/opera\/([\d.]+)/)[1];
                } else if (i == 'Safari') {
                    versions = UserAgent.match(/version\/([\d.]+)/)[1];
                } else if (i == 'Edge') {
                    versions = UserAgent.match(/edge\/([\d.]+)/)[1];
                } else if (i == 'QQBrowser') {
                    versions = UserAgent.match(/qqbrowser\/([\d.]+)/)[1];
                }
                browserInfo.type = i;
                browserInfo.versions = parseInt(versions);
            }
        }
        return browserInfo;
    }

    var browser = getBrowser().type

    // 检查并更新题目序号
    function check_update_nextInx(tscroll = false, plus = true) {
        var newinx = 1;
        if (plus == true) {
            newinx = inx + 1;
        } else {
            newinx = inx - 1;
        }
        const tmpselect = '#app-report-ques-solution > main > section > div > div:nth-child(' + newinx.toString() + ') > app-fb-solution > fb-ng-solution > div > fb-ng-solution-choice > div > article > div.content > div';
        var tmprangeNodeDom = document.querySelector(tmpselect);
        if (tmprangeNodeDom) {
            inx = newinx;
            btn_inx.setAttribute("value", "No." + inx.toString());
            if (tscroll) window.scrollTo(0, tmprangeNodeDom.offsetTop);
        } else {
            btn_inx.disabled = true;
        }
    }

    // 检查并更新材料序号
    function article_check_update_nextInx() {
        var tmpxpath = '//*[@id="app-report-ques-solution"]/main/section/div/div[' + inx.toString() + ']/app-fb-solution/fb-ng-solution/div/article[1]/fb-ng-question-material/div/article'
        var tmprangeNodeDom = document.evaluate(tmpxpath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
        if (tmprangeNodeDom) {
            artinx = inx;
            window.scrollTo(0, tmprangeNodeDom.offsetTop);
        }
    }

    if (typeof(window.inx) == 'undefined') {
        window.inx = 1;
    }
    var inx = window.inx;
    var artinx = 1;

    // 题干
    var btn_question = document.createElement("input");
    btn_question.setAttribute("type", "button");
    btn_question.setAttribute("value", "--------题干");
    btn_question.setAttribute("style", "position:fixed;top:200px;right:10px;font-size:30px");
    btn_question.setAttribute("class", "pro-btn");
    btn_question.onclick = function(event) {

        const selection = document.getSelection();
        const range = document.createRange();
        const select = '#app-report-ques-solution > main > section > div > div:nth-child(' + inx.toString() + ') > app-fb-solution > fb-ng-solution > div > fb-ng-solution-choice > div > article > div.content > div';
        var rangeNodeDom = document.querySelector(select);
        range.selectNode(rangeNodeDom);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        window.scrollTo(0, rangeNodeDom.offsetTop);
        //selection.removeAllRanges();
    };


    // 选项-火狐专用，火狐一次可以添加多个选中，谷歌不行：Ctrl + 左键 可以多选
    var btn_option_firefox = document.createElement("input");
    btn_option_firefox.setAttribute("type", "button");
    btn_option_firefox.setAttribute("value", "---火狐选项");
    btn_option_firefox.setAttribute("style", "position:fixed;top:250px;right:10px;font-size:30px;color:red");
    btn_option_firefox.setAttribute("class", "pro-btn");
    btn_option_firefox.onclick = function(event) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        for (var option = 1; option < 5; option++) {
            var select = '#app-report-ques-solution > main > section > div > div:nth-child(' + inx.toString() + ') > app-fb-solution > fb-ng-solution > div > fb-ng-solution-choice > div > ul > li:nth-child(' + option.toString() + ') > p';
            var rangeNodeDom = document.querySelector(select);
            var range = document.createRange();
            range.selectNode(rangeNodeDom);
            selection.addRange(range);
        }

        document.execCommand('copy');
        // selection.removeAllRanges();
    };

    // 选项-通用
    var btn_option = document.createElement("input");
    btn_option.setAttribute("type", "button");
    btn_option.setAttribute("value", "--------选项");
    btn_option.setAttribute("style", "position:fixed;top:250px;right:10px;font-size:30px");
    btn_option.setAttribute("class", "pro-btn");
    btn_option.onclick = function(event) {
        const selection = document.getSelection();
        const range = document.createRange();
        const select = '#app-report-ques-solution > main > section > div > div:nth-child(' + inx.toString() + ') > app-fb-solution > fb-ng-solution > div > fb-ng-solution-choice > div > ul';
        var rangeNodeDom = document.querySelector(select);
        range.selectNode(rangeNodeDom);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        window.scrollTo(0, rangeNodeDom.offsetTop);
        //selection.removeAllRanges();
    };

    // 正确答案
    var btn_correct = document.createElement("input");
    btn_correct.setAttribute("type", "button");
    btn_correct.setAttribute("value", "---正确答案");
    btn_correct.setAttribute("style", "position:fixed;top:300px;right:10px;font-size:30px");
    btn_correct.setAttribute("class", "pro-btn");
    btn_correct.onclick = function(event) {
        const selection = document.getSelection();
        const range = document.createRange();
        var xpath = '//*[@id="app-report-ques-solution"]/main/section/div/div[' + inx.toString() + ']/app-fb-solution/fb-ng-solution/div/article/ul/li[1]/fb-ng-solution-detail-answer/div/div[1]/p/span'
        var rangeNodeDom = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
        range.selectNode(rangeNodeDom);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        // selection.removeAllRanges();

        var eles = document.getElementsByClassName('answer_add_btn')
        var color = eles[0].style.color;
        if (color == 'red') {
            check_update_nextInx(false, true);
        }
    };

    // 解析
    var btn_analysis = document.createElement("input");
    btn_analysis.setAttribute("type", "button");
    btn_analysis.setAttribute("value", "--------解析");
    btn_analysis.setAttribute("style", "position:fixed;top:350px;right:10px;font-size:30px");
    btn_analysis.setAttribute("class", "pro-btn");
    btn_analysis.onclick = function(event) {
        const selection = document.getSelection();
        const range = document.createRange();
        const xpath = '//*[@id="app-report-ques-solution"]/main/section/div/div[' + inx.toString() + ']/app-fb-solution/fb-ng-solution/div/article/ul/li[2]/ul/li[1]/app-solution-answer/fb-ng-solution-detail-item/div/div/fb-ng-solution-detail-content/div';
        var rangeNodeDom = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
        range.selectNode(rangeNodeDom);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        // selection.removeAllRanges();

        check_update_nextInx(false, true);
    };

    // 序号
    var btn_inx = document.createElement("input");
    btn_inx.setAttribute("type", "button");
    btn_inx.setAttribute("value", "No." + inx.toString());
    btn_inx.setAttribute("style", "position:fixed;top:450px;right:10px;font-size:30px");
    btn_inx.setAttribute("class", "pro-btn");
    btn_inx.onclick = function(event) {
        check_update_nextInx(true, true);
    };

    // 序号增加
    var btn_addInx = document.createElement("input");
    btn_addInx.setAttribute("type", "button");
    btn_addInx.setAttribute("value", "+1");
    btn_addInx.setAttribute("style", "position:fixed;top:500px;right:50px;font-size:30px");
    btn_addInx.setAttribute("class", "pro-btn");
    btn_addInx.onclick = function(event) {
        check_update_nextInx(true, true);
    };

    // 序号减少
    var btn_minusInx = document.createElement("input");
    btn_minusInx.setAttribute("type", "button");
    btn_minusInx.setAttribute("value", "-1");
    btn_minusInx.setAttribute("style", "position:fixed;top:500px;right:10px;font-size:30px");
    btn_minusInx.setAttribute("class", "pro-btn");
    btn_minusInx.onclick = function(event) {
        check_update_nextInx(true, false);
    };

    // 取消收藏
    var btn_unstar = document.createElement("input");
    btn_unstar.setAttribute("type", "button");
    btn_unstar.setAttribute("value", "取消本页收藏");
    btn_unstar.setAttribute("style", "position:fixed;top:550px;right:10px;font-size:30px");
    btn_unstar.setAttribute("class", "pro-btn");
    var cevent = new Event('click');
    btn_unstar.onclick = function(event) {
        var eles = document.getElementsByClassName('collect-star-selected')
        for (var i in Object.keys(eles)) {
            eles[i].dispatchEvent(cevent);
        }
    };

    // 材料
    var btn_mainArticle = document.createElement("input");
    btn_mainArticle.setAttribute("type", "button");
    btn_mainArticle.setAttribute("value", "材料");
    btn_mainArticle.setAttribute("style", "position:fixed;top:100px;right:10px;font-size:30px");
    btn_mainArticle.setAttribute("class", "pro-btn");
    btn_mainArticle.onclick = function(event) {
        article_check_update_nextInx();
        const selection = document.getSelection();
        const range = document.createRange();
        const xpath = '//*[@id="app-report-ques-solution"]/main/section/div/div[' + artinx.toString() + ']/app-fb-solution/fb-ng-solution/div/article[1]/fb-ng-question-material/div/article'
        var rangeNodeDom = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
        range.selectNode(rangeNodeDom);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        // selection.removeAllRanges();
    }

    // 显示/隐藏
    var btn_showhide = document.createElement("input");
    btn_showhide.setAttribute("type", "button");
    btn_showhide.setAttribute("value", "显示/隐藏");
    btn_showhide.setAttribute("style", "position:fixed;top:0px;right:10px;font-size:10px");
    btn_showhide.onclick = function(event) {
        var eles = document.getElementsByClassName('pro-btn')
        for (var i in Object.keys(eles)) {
            if (eles[i].style.visibility == 'hidden') {
                eles[i].style.visibility = 'visible'
            } else {
                eles[i].style.visibility = 'hidden'
            }
        }
    }

    // 复制答案后序号增加
    var btn_answer_add = document.createElement("input");
    btn_answer_add.setAttribute("type", "button");
    btn_answer_add.setAttribute("value", "add");
    btn_answer_add.setAttribute("style", "position:fixed;top:300px;right:180px;font-size:30px;color:black");
    btn_answer_add.setAttribute("class", "pro-btn");
    btn_answer_add.onclick = function(event) {
        var color = btn_answer_add.style.color;
        if (color == 'red') {
            btn_answer_add.style.color = 'black';
        } else {
            btn_answer_add.style.color = 'red';
        }
    }

    // 重置序号
    var btn_reset_inx = document.createElement("input");
    btn_reset_inx.setAttribute("type", "button");
    btn_reset_inx.setAttribute("value", "reset");
    btn_reset_inx.setAttribute("style", "position:fixed;top:500px;right:100px;font-size:30px;color:red");
    btn_reset_inx.setAttribute("class", "pro-btn");
    btn_reset_inx.onclick = function(event) {
        inx = 1;
        btn_inx.setAttribute("value", "No." + inx.toString());
        btn_inx.disabled = false;
    }

    // 添加按钮
    var first = document.body.firstChild;

    document.body.insertBefore(btn_mainArticle, first);
    document.body.insertBefore(btn_question, first);
    if (browser == 'Chrome') {
        document.body.insertBefore(btn_option, first);
    } else {
        document.body.insertBefore(btn_option_firefox, first);
    }
    document.body.insertBefore(btn_correct, first);
    document.body.insertBefore(btn_analysis, first);
    document.body.insertBefore(btn_inx, first);
    document.body.insertBefore(btn_addInx, first);
    document.body.insertBefore(btn_minusInx, first);
    document.body.insertBefore(btn_unstar, first);
    document.body.insertBefore(btn_showhide, first);
    document.body.insertBefore(btn_answer_add, first);
    document.body.insertBefore(btn_reset_inx, first);

    // 非收藏界面自动隐藏功能按钮
    var timer = setTimeout(function(){
        var titlele = document.querySelector("#app-report-ques-solution > header > app-simple-nav-header > header > div > h4");
        console.log(titlele);
        if ((titlele == null) || (titlele != null && titlele.textContent != '我的收藏')) {
            btn_showhide.dispatchEvent(cevent);
        }
    },300);


})();
