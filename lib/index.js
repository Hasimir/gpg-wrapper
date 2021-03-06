// Generated by IcedCoffeeScript 1.7.1-c
(function() {
  var BaseKey, BucketDict, Element, Ignored, Index, Key, Line, Parser, Subkey, Warnings, list_fingerprints, parse, parse_int, pgpu, uniquify, util,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  pgpu = require('pgp-utils').userid;

  Warnings = require('iced-utils').util.Warnings;

  util = require('util');

  BucketDict = (function() {
    function BucketDict() {
      this._d = {};
    }

    BucketDict.prototype.add = function(k, v) {
      var b;
      k = ("" + k).toLowerCase();
      if ((b = this._d[k]) == null) {
        this._d[k] = b = [];
      }
      return b.push(v);
    };

    BucketDict.prototype.get = function(k) {
      return this._d[("" + k).toLowerCase()] || [];
    };

    BucketDict.prototype.get_0_or_1 = function(k) {
      var err, l, n, obj;
      l = this.get(k);
      err = obj = null;
      if ((n = l.length) > 1) {
        err = new Error("wanted a unique lookup, but got " + n + " object for key " + k);
      } else {
        obj = n === 0 ? null : l[0];
      }
      return [err, obj];
    };

    return BucketDict;

  })();

  uniquify = function(v) {
    var e, h, k, _i, _len, _results;
    h = {};
    for (_i = 0, _len = v.length; _i < _len; _i++) {
      e = v[_i];
      h[e] = true;
    }
    _results = [];
    for (k in h) {
      _results.push(k);
    }
    return _results;
  };

  Index = (function() {
    function Index() {
      this._keys = [];
      this._lookup = {
        email: new BucketDict(),
        fingerprint: new BucketDict(),
        key_id_64: new BucketDict()
      };
    }

    Index.prototype.push_element = function(el) {
      var k;
      if ((k = el.to_key())) {
        return this.index_key(k);
      }
    };

    Index.prototype.index_key = function(k) {
      var e, i, _i, _j, _len, _len1, _ref, _ref1, _results;
      this._keys.push(k);
      this._lookup.fingerprint.add(k.fingerprint(), k);
      _ref = uniquify(k.emails());
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        this._lookup.email.add(e, k);
      }
      _ref1 = k.all_key_id_64s();
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        i = _ref1[_j];
        _results.push(this._lookup.key_id_64.add(i, k));
      }
      return _results;
    };

    Index.prototype.lookup = function() {
      return this._lookup;
    };

    Index.prototype.keys = function() {
      return this._keys;
    };

    Index.prototype.fingerprints = function() {
      var k, _i, _len, _ref, _results;
      _ref = this.keys();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        _results.push(k.fingerprint());
      }
      return _results;
    };

    return Index;

  })();

  Element = (function() {
    function Element() {
      this._err = null;
    }

    Element.prototype.err = function() {
      return this._err;
    };

    Element.prototype.is_ok = function() {
      return this._err == null;
    };

    Element.prototype.to_key = function() {
      return null;
    };

    return Element;

  })();

  parse_int = function(s) {
    if (s != null ? s.match(/^[0-9]+$/) : void 0) {
      return parseInt(s, 10);
    } else {
      return s;
    }
  };

  BaseKey = (function(_super) {
    __extends(BaseKey, _super);

    function BaseKey(line) {
      var e, v;
      BaseKey.__super__.constructor.call(this);
      if (line.v.length < 12) {
        this._err = new Error("Key is malformed; needs at least 12 fields");
      } else {
        v = (function() {
          var _i, _len, _ref, _results;
          _ref = line.v;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            e = _ref[_i];
            _results.push(parse_int(e));
          }
          return _results;
        })();
        this._pub = v[0], this._trust = v[1], this._n_bits = v[2], this._type = v[3], this._key_id_64 = v[4], this._created = v[5], this._expires = v[6];
      }
    }

    BaseKey.prototype.err = function() {
      return this._err;
    };

    BaseKey.prototype.to_key = function() {
      return null;
    };

    BaseKey.prototype.key_id_64 = function() {
      return this._key_id_64;
    };

    BaseKey.prototype.fingerprint = function() {
      return this._fingerprint;
    };

    BaseKey.prototype.add_fingerprint = function(line) {
      return this._fingerprint = line.get(9);
    };

    BaseKey.prototype.is_revoked = function() {
      return this._trust === 'r';
    };

    BaseKey.prototype.to_dict = function(_arg) {
      var secret;
      secret = _arg.secret;
      return {
        fingerprint: this.fingerprint(),
        key_id_64: this.key_id_64(),
        secret: secret,
        is_revoked: this.is_revoked()
      };
    };

    return BaseKey;

  })(Element);

  Subkey = (function(_super) {
    __extends(Subkey, _super);

    function Subkey() {
      return Subkey.__super__.constructor.apply(this, arguments);
    }

    return Subkey;

  })(BaseKey);

  Key = (function(_super) {
    __extends(Key, _super);

    function Key(line) {
      Key.__super__.constructor.call(this, line);
      this._userids = [];
      this._subkeys = [];
      this._top = this;
      if (this.is_ok()) {
        this.add_uid(line);
      }
    }

    Key.prototype.emails = function() {
      var e, u, _i, _len, _ref, _results;
      _ref = this._userids;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        u = _ref[_i];
        if ((e = u.email) != null) {
          _results.push(e);
        }
      }
      return _results;
    };

    Key.prototype.to_key = function() {
      return this;
    };

    Key.prototype.userids = function() {
      return this._userids;
    };

    Key.prototype.subkeys = function() {
      return this._subkeys;
    };

    Key.prototype.to_dict = function(d) {
      var r;
      r = Key.__super__.to_dict.call(this, d);
      r.uid = this.userids()[0];
      r.all_uids = this.userids;
      return r;
    };

    Key.prototype.all_keys = function() {
      return [this].concat(this._subkeys);
    };

    Key.prototype.all_key_id_64s = function() {
      var i, ret, s;
      ret = (function() {
        var _i, _len, _ref, _results;
        _ref = this.all_keys();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          if ((i = s.key_id_64()) != null) {
            _results.push(i);
          }
        }
        return _results;
      }).call(this);
      return ret;
    };

    Key.prototype.add_line = function(line) {
      var err, f, n;
      err = null;
      if ((n = line.v.length) < 2) {
        return line.warn("got too few fields (" + n + ")");
      } else {
        switch ((f = line.v[0])) {
          case 'fpr':
            return this._top.add_fingerprint(line);
          case 'uid':
            return this.add_uid(line);
          case 'uat':
            break;
          case 'sub':
          case 'ssb':
            return this.add_subkey(line);
          default:
            return line.warn("unexpected subfield: " + f);
        }
      }
    };

    Key.prototype.add_subkey = function(line) {
      var key;
      key = new Subkey(line);
      if (key.is_ok()) {
        this._subkeys.push(key);
        return this._top = key;
      } else {
        return line.warn("Bad subkey: " + (key.err().message));
      }
    };

    Key.prototype.add_uid = function(line) {
      var e, u;
      if (((e = line.get(9)) != null) && ((u = pgpu.parse(e)) != null)) {
        return this._userids.push(u);
      }
    };

    return Key;

  })(BaseKey);

  Ignored = (function(_super) {
    __extends(Ignored, _super);

    function Ignored(line) {}

    return Ignored;

  })(Element);

  Line = (function() {
    function Line(txt, number, parser) {
      this.number = number;
      this.parser = parser;
      this.v = txt.split(":");
      if (this.v.length < 2) {
        this.warn("Bad line; expectect at least 2 fields");
      }
    }

    Line.prototype.warn = function(m) {
      return this.parser.warn(this.number + ": " + m);
    };

    Line.prototype.get = function(n) {
      if (n < this.v.length && this.v[n].length) {
        return this.v[n];
      } else {
        return null;
      }
    };

    return Line;

  })();

  exports.Parser = Parser = (function() {
    function Parser(txt) {
      this.txt = txt;
      this._warnings = new Warnings();
      this.init();
    }

    Parser.prototype.warn = function(w) {
      return this._warnings.push(w);
    };

    Parser.prototype.warnings = function() {
      return this._warnings;
    };

    Parser.prototype.init = function() {
      var i, l;
      return this.lines = (function() {
        var _i, _len, _ref, _results;
        _ref = this.txt.split(/\r?\n/);
        _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          l = _ref[i];
          if (l.length > 0) {
            _results.push(new Line(l, i + 1, this));
          }
        }
        return _results;
      }).call(this);
    };

    Parser.prototype.peek = function() {
      if (this.is_eof()) {
        return null;
      } else {
        return this.lines[0];
      }
    };

    Parser.prototype.get = function() {
      if (this.is_eof()) {
        return null;
      } else {
        return this.lines.shift();
      }
    };

    Parser.prototype.is_eof = function() {
      return this.lines.length === 0;
    };

    Parser.prototype.parse_ignored = function(line) {
      return new Ignored(line);
    };

    Parser.prototype.parse = function() {
      var element, index;
      index = new Index();
      while (!this.is_eof()) {
        if ((element = this.parse_element()) && element.is_ok()) {
          index.push_element(element);
        }
      }
      return index;
    };

    Parser.prototype.is_new_key = function(line) {
      var _ref;
      return (line != null) && ((_ref = line.get(0)) === 'pub' || _ref === 'sec');
    };

    Parser.prototype.parse_element = function() {
      var line;
      line = this.get();
      if (this.is_new_key(line)) {
        return this.parse_key(line);
      } else {
        return this.parse_ignored(line);
      }
    };

    Parser.prototype.parse_key = function(first_line) {
      var key, nxt;
      key = new Key(first_line);
      while (((nxt = this.peek()) != null) && !(this.is_new_key(nxt))) {
        this.get();
        key.add_line(nxt);
      }
      return key;
    };

    return Parser;

  })();

  exports.parse = parse = function(txt) {
    return new Parser(txt).parse();
  };

  exports.list_fingerprints = list_fingerprints = function(txt) {
    return parse(txt).fingerprints();
  };

}).call(this);
