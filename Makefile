adash: adash.go ui/dist swagger-ui-dist $(shell git ls-files internal --cached --others --exclude-standard)
	@go build adash.go

ui: ui/dist

ui/dist: $(shell git ls-files ui --cached --others --exclude-standard)
	@cd ui && npm install --legacy-peer-deps && npm run build
	@touch ui/dist

ui-devel: adash
	@cd ui && npm run devel

swagger-ui-dist: $(shell find swagger-ui/dist -type f)
	@cp -a swagger-ui/dist/ swagger-ui-dist/
	@sed -i 's/https:\/\/petstore.swagger.io\/v2\/swagger.json/\/apidocs.json/' swagger-ui-dist/index.html

clean:
	@rm -rf adash swagger-ui-dist ui/build

.PHONY: ui ui-devel clean
