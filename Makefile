.DEFAULT_GOAL = all

PANDOC ?= pandoc
MKDIR ?= mkdir
INSTALL ?= install
CONVERT ?= convert
NPM ?= npm
NODE ?= node
RMRF ?= rm -rf

build:
	$(MKDIR) $@
build/%.html: template.html spec/%.markdown | build
	$(PANDOC) --standalone --template $< $(word 2,$^) --output $@
build/%.json: metaschemas/%.json | build
	$(INSTALL) -m 0664 $< $@
build/icon-%.png: static/icon.svg | build
	$(CONVERT) -resize $(basename $(notdir $(subst icon-,,$@))) $< $@
build/apple-touch-icon.png: build/icon-180x180.png | build
	$(INSTALL) -m 0664 $< $@
build/favicon.ico: build/icon-32x32.png | build
	$(CONVERT) $^ $@

build/%: static/% | build
	$(INSTALL) -m 0664 $< $@

node_modules: package.json package-lock.json
	$(NPM) ci

.PHONY: test
test: node_modules
	$(NODE) test/index.js

.PHONY: clean
clean:
	$(RMRF) build

.PHONY: all
all: test \
	build/index.html \
	build/v1.html build/v1.json \
	build/icon.svg \
	build/favicon.ico \
	build/manifest.webmanifest \
	build/icon-192x192.png \
 	build/icon-512x512.png \
	build/apple-touch-icon.png \
	build/.nojekyll
