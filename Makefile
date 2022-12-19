.DEFAULT_GOAL = all

PANDOC ?= pandoc
MKDIR ?= mkdir
INSTALL ?= install
NPM ?= npm
NODE ?= node

build:
	$(MKDIR) $@
build/index.html: template.html spec.markdown | build
	$(PANDOC) --standalone --template $< $(word 2,$^) --output $@
build/%.json: metaschemas/%.json
	$(INSTALL) -m 0664 $< $@
build/%: static/%
	$(INSTALL) -m 0664 $< $@

node_modules: package.json package-lock.json
	$(NPM) ci

.PHONY: test
test: node_modules
	$(NODE) test/runner.js

.PHONY: all
all: test build/index.html build/v1.json build/.nojekyll
