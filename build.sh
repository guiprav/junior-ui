#!/bin/sh
set -e

browserify browserGlobal.js -o bundle.js
browserify -g cssify todoDemo.js -o todoDemoBundle.js
