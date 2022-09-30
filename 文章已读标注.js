// ==UserScript==
// @name         文章已读标注
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       You
// @match        http://opinion.people.com.cn/GB/*
// @match        http://www.chinasydw.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=people.com.cn
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var webLine = [
        { "name": "popinion", "obj": "body > div.t02 > table > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr > td" },
        { "name": "chinasydw", "obj": "body > div.mainbox01.area04.clearfix > div.area04_left > div.listbox01 > div.body > ul" },
    ];

    function getWebsiteName() {
        var name = "other";
        var website_host = window.location.host;
        if (website_host.indexOf("people.com.cn") != -1) {
            name = "popinion";
        } else if (website_host.indexOf("chinasydw.org") != -1) {
            name = "chinasydw";
        }
        return name;
    };

    var dbname = 'buliet';

    var tbname = getWebsiteName();
    var parentContent = '';
    webLine.forEach(function (item) {
        if (tbname == item.name) {
            parentContent = item.obj;
        }
    });
    var parentEle = document.querySelector(parentContent);

    var inxname = 'title';
    var color = 'yellow'
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
        setColor();
    };

    function add(title) {
        var transaction = db.transaction([tbname], 'readwrite');
        var objectStore = transaction.objectStore(tbname);
        var request = objectStore.add({
            title: title
        });
        request.onsuccess = function (event) {
            console.log('add success: ' + title);
        };
        request.onerror = function (event) {
            console.log('existed : ' + title);
        };
    }

    function search(key, node = null, ret = 0) {
        var transaction = db.transaction(tbname);
        var objectStore = transaction.objectStore(tbname);
        var request = objectStore.get(key);
        request.onerror = function (event) {
            console.log("objectStore.get err");
        };
        request.onsuccess = function (event) {
            if (request.result) {
                console.log('title: ' + request.result.title);
                if (ret == 1 && node) {
                    node.style.color = color;
                }
            }
        };
    }

    function addAction_title() {
        var ret = 1;
        var titleNodes = parentEle.getElementsByTagName('a');
        Array.from(titleNodes).forEach(e => {
            e.onclick = function (event) {
                var title = e.innerText;
                e.style.color = color;
                add(title);
            };

        });
    }

    addAction_title();

    function setColor() {
        var ret = 1;
        console.log('setColor action');
        var titleNodes = parentEle.getElementsByTagName('a');
        for (var i = 0; i < titleNodes.length; i++) {
            var titlenode = titleNodes[i];
            var title = titlenode.innerText;
            search(title, titlenode, ret);
        }
    }
})();
