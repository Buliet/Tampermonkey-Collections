// ==UserScript==
// @name         人民时评已读标注
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://opinion.people.com.cn/GB/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=people.com.cn
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var dbname = 'buliet';
    var tbname = 'readinfo';
    var inxname = 'title';
    var color = 'blue'
    var db;
    var request = window.indexedDB.open(dbname);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        var objectStore;
        if (!db.objectStoreNames.contains(dbname)) {
            objectStore = db.createObjectStore(tbname, { keyPath: inxname });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        setColor();
    };

    function add(title) {
        var transaction = db.transaction([tbname], 'readwrite');
        var objectStore = transaction.objectStore(tbname);
        var request = objectStore.add({
            title: title
        });
        request.onsuccess = function(event) {
            console.log('add success: ' + title);
        };
        request.onerror = function(event) {
            console.log('existed : ' + title);
        };
    }

    function search(key, node = null, ret = 0) {
        var transaction = db.transaction(tbname);
        var objectStore = transaction.objectStore(tbname);
        // var index = objectStore.index(inxname);
        // var request = index.get(key);
        var request = objectStore.get(key);
        request.onerror = function(event) {
            console.log("objectStore.get err");
        };
        request.onsuccess = function(event) {
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
        var parent = document.querySelector("body > div.t02 > table > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr > td");
        var titleNodes = parent.getElementsByTagName('a');
        Array.from(titleNodes).forEach(e => {
            e.onclick = function(event) {
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
        var parent = document.querySelector("body > div.t02 > table > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr > td");
        var titleNodes = parent.getElementsByTagName('a');
        for (var i = 0; i < titleNodes.length; i++) {
            var titlenode = titleNodes[i];
            var title = titlenode.innerText;
            search(title, titlenode, ret);
        }
    }
})();
