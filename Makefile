TESTS = $(shell find test -type f -name "*test.js")


test:
	mocha 	$(TESTS)

.PHONY:  test 


