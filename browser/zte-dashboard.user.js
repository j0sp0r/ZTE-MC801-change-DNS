// ==UserScript==
// @name         ZTE MC801A Dashboard
// @namespace    https://github.com/j0sp0r/ZTE-MC801-change-DNS
// @version      2.0.0
// @description  Blendet das ZTE MC801A Dashboard automatisch über der Router-Oberfläche ein (DNS, Band-Lock, Netzmodus, Signalwerte).
// @author       j0sp0r
// @license      AGPL-3.0-or-later
// @match        http://192.168.0.1/*
// @require      https://raw.githubusercontent.com/j0sp0r/ZTE-MC801-change-DNS/main/browser/zte-dashboard.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

// Andere Router-IP? Die @match-Zeile oben anpassen (z.B. http://192.168.1.1/*).
//
// Das eigentliche Dashboard kommt per @require aus browser/zte-dashboard.js.
// Es erkennt den Userscript-Betrieb an GM_info, wartet unsichtbar, bis man im
// Router eingeloggt ist, und erscheint dann. hex_md5 bringt die Router-Seite
// selbst mit (js/lib/md5).
