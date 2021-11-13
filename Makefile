adash: adash.go ui/dist $(shell git ls-files internal --cached --others --exclude-standard)
	@go build adash.go

ui: ui/dist

ui/dist: $(shell git ls-files ui --cached --others --exclude-standard)
	@cd ui && npm install --legacy-peer-deps && npm run build
	@touch ui/dist

ui-devel: adash-dev
	@cd ui && npm run devel

clean:
	@rm -rf adash internal/dev_server/swagger-ui-dist ui/dist

.PHONY: ui ui-devel clean
