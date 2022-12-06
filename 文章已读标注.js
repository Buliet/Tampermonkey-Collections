// ==UserScript==
// @name         文章已读标注
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       buliet
// @match        http://opinion.people.com.cn/GB/*
// @match        http://www.chinasydw.org/*
// @match        https://mp.weixin.qq.com/*
// @match        https://www.zreading.cn/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=people.com.cn
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    var websites_arr = [
        {
            name: "popinion",
            color: ["green"],
            ele: "body > div.t02 > table > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr > td",
            type: "click",
        },
        {
            name: "chinasydw",
            color: ["green"],
            ele: "body > div.mainbox01.area04.clearfix > div.area04_left > div.listbox01 > div.body > ul",
            type: "click",
        },
        { name: "wx", color: ["green", "red"], ele: "#publish_time", type: "open" },
        {
            name: "zreading",
            color: ["green"],
            ele: "body > div > main > div.layoutMultiColumn--primary > div.blockGroup",
            type: "click",
        },
    ];

    var website = {};
    var dbname = "buliet";
    var tbname = getWebsiteName();
    if (tbname == "other") {
        console.log("site pass");
        return 0;
    }

    websites_arr.forEach(function (item) {
        if (tbname == item.name) {
            website = item;
        }
    });
    console.log(website)
    var parentEle = document.querySelector(website.ele);

    var inxname = "title";
    var db;
    var request = window.indexedDB.open(dbname);
    request.onupgradeneeded = function (event) {
        db = event.target.result;
        var objectStore;
        if (!db.objectStoreNames.contains(dbname)) {
            objectStore = db.createObjectStore(tbname, { keyPath: inxname });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        addSign();
        addAction_title();
    };

    function getWebsiteName() {
        var name = "other";
        var website_host = window.location.host;
        if (website_host.indexOf("people.com.cn") != -1) {
            name = "popinion";
        } else if (website_host.indexOf("chinasydw.org") != -1) {
            name = "chinasydw";
        } else if (website_host.indexOf("zreading.cn") != -1) {
            name = "zreading";
        } else if (website_host.indexOf("weixin.qq.com") != -1) {
            var wxtitle = document
                .querySelector("#activity-name")
                .innerText.replace(/^\s*|\s*$/g, "");
            if (wxtitle == "来了！新闻早班车") name = "wx";
        }
        return name;
    }

    async function addSign() {
        console.log("addSign action");
        var ret = 0;
        var title = "";
        var titlenode = "";
        var color = website.color[0];
        if (website.type == "click") {
            var titleNodes = parentEle.getElementsByTagName("a");
            for (var i = 0; i < titleNodes.length; i++) {
                titlenode = titleNodes[i];
                title = titlenode.innerText;
                ret = await hadRead(title);
                if (ret == 1) setColor(titlenode, color);
                // 批量添加数据
                // saveToDB(title);
            }
        } else if (website.type == "open") {
            titlenode = parentEle;
            title = titlenode.innerText;
            ret = await hadRead(title);
            if (ret == 1) setColor(titlenode, color);
            addHint(titlenode);
        }
    }

    function hadRead(key) {
        // console.log("hadRead action");
        var ret = 0;
        var transaction = db.transaction(tbname);
        var objectStore = transaction.objectStore(tbname);
        var request = objectStore.get(key);
        return new Promise(function (resolve) {
            request.onerror = function (event) {
                console.log("objectStore.get err");
            };
            request.onsuccess = function (event) {
                if (request.result) ret = 1;
                resolve(ret);
            };
        });
    }

    function mayhadRead(key) {
        console.log("mayhadRead action");
        var ret = 0;
        var transaction = db.transaction(tbname);
        var objectStore = transaction.objectStore(tbname);
        var request = objectStore.openCursor(null, "prevunique");
        return new Promise(function (resolve) {
            request.onerror = function (event) {
                console.log("objectStore.openCursor err");
            };
            request.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    var data = cursor.value.title;
                    if (data.startsWith(key)) {
                        ret = 1;
                        resolve(ret);
                    } else {
                        cursor.continue();
                    }
                } else {
                    console.log("没有更多数据了！");
                    resolve(ret);
                }
            };
        });
    }

    function setColor(node = null, color = "green") {
        // console.log("setColor action");
        if (node) node.style.color = color;
    }

    async function addHint(node = null) {
        console.log("addHint action");
        var ret = 0;
        if (tbname == "wx") {
            title = node.innerText;
            var color = website.color[1];
            // 2022-12-05 05:52
            var before_key = getBeforeToday(title);
            ret = await mayhadRead(before_key);
            if (ret != 1) setColor(node, color);
        }
    }

    function getBeforeToday(obj) {
        console.log("getBeforeToday action");
        var date = new Date(obj);
        var time = date.getTime(); //当前的毫秒数
        var oneDay = 1000 * 60 * 60 * 24; //一天的毫秒数
        var before = time - oneDay; //计算前一天的毫秒数
        date.setTime(before);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month > 9 ? month : "0" + month;
        var day = date.getDate();
        day = day > 9 ? day : "0" + day;
        return `${year}-${month}-${day}`;
    }

    function addAction_title() {
        console.log("addAction_title action");
        var title = "";
        var color = website.color[0];
        if (website.type == "click") {
            var titleNodes = parentEle.getElementsByTagName("a");
            Array.from(titleNodes).forEach((e) => {
                e.onclick = function (event) {
                    title = e.innerText;
                    setColor(e, color);
                    saveToDB(title);
                };
            });
            Array.from(titleNodes).forEach((e) => {
                e.oncontextmenu = function (event) {
                    title = e.innerText;
                    setColor(e, color);
                    saveToDB(title);
                };
            });
        } else if (website.type == "open") {
            var titleNode = parentEle;
            title = titleNode.innerText;
            saveToDB(title);
        }
    }

    function saveToDB(title) {
        console.log("saveToDB action");
        var transaction = db.transaction([tbname], "readwrite");
        var objectStore = transaction.objectStore(tbname);
        var request = objectStore.add({
            title: title,
        });
        request.onsuccess = function (event) {
            console.log("saveToDB success: " + title);
        };
        request.onerror = function (event) {
            console.log("existed : " + title);
        };
    }
})();
