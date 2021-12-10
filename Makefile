IS_GIT_REPO := $(shell if git status > /dev/null 2>&1; then echo 1; else echo 0; fi)
ifeq ($(IS_GIT_REPO),1)
LIST_FILES_CMD_PREFIX := git ls-files
LIST_FILES_CMD_SUFFIX := --cached --others --exclude-standard
else
LIST_FILES_CMD_PREFIX := find
LIST_FILES_CMD_SUFFIX := -type f
endif

export CGO_ENABLED := 0

adash: adash.go ui/dist embed $(shell $(LIST_FILES_CMD_PREFIX) internal $(LIST_FILES_CMD_SUFFIX))
	go build adash.go

bin: adash
	@mkdir -p bin
	GOOS=linux GOARCH=amd64 go build -o bin/adash-linux-x86_64 adash.go
	GOOS=linux GOARCH=arm64 go build -o bin/adash-linux-arm64 adash.go
	GOOS=windows GOARCH=amd64 go build -o bin/adash-windows-x86_64.exe adash.go
	GOOS=darwin GOARCH=amd64 go build -o bin/adash-macos-x86_64.app adash.go
	GOOS=darwin GOARCH=arm64 go build -o bin/adash-macos-arm64.app adash.go
	@touch bin

ui: ui/dist

ui/dist: $(shell $(LIST_FILES_CMD_PREFIX) ui $(LIST_FILES_CMD_SUFFIX))
	@cd ui && npm ci && npm run build
	@touch ui/dist

ui-devel: adash
	@cd ui && npm run devel

embed: embed/clickhouse-operator-install-template.yaml embed/chop-release embed/version embed/chi-examples

embed/clickhouse-operator-install-template.yaml: clickhouse-operator/deploy/operator/clickhouse-operator-install-template.yaml
	@mkdir -p embed
	@cp $< $@

embed/chop-release: clickhouse-operator/release
	@mkdir -p embed
	@cp $< $@

embed/version: ui/print-version.js ui/package.json
	@( cd ui && node print-version.js ) > $@

embed/chi-examples: $(shell $(LIST_FILES_CMD_PREFIX) clickhouse-operator/docs/chi-examples/ $(LIST_FILES_CMD_SUFFIX))
	@mkdir -p embed/chi-examples
	@cp clickhouse-operator/docs/chi-examples/*.yaml embed/chi-examples

lint:
	@ui/.husky/pre-commit

format:
	@go fmt ./...

clean:
	@rm -rf adash internal/dev_server/swagger-ui-dist ui/dist embed bin

.PHONY: ui ui-devel lint format clean
