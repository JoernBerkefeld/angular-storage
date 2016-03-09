(function() {


// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Grunt

angular.module('angular-storage',
    [
      'angular-storage.store'
    ]);

angular.module('angular-storage.cookieStorage', ['ngCookies'])
  .service('cookieStorage', ["$cookies", function ($cookies) {

    this.set = function (what, value) {
      return $cookies.put(what, value);
    };

    this.get = function (what) {
      return $cookies.get(what);
    };

    this.remove = function (what) {
      return $cookies.remove(what);
    };
  }]);

angular.module('angular-storage.internalStore', ['angular-storage.localStorage', 'angular-storage.sessionStorage'])
  .factory('InternalStore', ["$log", "$injector", function($log, $injector) {

    function InternalStore(namespace, storage, delimiter) {
      this.namespace = namespace || null;
      this.delimiter = delimiter || '.';
      this.inMemoryCache = {};
      this.storage = $injector.get(storage || 'localStorage');
      this.sessionStorage = $injector.get('sessionStorage');
  }

    InternalStore.prototype.getNamespacedKey = function(key) {
      if (!this.namespace) {
        return key;
      } else {
        return [this.namespace, key].join(this.delimiter);
      }
    };

    function set(name,elem,type) {
      this.inMemoryCache[name] = elem;
      type.set(this.getNamespacedKey(name), JSON.stringify(elem));
    }
    function get(name,type) {
      var obj = null;
      if (name in this.inMemoryCache) {
        return this.inMemoryCache[name];
      }
      var saved = type.get(this.getNamespacedKey(name));
      try {

        if (typeof saved === 'undefined' || saved === 'undefined') {
          obj = undefined;
        } else {
          obj = JSON.parse(saved);
        }

        this.inMemoryCache[name] = obj;
      } catch(e) {
        $log.error('Error parsing saved value', e);
        this.remove(name);
      }
      return obj;
    }
    function remove(name,type) {
      this.inMemoryCache[name] = null;
      type.remove(this.getNamespacedKey(name));
    }


    InternalStore.prototype.set = function(name, elem) {
      set.apply(this,name,elem,this.storage);
    };

    InternalStore.prototype.get = function(name) {
      return get.apply(this,name,this.storage);
    };

    InternalStore.prototype.remove = function(name) {
      remove.apply(this,name,this.storage);
    };
    InternalStore.prototype.setSession = function(name, elem) {
      set.apply(this,name,elem,this.sessionStorage);
    };

    InternalStore.prototype.getSession = function(name) {
      return get.apply(this,name,this.sessionStorage);
    };

    InternalStore.prototype.removeSession = function(name) {
      remove.apply(this,name,this.sessionStorage);
    };
    
    return InternalStore;
  }]);


angular.module('angular-storage.localStorage', ['angular-storage.cookieStorage'])
  .service('localStorage', ["$window", "$injector", function ($window, $injector) {
    var localStorageAvailable;

    try {
      $window.localStorage.setItem('testKey', 'test');
      $window.localStorage.removeItem('testKey');
      localStorageAvailable = true;
    } catch(e) {
      localStorageAvailable = false;
    }

    if (localStorageAvailable) {
      this.set = function (what, value) {
        return $window.localStorage.setItem(what, value);
      };

      this.get = function (what) {
        return $window.localStorage.getItem(what);
      };

      this.remove = function (what) {
        return $window.localStorage.removeItem(what);
      };
    } else {
      var cookieStorage = $injector.get('cookieStorage');

      this.set = cookieStorage.set;
      this.get = cookieStorage.get;
      this.remove = cookieStorage.remove;
    }
  }]);

angular.module('angular-storage.sessionStorage', ['angular-storage.cookieStorage'])
  .service('sessionStorage', ["$window", "$injector", function ($window, $injector) {
    var sessionStorageAvailable;

    try {
      $window.sessionStorage.setItem('testKey', 'test');
      $window.sessionStorage.removeItem('testKey');
      sessionStorageAvailable = true;
    } catch(e) {
      sessionStorageAvailable = false;
    }

    if (sessionStorageAvailable) {
      this.set = function (what, value) {
        return $window.sessionStorage.setItem(what, value);
      };

      this.get = function (what) {
        return $window.sessionStorage.getItem(what);
      };

      this.remove = function (what) {
        return $window.sessionStorage.removeItem(what);
      };
    } else {
      var cookieStorage = $injector.get('cookieStorage');

      this.set = cookieStorage.set;
      this.get = cookieStorage.get;
      this.remove = cookieStorage.remove;
    }
  }]);

angular.module('angular-storage.store', ['angular-storage.internalStore'])
  .provider('store', function() {

    // the default storage
    var _storage = 'localStorage';

    /**
     * Sets the storage.
     *
     * @param {String} storage The storage name
     */
    this.setStore = function(storage) {
      if (storage && angular.isString(storage)) {
        _storage = storage;
      }
    };

    this.$get = ["InternalStore", function(InternalStore) {
      var store = new InternalStore(null, _storage);

      /**
       * Returns a namespaced store
       *
       * @param {String} namespace The namespace
       * @param {String} storage The name of the storage service
       * @param {String} key The key
       * @returns {InternalStore}
       */
      store.getNamespacedStore = function(namespace, storage, key) {
        return new InternalStore(namespace, storage, key);
      };

      return store;
    }];
  });


}());
