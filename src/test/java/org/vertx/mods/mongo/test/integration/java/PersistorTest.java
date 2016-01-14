package org.vertx.mods.mongo.test.integration.java;
/*
 * Copyright 2013 Red Hat, Inc.
 *
 * Red Hat licenses this file to you under the Apache License, version 2.0
 * (the "License"); you may not use this file except in compliance with the
 * License.  You may obtain a copy of the License at:
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * @author <a href="http://tfox.org">Tim Fox</a>
 */

import org.junit.Test;
import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.AsyncResultHandler;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.testtools.TestVerticle;

import java.util.concurrent.atomic.AtomicInteger;

import static org.vertx.testtools.VertxAssert.assertEquals;
import static org.vertx.testtools.VertxAssert.testComplete;

/**
 * Example Java integration test
 *
 * You should extend TestVerticle.
 *
 * We do a bit of magic and the test will actually be run _inside_ the Vert.x container as a Verticle.
 *
 * You can use the standard JUnit Assert API in your test by using the VertxAssert class
 */
public class PersistorTest extends TestVerticle {

  private EventBus eb;

  @Override
  public void start() {
    eb = vertx.eventBus();
    JsonObject config = new JsonObject();
    config.putString("address", "test.persistor");
    config.putString("db_name", System.getProperty("vertx.mongo.database", "test_db"));
    config.putString("host", System.getProperty("vertx.mongo.host", "localhost"));
    config.putNumber("port", Integer.valueOf(System.getProperty("vertx.mongo.port", "27017")));
    String username = System.getProperty("vertx.mongo.username");
    String password = System.getProperty("vertx.mongo.password");
    if (username != null) {
      config.putString("username", username);
      config.putString("password", password);
    }
    config.putBoolean("fake", false);
    container.deployModule(System.getProperty("vertx.modulename"), config, 1, new AsyncResultHandler<String>() {
      public void handle(AsyncResult<String> ar) {
        if (ar.succeeded()) {
          PersistorTest.super.start();
        } else {
          ar.cause().printStackTrace();
        }
      }
    });
  }

  @Test
  public void testPersistor() throws Exception {

    //First delete everything
    JsonObject json = new JsonObject().putString("collection", "testcoll")
        .putString("action", "delete").putObject("matcher", new JsonObject());

    eb.send("test.persistor", json, new Handler<Message<JsonObject>>() {
      public void handle(Message<JsonObject> reply) {
        assertEquals("ok", reply.body().getString("status"));
        final int numDocs = 1;
        final AtomicInteger count = new AtomicInteger(0);
        for (int i = 0; i < numDocs; i++) {
          JsonObject doc = new JsonObject().putString("name", "joe bloggs").putNumber("age", 40).putString("cat-name", "watt");
          JsonObject json = new JsonObject().putString("collection", "testcoll").putString("action", "save").putObject("document", doc);
          eb.send("test.persistor", json, new Handler<Message<JsonObject>>() {
            public void handle(Message<JsonObject> reply) {
              assertEquals("ok", reply.body().getString("status"));
              if (count.incrementAndGet() == numDocs) {
                JsonObject matcher = new JsonObject().putString("name", "joe bloggs");

                JsonObject json = new JsonObject().putString("collection", "testcoll").putString("action", "find").putObject("matcher", matcher);

                eb.send("test.persistor", json, new Handler<Message<JsonObject>>() {
                  public void handle(Message<JsonObject> reply) {
                    assertEquals("ok", reply.body().getString("status"));
                    JsonArray results = reply.body().getArray("results");
                    assertEquals(numDocs, results.size());
                    testComplete();
                  }
                });
              }
            }
          });
        }


      }
    });
  }

  @Test
  public void testCommand() throws Exception {
    JsonObject ping = new JsonObject().putString("action", "command")
                                      .putString("command", "{ping:1}");
    
    eb.send("test.persistor", ping, new Handler<Message<JsonObject>>() {
      public void handle(Message<JsonObject> reply) {
          Number ok = reply.body()
                           .getObject("result")
                           .getNumber("ok");

          assertEquals(1.0, ok);
          testComplete();
      }
    });
  }

}

