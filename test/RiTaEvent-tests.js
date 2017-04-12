/*global console, test, throws, equal, fail, notEqual, expect, require, ok,
    QUnit, RiTa, RiTaEvent, RiString, RiGrammar, RiMarkov, */

/*jshint loopfunc: true */

// Note: Don't need to extract test-results
var runtests = function() {

  QUnit.module("RiTaEvent", {
    setup: function() {},
    teardown: function() {}
  });

  test("testConstructor", function() {

    ok(RiTaEvent(this));
    ok(new RiTaEvent(this));
    ok(RiTaEvent(this, "test"));
    ok(new RiTaEvent(this, "test"));

    throws(function() {
      RiTa.SILENT = 1;
      try {

        new RiTaEvent();
        fail("no exception");
      } catch (e) {
        throw e;
      }
      RiTa.SILENT = 0;
    });

    throws(function() {
      RiTa.SILENT = 1;
      try {
        RiTaEvent();
        fail("no exception");
      } catch (e) {
        throw e;
      }
      RiTa.SILENT = 0;
    });

    var BAD = [null, undefined];

    for (var i = 0; i < BAD.length; i++) {

      throws(function() {
        RiTa.SILENT = 1;
        try {
          new RiTaEvent(BAD[i]);
          fail("no exception");
        } catch (e) {
          throw e;
        }
        RiTa.SILENT = 0;
      }, BAD[i]);

      throws(function() {
        RiTa.SILENT = 1;
        try {
          RiTaEvent(BAD[i]);
          fail("no exception");
        } catch (e) {
          throw e;
        }
        RiTa.SILENT = 0;
      }, BAD[i]);
    }
  });

  test("testIsType", function() {

    equal(RiTaEvent(this).isType(RiTa.UNKNOWN), true);
    equal(new RiTaEvent(this, RiTa.INTERNAL).isType(RiTa.INTERNAL), true);
    equal(RiTaEvent(this, RiTa.DATA_LOADED).isType(RiTa.DATA_LOADED), true);
    equal(new RiTaEvent(this, RiTa.DATA_LOADED).isType(RiTa.INTERNAL), false);
  });

  test("testToString", function() {

    ok(RiTaEvent(this).toString()); //TODO: compare to RiTa
  });
};

if (typeof exports != 'undefined') runtests();
