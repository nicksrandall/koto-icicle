/**
 * This will convert a flat, 2D array into a nested data structure.
 * Simular to d3.nest but allows n number of depths for each node
 */

// jscs:disable
function hierarchy () {
  var nest = {},
      keys = [],
      sortKeys = [],
      maxLength = 0,
      sortValues,
      rollup,
      filter = function (d) {
        return d !== null;
      };

 function keySetter (depth) {
    return function (d) {
      return d[depth];
    };
  }

  function map(mapType, array, depth) {
    if (depth >= maxLength) {
      return rollup
        ? rollup.call(nest, array) : (sortValues
        ? array.sort(sortValues)
        : array);
    }

    var i = -1,
        n = array.length,
        key = keySetter(depth++),
        keyValue,
        object,
        setter,
        size,
        valuesByKey = d3.map({}),
        values;

    /*jshint -W084 */
    while (++i < n) {
      if (depth === 1) {
        object = array[i].filter(filter);
      } else {
        object = array[i];
      }
      values = valuesByKey.get(keyValue = key(object));
      if (array[i].length > depth) {
        if (values) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [object]);
        }
      }
    }

    if (mapType) {
      object = mapType();
      size = function (object) {
        return object.size();
      };
      setter = function(keyValue, values) {
        object.set(keyValue, map(mapType, values, depth));
      };
    } else {
      object = {};
      size = function (object) {
        return Object.keys(object).length;
      };
      setter = function(keyValue, values) {
        object[keyValue] = map(mapType, values, depth);
      };
    }

    valuesByKey.forEach(setter);
    if (!size(object)) {
      return array;
    }
    return object;
  }

  function entries(map, depth) {
    if (depth >= maxLength || depth > map.length - 1) {
      return map;
    }

    var array = [],
        sortKey = sortKeys[depth++];

    map.forEach(function(key, keyMap) {
      array.push({name: key, children: entries(keyMap, depth)});
    });

    return sortKey
      ? array.sort(function(a, b) { return sortKey(a.name, b.name); })
      : array;
  }

  nest.map = function(array, mapType) {
    return map(mapType, array, 0);
  };

  nest.entries = function(array) {
    return entries(map(d3.map, array, 0), 0);
  };

  nest.maxLength = function(newMaxLength) {
    maxLength = newMaxLength - 2;
    return nest;
  };

  nest.filter = function (f) {
    filter = f;
    return nest;
  };

  // Specifies the order for the most-recently specified key.
  // Note: only applies to entries. Map keys are unordered!
  nest.sortKeys = function(order, depth) {
    depth = depth || maxLength;
    sortKeys[depth] = order;
    return nest;
  };

  // Specifies the order for leaf values.
  // Applies to both maps and entries array.
  nest.sortValues = function(order) {
    sortValues = order;
    return nest;
  };

  nest.rollup = function(f) {
    rollup = f;
    return nest;
  };

  return nest;
}
// jscs:enable

export default hierarchy;