// Generated by IcedCoffeeScript 1.6.3-j
(function() {
  var E, Engine, bufferify, iced, parse, run, set_log, spawn, stream, __iced_k, __iced_k_noop, _log;

  iced = require('iced-coffee-script/lib/coffee-script/iced').runtime;
  __iced_k = __iced_k_noop = function() {};

  spawn = require('child_process').spawn;

  stream = require('./stream');

  E = require('./err').E;

  parse = require('pgp-utils').userid.parse;

  _log = function(x) {
    return console.warn(x.toString('utf8'));
  };

  exports.set_log = set_log = function(log) {
    return _log = log;
  };

  exports.Engine = Engine = (function() {
    function Engine(_arg) {
      this.args = _arg.args, this.stdin = _arg.stdin, this.stdout = _arg.stdout, this.stderr = _arg.stderr, this.name = _arg.name;
      this.stderr || (this.stderr = new stream.FnOutStream(_log));
      this.stdin || (this.stdin = new stream.NullInStream());
      this.stdout || (this.stdout = new stream.NullOutStream());
      this._exit_code = null;
      this._exit_cb = null;
      this._n_out = 0;
    }

    Engine.prototype.run = function() {
      this.proc = spawn(this.name, this.args);
      this.stdin.pipe(this.proc.stdin);
      this.proc.stdout.pipe(this.stdout);
      this.proc.stderr.pipe(this.stderr);
      this.pid = this.proc.pid;
      this._n_out = 3;
      this.proc.on('exit', (function(_this) {
        return function(status) {
          return _this._got_exit(status);
        };
      })(this));
      this.proc.stdout.on('end', (function(_this) {
        return function() {
          return _this._maybe_finish();
        };
      })(this));
      this.proc.stderr.on('end', (function(_this) {
        return function() {
          return _this._maybe_finish();
        };
      })(this));
      return this;
    };

    Engine.prototype._got_exit = function(status) {
      this._exit_code = status;
      this.proc = null;
      return this._maybe_finish();
    };

    Engine.prototype._maybe_finish = function() {
      var ecb;
      if (--this._n_out <= 0) {
        if ((ecb = this._exit_cb) != null) {
          this._exit_cb = null;
          ecb(this._exit_code);
        }
        return this.pid = -1;
      }
    };

    Engine.prototype.wait = function(cb) {
      if (this._exit_code && this._n_out <= 0) {
        return cb(this._exit_code);
      } else {
        return this._exit_cb = cb;
      }
    };

    return Engine;

  })();

  exports.bufferify = bufferify = function(x) {
    if (x == null) {
      return null;
    } else if (typeof x === 'string') {
      return new Buffer(x, 'utf8');
    } else if (Buffer.isBuffer(x)) {
      return x;
    } else {
      return null;
    }
  };

  exports.run = run = function(inargs, cb) {
    var args, b, def_out, eklass, err, name, out, quiet, rc, stderr, stdin, stdout, ___iced_passed_deferral, __iced_deferrals, __iced_k;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    args = inargs.args, stdin = inargs.stdin, stdout = inargs.stdout, stderr = inargs.stderr, quiet = inargs.quiet, name = inargs.name, eklass = inargs.eklass;
    if ((b = bufferify(stdin)) != null) {
      stdin = new stream.BufferInStream(b);
    }
    if (quiet) {
      stderr = new stream.NullOutStream();
    }
    if (stdout == null) {
      def_out = true;
      stdout = new stream.BufferOutStream();
    } else {
      def_out = false;
    }
    err = null;
    (function(_this) {
      return (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "/Users/max/src/gpg-wrapper/src/cmd.iced"
        });
        (new Engine({
          args: args,
          stdin: stdin,
          stdout: stdout,
          stderr: stderr,
          name: name
        })).run().wait(__iced_deferrals.defer({
          assign_fn: (function() {
            return function() {
              return rc = arguments[0];
            };
          })(),
          lineno: 75
        }));
        __iced_deferrals._fulfill();
      });
    })(this)((function(_this) {
      return function() {
        if (rc !== 0) {
          eklass || (eklass = E.CmdError);
          err = new eklass("exit code " + rc);
          err.rc = rc;
        }
        out = def_out != null ? stdout.data() : null;
        return cb(err, out);
      };
    })(this));
  };

}).call(this);