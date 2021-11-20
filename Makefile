IS_GIT_REPO := $(shell if $$(git status >& /dev/null); then echo 1; else echo 0; fi)
ifeq ($(IS_GIT_REPO),1)
LIST_FILES_CMD_PREFIX := git ls-files
LIST_FILES_CMD_SUFFIX := --cached --others --exclude-standard
else
LIST_FILES_CMD_PREFIX := find
LIST_FILES_CMD_SUFFIX := -type f
endif

TEMPLATE_FILES := embed/clickhouse-operator-install-template.yaml embed/release

adash: adash.go ui/dist $(TEMPLATE_FILES) $(shell $(LIST_FILES_CMD_PREFIX) internal $(LIST_FILES_CMD_SUFFIX))
	@go build adash.go

ui: ui/dist

ui/dist: $(shell $(LIST_FILES_CMD_PREFIX) ui $(LIST_FILES_CMD_SUFFIX))
	@cd ui && npm install --legacy-peer-deps && npm run build
	@touch ui/dist

ui-devel: adash
	@cd ui && npm run devel

embed/clickhouse-operator-install-template.yaml: clickhouse-operator/deploy/operator/clickhouse-operator-install-template.yaml
	@mkdir -p embed
	@cp $< $@

embed/release: clickhouse-operator/release
	@mkdir -p embed
	@cp $< $@

lint:
	@ui/.husky/pre-commit

clean:
	@rm -rf adash internal/dev_server/swagger-ui-dist ui/dist

.PHONY: ui ui-devel lint clean
