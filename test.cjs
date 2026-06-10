const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const path = require('path');

const assetsDir = 'dist/assets';
const screenerFile = fs.readdirSync(assetsDir).find(f => f.startsWith('screener-') && f.endsWith('.js'));
const indexCode = fs.readFileSync(path.join(assetsDir, screenerFile), 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (e) => {
  console.log("JSDOM Error:", e);
});
virtualConsole.on("jsdomError", (e) => {
  console.log("jsdom Error object:", e);
  console.log("jsdom Error detail:", e.detail);
});

const dom = new JSDOM(`<!DOCTYPE html><html lang="en"><head></head><body><div id="root"></div></body></html>`, {
  runScripts: "dangerously",
  virtualConsole,
  url: "http://localhost/screener.html"
});

let errorFound = false;
dom.window.addEventListener("error", (e) => {
  console.log("Window Error:", e.error);
  errorFound = true;
  process.exit(1);
});
dom.window.addEventListener("unhandledrejection", (e) => {
  console.log("Unhandled Promise Rejection:", e.reason);
  errorFound = true;
  process.exit(1);
});

// Polyfill things that JSDOM might lack

dom.window.matchMedia = dom.window.matchMedia || function() {
    return { matches : false, addListener : function() {}, removeListener: function() {} };
};

// Evaluate the built bundle!
try {
  dom.window.eval(indexCode);
  setTimeout(() => {
    console.log("HTML length after 2s:", dom.window.document.body.innerHTML.length);
    process.exit(0);
  }, 2000);
} catch (err) {
  console.log("EVAL ERROR:", err);
  process.exit(1);
}
