/*
 * Copyright 2011-2012 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var container = require("vertx/container");
var vertx = require("vertx")
var vertxTests = require("vertx_tests");
var vassert = require("vertx_assert");

var eb = vertx.eventBus;

var isFake = false;

var persistorConfig =
{
  address: 'test.persistor',
  db_name: java.lang.System.getProperty("vertx.mongo.database", "test_db"),
  host: java.lang.System.getProperty("vertx.mongo.host", "localhost"),
  port: java.lang.Integer.valueOf(java.lang.System.getProperty("vertx.mongo.port", "27017")),
  fake: isFake
}
var username = java.lang.System.getProperty("vertx.mongo.username");
var password = java.lang.System.getProperty("vertx.mongo.password");
if (username != null) {
  persistorConfig.username = username;
  persistorConfig.password = password;
}

var script = this;
container.deployModule(java.lang.System.getProperty('vertx.modulename'), persistorConfig, 1, function(err, deployID) {
  if (err != null) {
    err.printStackTrace();
  } else {
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'delete',
      matcher: {}
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);
      vertxTests.startTests(script);
    });
  }
});

function testSave() {
  eb.send('test.persistor', {
    collection: 'testcoll',
    action: 'save',
    document: {
      name: 'tim',
      age: 40,
      pi: 3.14159,
      male: true,
      cheeses: ['brie', 'stilton']
    }
  }, function(reply) {
    vassert.assertEquals('ok', reply.status);
    var id  = reply._id;
    vassert.assertTrue(id != undefined);

    // Now update it
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'save',
      document: {
        _id: id,
        name: 'tim',
        age: 1000
      }
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);

      eb.send('test.persistor', {
        collection: 'testcoll',
        action: 'findone',
        document: {
          _id: id
        }
      }, function(reply) {
        vassert.assertEquals('ok', reply.status);
        vassert.assertEquals('tim', reply.result.name);
        vassert.assertEquals(1000, reply.result.age, 0);

        // Do an update with a different WriteConcern
        eb.send('test.persistor', {
          collection: 'testcoll',
          action: 'save',
          writeConcern: "SAFE",
          document: {
            _id: id,
            name: 'fox',
            age: 21
          }
        }, function(reply) {
          vassert.assertEquals('ok', reply.status);
          eb.send('test.persistor', {
            collection: 'testcoll',
            action: 'findone',
            document: {
              _id: id
            }
          }, function(reply) {
            vassert.assertEquals('ok', reply.status);
            vassert.assertEquals('fox', reply.result.name);
            vassert.assertEquals(21, reply.result.age, 0);
            vassert.testComplete();
          });

        });
      });
    });
  });
}

function testFind() {

  eb.send('test.persistor', {
    collection: 'testcoll',
    action: 'save',
    document: {
      name: 'tim',
      age: 40,
      pi: 3.14159,
      male: true,
      cheeses: ['brie', 'stilton']
    }
  }, function(reply) {
    vassert.assertEquals('ok', reply.status);
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'find',
      matcher: {
        name: 'tim'
      }
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);
      vassert.assertEquals(1, reply.results.length, 0);
      var res = reply.results[0];
      vassert.assertEquals('tim', res.name);
      vassert.assertEquals(40, res.age, 0);
      vassert.assertEquals(3.14159, res.pi, 0);
      vassert.assertTrue(res.male);
      vassert.assertEquals(2, res.cheeses.length, 0);
      vassert.assertEquals('brie', res.cheeses[0]);
      vassert.assertEquals('stilton', res.cheeses[1]);
      vassert.assertTrue(undefined != res._id);
      vassert.testComplete();
    });
  });
}

function testFindNoMatcher() {
  eb.send('test.persistor', {
    collection: 'testcoll',
    action: 'save',
    document: {
      name: 'tim',
      age: 40,
      pi: 3.14159,
      male: true,
      cheeses: ['brie', 'stilton']
    }
  }, function(reply) {
    vassert.assertEquals('ok', reply.status);
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'find'
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);
      vassert.assertEquals(1, reply.results.length, 0);
      var res = reply.results[0];
      vassert.assertEquals('tim', res.name);
      vassert.assertEquals(40, res.age, 0);
      vassert.assertEquals(3.14159, res.pi, 0);
      vassert.assertTrue(res.male);
      vassert.assertEquals(2, res.cheeses.length, 0);
      vassert.assertEquals('brie', res.cheeses[0]);
      vassert.assertEquals('stilton', res.cheeses[1]);
      vassert.assertTrue(undefined != res._id);
      vassert.testComplete();
    });
  });
}

function testFindOne() {

  eb.send('test.persistor', {
    collection: 'testcoll',
    action: 'save',
    document: {
      name: 'tim',
      age: 40,
      pi: 3.14159,
      male: true,
      cheeses: ['brie', 'stilton']
    }
  }, function(reply) {
    vassert.assertEquals('ok', reply.status);
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'findone',
      matcher: {
        name: 'tim'
      }
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);
      var res = reply.result;
      vassert.assertEquals('tim', res.name);
      vassert.assertEquals(40, res.age, 0);
      vassert.assertEquals(3.14159, res.pi, 0);
      vassert.assertTrue(res.male);
      vassert.assertEquals(2, res.cheeses.length, 0);
      vassert.assertEquals('brie', res.cheeses[0]);
      vassert.assertEquals('stilton', res.cheeses[1]);
      vassert.assertTrue(undefined != res._id);
      vassert.testComplete();
    });
  });
}

function testFindWithLimit() {

  var num = 20;

  var limit = 12;

  var count = 0;

  for (var i = 0; i < num; i++) {
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'save',
      document: {
        name: 'tim' + i
      }
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);

      if (++count == num) {
        eb.send('test.persistor', {
          collection: 'testcoll',
          action: 'find',
          limit: limit,
          matcher: {}
        }, function(reply) {
          vassert.assertEquals('ok', reply.status);
          vassert.assertEquals(limit, reply.results.length, 0);
          vassert.testComplete();
        });
      }
    });
  }


}

function testFindWithSkipAndLimit() {

  var num = 20;

  var skip = 10;
  var limit = 12;

  var count = 0;

  for (var i = 0; i < num; i++) {
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'save',
      document: {
        name: 'tim' + i
      }
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);

      if (++count == num) {
        eb.send('test.persistor', {
          collection: 'testcoll',
          action: 'find',
          skip: skip,
          limit: limit,
          matcher: {}
        }, function(reply) {
          vassert.assertEquals('ok', reply.status);
          vassert.assertEquals(10, reply.results.length, 0);
          vassert.testComplete();
        });
      }
    });
  }
}

function testFindWithSort() {

  if (!isFake) {

    // Fongo doesn't seem to support sorting cursors

    var num = 10;
    var count = 0;

    for (var i = 0; i < num; i++) {
      eb.send('test.persistor', {
        collection: 'testcoll',
        action: 'save',
        document: {
          name: 'tim',
          age: Math.floor(Math.random()*11)
        }
      }, function(reply) {
        vassert.assertEquals('ok', reply.status);

        if (++count == num) {
          vertx.setTimer(1000, function() {
            eb.send('test.persistor', {
              collection: 'testcoll',
              action: 'find',
              matcher: {},
              sort: {age: 1}
            }, function(reply) {
              vassert.assertEquals('ok', reply.status);
              vassert.assertEquals(num, reply.results.length, 0);
              var last = 0;
              for (var i = 0; i < reply.results.length; i++) {
                var age = reply.results[i].age;
                vassert.assertTrue(age >= last);
                last = age;
              }
              vassert.testComplete();
            });
          });

        }
      });
    }
  } else {
    vassert.testComplete();
  }
}

function testFindWithKeys() {
	
  eb.send('test.persistor', {
    collection: 'testcoll',
    action: 'save',
    document: {
      name: 'tim',
      age: Math.floor(Math.random()*11)
    }
  }, function(reply) {
    vassert.assertEquals('ok', reply.status);
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'findone',
      keys: { name: 1},
      sort: {age: 1}
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);
      vassert.assertEquals('tim', reply.result.name);

      eb.send('test.persistor', {
        collection: 'testcoll',
        action: 'findone',
        matcher: {name: 'tim'},
        keys: { name: 1},
        sort: {age: 1}
      }, function(reply) {
        vassert.assertEquals('ok', reply.status);
        vassert.assertEquals('tim', reply.result.name);

        eb.send('test.persistor', {
          collection: 'testcoll',
          action: 'find',
          matcher: {name: 'tim'},
          keys: { name: 1},
          sort: {age: 1}
        }, function(reply) {
          vassert.assertEquals('ok', reply.status);
          vassert.assertEquals('tim', reply.results[0].name);
          vassert.testComplete();
        });
      });
    });
  });
}


function testFindBatched() {

  var num = 103;
  var count = 0;

  for (var i = 0; i < num; i++) {
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'save',
      document: {
        name: 'tim',
        age: i
      }
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);

      if (++count == num) {
        var received = 0;

        function createReplyHandler() {
          return function(reply, replier) {
            received += reply.results.length;
            if (received < num) {
              vassert.assertEquals(10, reply.results.length, 0);
              vassert.assertEquals('more-exist', reply.status);
              replier({}, createReplyHandler());
            } else {
              vassert.assertEquals(3, reply.results.length, 0);
              vassert.assertEquals('ok', reply.status);
              vassert.testComplete();
            }
          }
        }

        eb.send('test.persistor', {
          collection: 'testcoll',
          action: 'find',
          matcher: {},
          batch_size: 10
        }, createReplyHandler());
      }

    });
  }


}

function testDelete() {

  eb.send('test.persistor', {
    collection: 'testcoll',
    action: 'save',
    document: {
      name: 'tim'
    }
  }, function(reply) {
    vassert.assertEquals('ok', reply.status);
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'save',
      document: {
        name: 'bob'
      }
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);
      // Testing insert with writeConcern
      eb.send('test.persistor', {
        collection: 'testcoll',
        action: 'save',
        writeConcert: "JOURNAL_SAFE",
        document: {
          name: 'mark'
        }
      }, function(reply) {
        vassert.assertEquals('ok', reply.status);
        // Testing delete with writeConcern
        eb.send('test.persistor', {
          collection: 'testcoll',
          action: 'delete',
          writeConcern: "NORMAL",
          matcher: {
            name: 'mark'
          }
        }, function(reply) {
          vassert.assertEquals('ok', reply.status);
          eb.send('test.persistor', {
            collection: 'testcoll',
            action: 'delete',
            matcher: {
              name: 'tim'
            }
          }, function(reply) {

            vassert.assertEquals('ok', reply.status);
            vassert.assertEquals(1, reply.number, 0);

            eb.send('test.persistor', {
              collection: 'testcoll',
              action: 'find',
              matcher: {
                name: 'bob'
              }
            }, function(reply) {
              vassert.assertEquals('ok', reply.status);
              vassert.assertEquals(1, reply.results.length, 0);
              vassert.testComplete();
            });
          });
        });
      });
    });
  });
}

function testDropCollection() {

    eb.send('test.persistor', {
        collection: 'testcoll',
        action: 'save',
        document: {
            name: 'tim',
            age: 40,
            pi: 3.14159,
            male: true,
            cheeses: ['brie', 'stilton']
        }
    }, function(reply) {
        vassert.assertEquals('ok', reply.status);
        eb.send('test.persistor', {
            collection: 'testcoll',
            action: 'find',
            matcher: {
                name: 'tim'
            }
        }, function(reply) {
            vassert.assertEquals('ok', reply.status);
            vassert.assertEquals(1, reply.results.length, 0);
            var res = reply.results[0];
            vassert.assertEquals('tim', res.name);
            vassert.assertEquals(40, res.age, 0);
            vassert.assertEquals(3.14159, res.pi, 0);
            vassert.assertEquals(true, res.male);
            vassert.assertEquals(2, res.cheeses.length, 0);
            vassert.assertEquals('brie', res.cheeses[0]);
            vassert.assertEquals('stilton', res.cheeses[1]);
            eb.send('test.persistor', {
                action: "dropCollection",
                collection: 'testcoll'
            }, function(reply) {
                vassert.assertEquals('ok', reply.status);
                eb.send('test.persistor', {
                    action: 'getCollections'
                }, function(reply) {
                    vassert.assertEquals('ok', reply.status);
                    var collList = reply.collections;
                    for (var i = 0; i < collList.length; i++) {
                        vassert.assertTrue(collList[i] != "testcoll")
                    }
                    vassert.testComplete();
                });
            });
        });
    });
}

function testCount() {

  var num = 10;
  var count = 0;

  for (var i = 0; i < num; i++) {
    eb.send('test.persistor', {
      collection: 'testcoll',
      action: 'save',
      document: {
        name: 'tim',
        age: Math.floor(Math.random()*11)
      }
    }, function(reply) {
      vassert.assertEquals('ok', reply.status);
      if (++count == num) {
        eb.send('test.persistor', {
          collection: 'testcoll',
          action: 'count',
          matcher: {}
        }, function(reply) {
          vassert.assertEquals('ok', reply.status);
          vassert.assertEquals(num, reply.count, 0);
          vassert.testComplete();
        });
      }
    });
  }
}

function testCollectionStats() {
    eb.send('test.persistor', {
        collection: 'testcoll',
        action: 'save',
        document: {
            name: 'tim',
            age: 40,
            pi: 3.14159,
            male: true,
            cheeses: ['brie', 'stilton']
        }
    }, function(reply) {
        vassert.assertEquals('ok', reply.status);
        eb.send('test.persistor', {
            collection: 'testcoll',
            action: 'find',
            matcher: {
                name: 'tim'
            }
        }, function(reply) {
            vassert.assertEquals('ok', reply.status);
            vassert.assertEquals(1, reply.results.length, 0);
            var res = reply.results[0];
            vassert.assertEquals('tim', res.name);
            vassert.assertEquals(40, res.age, 0);
            vassert.assertEquals(3.14159, res.pi, 0);
            vassert.assertEquals(true, res.male);
            vassert.assertEquals(2, res.cheeses.length, 0);
            vassert.assertEquals('brie', res.cheeses[0]);
            vassert.assertEquals('stilton', res.cheeses[1]);

            eb.send('test.persistor', {
                collection: 'testcoll',
                action: 'collectionStats'
            }, function(reply) {
                vassert.assertEquals('ok', reply.status);
                var stats = reply.stats;
                vassert.assertTrue(stats.serverUsed.length > 0)
                vassert.assertEquals('testcoll', stats.ns.slice(-"testcoll".length))
                vassert.assertEquals(1, stats.count, 0)
                vassert.testComplete();
            });
        });
    });
}
