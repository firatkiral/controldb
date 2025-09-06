
/*
  ControlDB (node) fs structured Adapter (need to require this script to instance and use it).

  This adapter will save database container and each collection to separate files and
  save collection only if it is dirty.  It is also designed to use a destructured serialization 
  method intended to lower the memory overhead of json serialization.
  
  This adapter utilizes ES6 generator/iterator functionality to stream output and
  uses node linereader module to stream input.  This should lower memory pressure 
  in addition to individual object serializations rather than controldb's default deep object
  serialization.
*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.ControlDBFsStructuredAdapter = factory();
    }
}(this, function () {
  return (function() {

    const fs = require('fs');
    const readline = require('readline');
    const stream = require('stream');
    const crypto = require('crypto');

    function serializeReviver(key, value) {
      if (typeof value === 'string' && value.startsWith('function')) {
        return new Function('return ' + value)();
      }
      else {
        return value;
      }
    }

    /**
     * ControlDB structured (node) filesystem adapter class.
     *     This class fulfills the controldb 'reference' abstract adapter interface which can be applied to other storage methods. 
     *
     * @constructor ControlDBFsStructuredAdapter
     *
     */
    function ControlDBFsStructuredAdapter(password)
    {
        this.mode = "reference";
        this.dbref = null;
        this.dirtyPartitions = [];
        this.password = (typeof password === 'string' && password.length>0) ? password : null;
        this._key = this.password ? ControlDBFsStructuredAdapter.prototype._deriveKey(this.password) : null;
    }

    // derive a 32-byte key from password (sha256)
    ControlDBFsStructuredAdapter.prototype._deriveKey = function(password) {
      return crypto.createHash('sha256').update(password).digest();
    };

    // encrypt a single line (utf8 string) -> returns string with 'ENC$' prefix and base64 payload
    ControlDBFsStructuredAdapter.prototype._encryptLine = function(plaintext) {
      var iv = crypto.randomBytes(12); // 96-bit for GCM
      var cipher = crypto.createCipheriv('aes-256-gcm', this._key, iv);
      var ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      var tag = cipher.getAuthTag();
      // store iv(12) + tag(16) + ciphertext
      var payload = Buffer.concat([iv, tag, ct]).toString('base64');
      return 'ENC$' + payload;
    };

    // decrypt a single line previously encrypted with _encryptLine
    ControlDBFsStructuredAdapter.prototype._decryptLine = function(line) {
      if (typeof line !== 'string') throw new Error('Invalid encrypted line');
      if (!line.startsWith('ENC$')) return line; // treat as plaintext
      var payload = Buffer.from(line.slice(4), 'base64');
      if (payload.length < (12+16)) throw new Error('Invalid encrypted payload');
      var iv = payload.slice(0,12);
      var tag = payload.slice(12,28);
      var ct = payload.slice(28);
      var decipher = crypto.createDecipheriv('aes-256-gcm', this._key, iv);
      decipher.setAuthTag(tag);
      var pt = Buffer.concat([decipher.update(ct), decipher.final()]);
      return pt.toString('utf8');
    };

    /**
     * Generator for constructing lines for file streaming output of db container or collection.
     *
     * @param {object=} options - output format options for use externally to controldb
     * @param {int=} options.partition - can be used to only output an individual collection or db (-1)
     *
     * @returns {string|array} A custom, restructured aggregation of independent serializations.
     * @memberof ControlDBFsStructuredAdapter
     */
    ControlDBFsStructuredAdapter.prototype.generateDestructured = function*(options) {
      var idx, sidx;
      var dbcopy;

      options = options || {};

      if (!options.hasOwnProperty("partition")) {
        options.partition = -1;
      }

      // if partition is -1 we will return database container with no data
      if (options.partition === -1) {
        // instantiate lightweight clone and remove its collection data
        dbcopy = this.dbref.copy();
        
        for(idx=0; idx < dbcopy.collections.length; idx++) {
          dbcopy.collections[idx].data = [];
        }

        yield dbcopy.serialize({
          serializationMethod: "normal"
        });

        return;
      }

      // 'partitioned' along with 'partition' of 0 or greater is a request for single collection serialization
      if (options.partition >= 0) {
        var doccount,
          docidx;

        // dbref collections have all data so work against that
        doccount = this.dbref.collections[options.partition].data.length;

        for(docidx=0; docidx<doccount; docidx++) {
          yield JSON.stringify(this.dbref.collections[options.partition].data[docidx]);
        }
      }
    };

    /**
     * ControlDB persistence adapter interface function which outputs un-prototype db object reference to load from.
     *
     * @param {string} dbname - the name of the database to retrieve.
     * @param {function} callback - callback should accept string param containing db object reference.
     * @memberof ControlDBFsStructuredAdapter
     */
    ControlDBFsStructuredAdapter.prototype.loadDatabase = function(dbname, callback)
    {
      var instream,
        outstream,
        rl,
        self=this;

      this.dbref = null;

      // make sure file exists
      fs.stat(dbname, function (fileErr, stats) {
        var jsonErr;

        if (fileErr) {
          if (fileErr.code === "ENOENT") {
            // file does not exist, so callback with null
            callback(null);
            return;
          }
          else {
            // some other file system error.
            callback(fileErr);
            return;
          }
        }
        else if (!stats.isFile()) {
          // something exists at this path but it isn't a file.
          callback(new Error(dbname + " is not a valid file."));
          return;
        }

        instream = fs.createReadStream(dbname);
        outstream = new stream();
        rl = readline.createInterface(instream, outstream);

        // first, load db container component
        rl.on('line', function(line) {
          // it should single JSON object (a one line file)
          if (self.dbref === null && line !== "") {
            try {
              var raw = line;
              if (raw.indexOf('ENC$') === 0) {
                if (!self._key) {
                  throw new Error('Encrypted file encountered but no password supplied');
                }
                raw = self._decryptLine(raw);
              }
              self.dbref = JSON.parse(raw, serializeReviver);
            } catch (e) {
              jsonErr = e;
            }
          }
        });

        // when that is done, examine its collection array to sequence loading each
        rl.on('close', function() {
          if (jsonErr) {
            // a json error was encountered reading the container file.
            callback(jsonErr);
          } 
          else if (self.dbref.collections.length > 0) {
            self.loadNextCollection(dbname, 0, function() {
              callback(self.dbref);
            });
          }
        });
      });
    };

    /**
     * Recursive function to chain loading of each collection one at a time. 
     * If at some point i can determine how to make async driven generator, this may be converted to generator.
     *
     * @param {string} dbname - the name to give the serialized database within the catalog.
     * @param {int} collectionIndex - the ordinal position of the collection to load.
     * @param {function} callback - callback to pass to next invocation or to call when done
     * @memberof ControlDBFsStructuredAdapter
     */
    ControlDBFsStructuredAdapter.prototype.loadNextCollection = function(dbname, collectionIndex, callback) {
      var instream = fs.createReadStream(dbname + "." + collectionIndex);
      var outstream = new stream();
      var rl = readline.createInterface(instream, outstream);
      var self=this,
        obj;

      rl.on('line', function (line) {
        if (line !== "") {
          try {
            var raw = line;
            if (raw.indexOf('ENC$') === 0) {
              if (!self._key) {
                throw new Error('Encrypted file encountered but no password supplied');
              }
              raw = self._decryptLine(raw, serializeReviver);
            }
            obj = JSON.parse(raw);
          } catch(e) {
            callback(e);
            return;
          }
          self.dbref.collections[collectionIndex].data.push(obj);
        }
      });

      rl.on('close', function (line) {
        instream = null;
        outstream = null;
        rl = null;
        obj = null;

        // if there are more collections, load the next one
        if (++collectionIndex < self.dbref.collections.length) {
          self.loadNextCollection(dbname, collectionIndex, callback);
        }
        // otherwise we are done, callback to loadDatabase so it can return the new db object representation.
        else {
          callback();
        }
      });
    };

    /**
     * Generator for yielding sequence of dirty partition indices to iterate.
     *
     * @memberof ControlDBFsStructuredAdapter
     */
    ControlDBFsStructuredAdapter.prototype.getPartition = function*() {
      var idx,
        clen = this.dbref.collections.length;

      // since database container (partition -1) doesn't have dirty flag at db level, always save
      yield -1;
      
      // yield list of dirty partitions for iterateration
      for(idx=0; idx<clen; idx++) {
        if (this.dbref.collections[idx].dirty) {
          yield idx;
        }
      }
    };

    /**
     * ControlDB reference adapter interface function.  Saves structured json via controldb database object reference.
     *
     * @param {string} dbname - the name to give the serialized database within the catalog.
     * @param {object} dbref - the controldb database object reference to save.
     * @param {function} callback - callback passed obj.success with true or false
     * @memberof ControlDBFsStructuredAdapter
     */
    ControlDBFsStructuredAdapter.prototype.exportDatabase = function(dbname, dbref, callback)
    {
      var idx;

      this.dbref = dbref;

      // create (dirty) partition generator/iterator
      var pi = this.getPartition();

      this.saveNextPartition(dbname, pi, function() {
        callback(null);
      });
      
    };

    /**
     * Utility method for queueing one save at a time
     */
    ControlDBFsStructuredAdapter.prototype.saveNextPartition = function(dbname, pi, callback) {
      var li;
      var filename;
      var self = this;
      var pinext = pi.next();

      if (pinext.done) {
        callback();
        return;
      }

      // db container (partition -1) uses just dbname for filename,
      // otherwise append collection array index to filename
      filename = dbname + ((pinext.value === -1)?"":("." + pinext.value));

      var wstream = fs.createWriteStream(filename);
      //wstream.on('finish', function() {
      wstream.on('close', function() {
        self.saveNextPartition(dbname, pi, callback);
      });

      li = this.generateDestructured({ partition: pinext.value });

      // iterate each of the lines generated by generateDestructured()
      for(var outline of li) {
        var out = outline;
        if (self._key) {
          out = self._encryptLine(outline);
        }
        wstream.write(out + "\n");
      }

      wstream.end();
    };
    
    return ControlDBFsStructuredAdapter;

  }());
}));
