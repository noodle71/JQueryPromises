var PromisesHandler = (function () {

  function PromisesHandler(settings) {
    this.$logContainer = settings.logContainer || $('.half.logger');
    this.$resultContainer = settings.resultContainer || $('.result');
    this.pKey = settings.primaryKey || 'userId';
    this.mapFields = settings.map || {'tasks': [], 'comments': [], 'user': []};
  }

  var _proto = PromisesHandler.prototype;

  //Global variables and Constants
  _proto.ROOT = 'http://jsonplaceholder.typicode.com';
  _proto.URL_ALL_POSTS = '/posts';
  _proto.URL_ALL_USER = '/users';
  _proto.URL_ALL_TASKS = '/todos';
  _proto.PARAM_USER_ID = '?userId=';
  _proto.PARAM_ID = '?id=';

  _proto.URL_USER_POSTS = _proto.URL_ALL_POSTS + _proto.PARAM_USER_ID;
  _proto.URL_USER_TASKS = _proto.URL_ALL_TASKS + _proto.PARAM_USER_ID;
  _proto.URL_USER_INFO = _proto.URL_ALL_USER + _proto.PARAM_ID;

  /**
   * Fetches some JSON data and initialize a map with that.
   * @param url. End point where data is.
   * @param pKey. Primary key for the map.
   * @param field. First field added to the map.
   * @returns {Promise}
   */
  _proto.getInitialData = function (url, pKey, field) {
    this.log('Getting initial data');
    return $.ajax({'url': this.ROOT + url})
      .then(this.createMap(pKey, field, url));
  };

  /**
   * Given a JSON, initializes a map with that data.
   * @param pKey. Primary key for the map.
   * @param field. First field added to the map.
   * @param url. URL where data was fetched from
   * @returns {Anonymous Function} -> {Object}
   */
  _proto.createMap = function (pKey, field, url) {
    return function (data) {
      var hm = {};
      this.log(url);
      data.forEach(this.fillUserMap(hm, pKey, field));
      return hm;
    }.bind(this);
  };

  /**
   * Fill map data with JSON.
   * @param hm. Reference to the map.
   * @param key. Primary key for the map.
   * @param field. First field added to the map.
   * @returns {Anonymous Function}
   */
  _proto.fillUserMap = function (hm, key, field) {
    return function (data) {
      var pKey = data[key];
      if (pKey in hm) hm[pKey][field].push(data);
      else {
        //Have to clone the object mapFields
        hm[pKey] = JSON.parse(JSON.stringify(this.mapFields));
        hm[pKey][field].push(data);
      }
    }.bind(this);
  };

  /**
   * Promise solves several calls to an end point and add all data to the map.
   * @param fun. Function to get data from an end point.
   * @param field. Field of the map which will be filled with the data.
   * @returns {Anonymous Function} -> {Promise}
   */
  _proto.solveRequests = function (fun, field) {
    return function (hm) {
      return this.whenSolveSeveralRequest(hm, fun)
        .then(this.fillMapWithExtInfo(hm, field));
    }.bind(this);
  };

  /**
   * Return a promise that solves several promises.
   * @param hm. Map where info is in.
   * @param fun. Function to get data from an end point.
   * @returns {Promise}
   */
  _proto.whenSolveSeveralRequest = function (hm, fun) {
    return $.when.apply($, this.mapFunToObjKeys(hm, fun));
  };

  /**
   * Apply a function to the map keys.
   * @param hm. Map where info is in.
   * @param fun. Function to get data from an end point.
   * @returns {Array}
   */
  _proto.mapFunToObjKeys = function (hm, fun) {
    return $.map(Object.keys(hm), fun);
  };

  /**
   * Fill the map with the results of several promises.
   * @param hm. Map where info is in.
   * @param field. Field of the map which will be filled with the data.
   * @returns {Anonymous Function} -> {Object}
   */
  _proto.fillMapWithExtInfo = function (hm, field) {
    return function (data) {
      var pKey = this.pKey;
      $(arguments).each(function () {
        $(this).each(function () {
          hm[this[pKey]][field] = hm[this[pKey]][field].concat(this.data);
        });
      });
      return hm;
    }.bind(this);
  };

  /**
   * Get data from an endpoint returning it as a promise.
   * @param params. URL parameters.
   * @returns {Anonymous Function} -> {Promise}
   */
  _proto.getFromURL = function (params) {
    return function (pKey) {
      var url = {'url': this.ROOT + params + pKey};
      return $.ajax(url).then(this.returnData(pKey, params + pKey, this.pKey));
    }.bind(this);
  };


  /**
   * Return data as an object. Mapping the data to the primary key.
   * @param pKey. Primary key value.
   * @param url. URL Response collected.
   * @param pKeyName. Name of the primary key.
   * @returns {Anonymous Function} -> {Object}
   */
  _proto.returnData = function (pKey, url, pKeyName) {
    return function (data) {
      var obj = {'data': data};
      obj[pKeyName] = pKey;
      this.log(url);
      return obj;
    }.bind(this);
  };

  /**
   * Convert an Object into text.
   * @returns {Anonymous Function}
   */
  _proto.stringifyResult = function () {
    return function (data) {
      var txt = JSON.stringify(data, null, " ");
      console.log(txt);
      this.$resultContainer.val(txt);
    }.bind(this);
  };

  /**
   * Show a log
   * @param txt. Message to log.
   * @param error. Boolean to show messages as errors.
   */
  _proto.log = function (txt, error) {
    var logOp = error ? 'error' : 'log';
    console[logOp](txt);
    this.$logContainer.append($('<p>', {'text': txt, 'class': logOp}));
  };

  /**
   * Display an error.
   * @returns {Anonymous Function}
   */
  _proto.error = function () {
    return function (e) {
      this.log(JSON.stringify(e), true);
    }.bind(this);
  };

  return PromisesHandler;

})();