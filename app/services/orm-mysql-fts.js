/**
 * Thanks to https://github.com/dresende/node-orm2 for this plugin
 * I needed to modify to suit my needs (i.e. IN BOOLEAN MODE matching)
 */
module.exports = Plugin;

function Plugin(db) {

  db.tools.match = function () {
    var props = Array.prototype.slice.apply(arguments);

    if (props.length === 0) {
      throw new Error("No properties defined for Full-Text Search matching");
    }

    return {
      against: function (expr, column) {
        column = column || "score";

        var obj = {
          // MATCH (?:id, ?:id, ...) AGAINST (?:value) AS score
          select: {
            str: "MATCH (?:id" + (new Array(props.length)).join(", ?:id") + ") AGAINST (?:value IN BOOLEAN MODE) AS ?:id",
            escapes: props.concat([ expr, column ])
          },
          // HAVING score > 0
          having: {
            str: "?:id > 0",
            escapes: [ column ]
          }
        };

        Object.defineProperty(obj, "sql_comparator", {
          configurable: false,
          enumerable: false,
          value: function () {
            return "sql";
          } // generic SQL
        });

        return obj;
      }
    };
  };

  return {
    define: function (Model) {
      var fields = Object.keys(Model.properties);

      for (var i = 0; i < Model.keys.length; i++) {
        if (fields.indexOf(Model.keys[i]) == -1) {
          fields.unshift(Model.keys[i]);
        }
      }

      Model.match = function () {
        var props = Array.prototype.slice.apply(arguments);

        if (props.length === 0) {
          throw new Error("No properties defined for Full-Text Search matching");
        }

        return {
          against: function (expr, column) {
            var chain = Model.find();

            column = column || "score";

            chain.only.apply(chain, fields.concat([ db.tools.match.apply(null, props).against(expr, column) ]));

            return chain.orderRaw("?? DESC", ['score']);
          }
        };
      };
    }
  };
}
