adash: adash.go ui/dist $(shell git ls-files internal --cached --others --exclude-standard)
	@go build adash.go

adash-dev: adash.go ui/dist internal/dev_server/swagger-ui-dist $(shell git ls-files internal --cached --others --exclude-standard)
	@go build --tags dev -o adash-dev adash.go

ui: ui/dist

ui/dist: $(shell git ls-files ui --cached --others --exclude-standard)
	@cd ui && npm install --legacy-peer-deps && npm run build
	@touch ui/dist

ui-devel: adash-dev
	@cd ui && npm run devel

internal/dev_server/swagger-ui-dist: $(shell find swagger-ui/dist -type f)
	@cp -a swagger-ui/dist/ internal/dev_server/swagger-ui-dist/
	@sed -i 's/https:\/\/petstore.swagger.io\/v2\/swagger.json/\/apidocs.json/' internal/dev_server/swagger-ui-dist/index.html

clean:
	@rm -rf adash internal/dev_server/swagger-ui-dist ui/dist

.PHONY: ui ui-devel clean
