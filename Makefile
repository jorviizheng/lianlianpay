TESTS = $(shell find test -type f -name "*test.js")


test:
	./node_modules/.bin/mocha 	$(TESTS)

.PHONY:  test 


