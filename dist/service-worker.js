(function () {
    'use strict';

    // @ts-ignore
    try {
        self['workbox:core:5.1.2'] && _();
    }
    catch (e) { }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const fallback = (code, ...args) => {
        let msg = code;
        if (args.length > 0) {
            msg += ` :: ${JSON.stringify(args)}`;
        }
        return msg;
    };
    const messageGenerator = 
        fallback ;

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Workbox errors should be thrown with this class.
     * This allows use to ensure the type easily in tests,
     * helps developers identify errors from workbox
     * easily and allows use to optimise error
     * messages correctly.
     *
     * @private
     */
    class WorkboxError extends Error {
        /**
         *
         * @param {string} errorCode The error code that
         * identifies this particular error.
         * @param {Object=} details Any relevant arguments
         * that will help developers identify issues should
         * be added as a key on the context object.
         */
        constructor(errorCode, details) {
            const message = messageGenerator(errorCode, details);
            super(message);
            this.name = errorCode;
            this.details = details;
        }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const finalAssertExports =  null ;

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const _cacheNameDetails = {
        googleAnalytics: 'googleAnalytics',
        precache: 'precache-v2',
        prefix: 'workbox',
        runtime: 'runtime',
        suffix: typeof registration !== 'undefined' ? registration.scope : '',
    };
    const _createCacheName = (cacheName) => {
        return [_cacheNameDetails.prefix, cacheName, _cacheNameDetails.suffix]
            .filter((value) => value && value.length > 0)
            .join('-');
    };
    const eachCacheNameDetail = (fn) => {
        for (const key of Object.keys(_cacheNameDetails)) {
            fn(key);
        }
    };
    const cacheNames = {
        updateDetails: (details) => {
            eachCacheNameDetail((key) => {
                if (typeof details[key] === 'string') {
                    _cacheNameDetails[key] = details[key];
                }
            });
        },
        getGoogleAnalyticsName: (userCacheName) => {
            return userCacheName || _createCacheName(_cacheNameDetails.googleAnalytics);
        },
        getPrecacheName: (userCacheName) => {
            return userCacheName || _createCacheName(_cacheNameDetails.precache);
        },
        getPrefix: () => {
            return _cacheNameDetails.prefix;
        },
        getRuntimeName: (userCacheName) => {
            return userCacheName || _createCacheName(_cacheNameDetails.runtime);
        },
        getSuffix: () => {
            return _cacheNameDetails.suffix;
        },
    };

    /*
      Copyright 2019 Google LLC
      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const logger = ( null );

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    // Callbacks to be executed whenever there's a quota error.
    const quotaErrorCallbacks = new Set();

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Runs all of the callback functions, one at a time sequentially, in the order
     * in which they were registered.
     *
     * @memberof module:workbox-core
     * @private
     */
    async function executeQuotaErrorCallbacks() {
        for (const callback of quotaErrorCallbacks) {
            await callback();
        }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const getFriendlyURL = (url) => {
        const urlObj = new URL(String(url), location.href);
        // See https://github.com/GoogleChrome/workbox/issues/2323
        // We want to include everything, except for the origin if it's same-origin.
        return urlObj.href.replace(new RegExp(`^${location.origin}`), '');
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const pluginUtils = {
        filter: (plugins, callbackName) => {
            return plugins.filter((plugin) => callbackName in plugin);
        },
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Checks the list of plugins for the cacheKeyWillBeUsed callback, and
     * executes any of those callbacks found in sequence. The final `Request` object
     * returned by the last plugin is treated as the cache key for cache reads
     * and/or writes.
     *
     * @param {Object} options
     * @param {Request} options.request
     * @param {string} options.mode
     * @param {Array<Object>} [options.plugins=[]]
     * @return {Promise<Request>}
     *
     * @private
     * @memberof module:workbox-core
     */
    const _getEffectiveRequest = async ({ request, mode, plugins = [], }) => {
        const cacheKeyWillBeUsedPlugins = pluginUtils.filter(plugins, "cacheKeyWillBeUsed" /* CACHE_KEY_WILL_BE_USED */);
        let effectiveRequest = request;
        for (const plugin of cacheKeyWillBeUsedPlugins) {
            effectiveRequest = await plugin["cacheKeyWillBeUsed" /* CACHE_KEY_WILL_BE_USED */].call(plugin, { mode, request: effectiveRequest });
            if (typeof effectiveRequest === 'string') {
                effectiveRequest = new Request(effectiveRequest);
            }
        }
        return effectiveRequest;
    };
    /**
     * This method will call cacheWillUpdate on the available plugins (or use
     * status === 200) to determine if the Response is safe and valid to cache.
     *
     * @param {Object} options
     * @param {Request} options.request
     * @param {Response} options.response
     * @param {Event} [options.event]
     * @param {Array<Object>} [options.plugins=[]]
     * @return {Promise<Response>}
     *
     * @private
     * @memberof module:workbox-core
     */
    const _isResponseSafeToCache = async ({ request, response, event, plugins = [], }) => {
        let responseToCache = response;
        let pluginsUsed = false;
        for (const plugin of plugins) {
            if ("cacheWillUpdate" /* CACHE_WILL_UPDATE */ in plugin) {
                pluginsUsed = true;
                const pluginMethod = plugin["cacheWillUpdate" /* CACHE_WILL_UPDATE */];
                responseToCache = await pluginMethod.call(plugin, {
                    request,
                    response: responseToCache,
                    event,
                });
                if (!responseToCache) {
                    break;
                }
            }
        }
        if (!pluginsUsed) {
            responseToCache = responseToCache && responseToCache.status === 200 ?
                responseToCache : undefined;
        }
        return responseToCache ? responseToCache : null;
    };
    /**
     * This is a wrapper around cache.match().
     *
     * @param {Object} options
     * @param {string} options.cacheName Name of the cache to match against.
     * @param {Request} options.request The Request that will be used to look up
     *     cache entries.
     * @param {Event} [options.event] The event that prompted the action.
     * @param {Object} [options.matchOptions] Options passed to cache.match().
     * @param {Array<Object>} [options.plugins=[]] Array of plugins.
     * @return {Response} A cached response if available.
     *
     * @private
     * @memberof module:workbox-core
     */
    const matchWrapper = async ({ cacheName, request, event, matchOptions, plugins = [], }) => {
        const cache = await self.caches.open(cacheName);
        const effectiveRequest = await _getEffectiveRequest({
            plugins, request, mode: 'read'
        });
        let cachedResponse = await cache.match(effectiveRequest, matchOptions);
        for (const plugin of plugins) {
            if ("cachedResponseWillBeUsed" /* CACHED_RESPONSE_WILL_BE_USED */ in plugin) {
                const pluginMethod = plugin["cachedResponseWillBeUsed" /* CACHED_RESPONSE_WILL_BE_USED */];
                cachedResponse = await pluginMethod.call(plugin, {
                    cacheName,
                    event,
                    matchOptions,
                    cachedResponse,
                    request: effectiveRequest,
                });
            }
        }
        return cachedResponse;
    };
    /**
     * Wrapper around cache.put().
     *
     * Will call `cacheDidUpdate` on plugins if the cache was updated, using
     * `matchOptions` when determining what the old entry is.
     *
     * @param {Object} options
     * @param {string} options.cacheName
     * @param {Request} options.request
     * @param {Response} options.response
     * @param {Event} [options.event]
     * @param {Array<Object>} [options.plugins=[]]
     * @param {Object} [options.matchOptions]
     *
     * @private
     * @memberof module:workbox-core
     */
    const putWrapper = async ({ cacheName, request, response, event, plugins = [], matchOptions, }) => {
        const effectiveRequest = await _getEffectiveRequest({
            plugins, request, mode: 'write'
        });
        if (!response) {
            throw new WorkboxError('cache-put-with-no-response', {
                url: getFriendlyURL(effectiveRequest.url),
            });
        }
        const responseToCache = await _isResponseSafeToCache({
            event,
            plugins,
            response,
            request: effectiveRequest,
        });
        if (!responseToCache) {
            return;
        }
        const cache = await self.caches.open(cacheName);
        const updatePlugins = pluginUtils.filter(plugins, "cacheDidUpdate" /* CACHE_DID_UPDATE */);
        const oldResponse = updatePlugins.length > 0 ?
            await matchWrapper({ cacheName, matchOptions, request: effectiveRequest }) :
            null;
        try {
            await cache.put(effectiveRequest, responseToCache);
        }
        catch (error) {
            // See https://developer.mozilla.org/en-US/docs/Web/API/DOMException#exception-QuotaExceededError
            if (error.name === 'QuotaExceededError') {
                await executeQuotaErrorCallbacks();
            }
            throw error;
        }
        for (const plugin of updatePlugins) {
            await plugin["cacheDidUpdate" /* CACHE_DID_UPDATE */].call(plugin, {
                cacheName,
                event,
                oldResponse,
                newResponse: responseToCache,
                request: effectiveRequest,
            });
        }
    };
    const cacheWrapper = {
        put: putWrapper,
        match: matchWrapper,
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Wrapper around the fetch API.
     *
     * Will call requestWillFetch on available plugins.
     *
     * @param {Object} options
     * @param {Request|string} options.request
     * @param {Object} [options.fetchOptions]
     * @param {ExtendableEvent} [options.event]
     * @param {Array<Object>} [options.plugins=[]]
     * @return {Promise<Response>}
     *
     * @private
     * @memberof module:workbox-core
     */
    const wrappedFetch = async ({ request, fetchOptions, event, plugins = [], }) => {
        if (typeof request === 'string') {
            request = new Request(request);
        }
        // We *should* be able to call `await event.preloadResponse` even if it's
        // undefined, but for some reason, doing so leads to errors in our Node unit
        // tests. To work around that, explicitly check preloadResponse's value first.
        if (event instanceof FetchEvent && event.preloadResponse) {
            const possiblePreloadResponse = await event.preloadResponse;
            if (possiblePreloadResponse) {
                return possiblePreloadResponse;
            }
        }
        const failedFetchPlugins = pluginUtils.filter(plugins, "fetchDidFail" /* FETCH_DID_FAIL */);
        // If there is a fetchDidFail plugin, we need to save a clone of the
        // original request before it's either modified by a requestWillFetch
        // plugin or before the original request's body is consumed via fetch().
        const originalRequest = failedFetchPlugins.length > 0 ?
            request.clone() : null;
        try {
            for (const plugin of plugins) {
                if ("requestWillFetch" /* REQUEST_WILL_FETCH */ in plugin) {
                    const pluginMethod = plugin["requestWillFetch" /* REQUEST_WILL_FETCH */];
                    const requestClone = request.clone();
                    request = await pluginMethod.call(plugin, {
                        request: requestClone,
                        event,
                    });
                    if ("production" !== 'production') {
                        if (request) {
                            finalAssertExports.isInstance(request, Request, {
                                moduleName: 'Plugin',
                                funcName: "cachedResponseWillBeUsed" /* CACHED_RESPONSE_WILL_BE_USED */,
                                isReturnValueProblem: true,
                            });
                        }
                    }
                }
            }
        }
        catch (err) {
            throw new WorkboxError('plugin-error-request-will-fetch', {
                thrownError: err,
            });
        }
        // The request can be altered by plugins with `requestWillFetch` making
        // the original request (Most likely from a `fetch` event) to be different
        // to the Request we make. Pass both to `fetchDidFail` to aid debugging.
        const pluginFilteredRequest = request.clone();
        try {
            let fetchResponse;
            // See https://github.com/GoogleChrome/workbox/issues/1796
            if (request.mode === 'navigate') {
                fetchResponse = await fetch(request);
            }
            else {
                fetchResponse = await fetch(request, fetchOptions);
            }
            if ("production" !== 'production') {
                logger.debug(`Network request for ` +
                    `'${getFriendlyURL(request.url)}' returned a response with ` +
                    `status '${fetchResponse.status}'.`);
            }
            for (const plugin of plugins) {
                if ("fetchDidSucceed" /* FETCH_DID_SUCCEED */ in plugin) {
                    fetchResponse = await plugin["fetchDidSucceed" /* FETCH_DID_SUCCEED */]
                        .call(plugin, {
                        event,
                        request: pluginFilteredRequest,
                        response: fetchResponse,
                    });
                    if ("production" !== 'production') {
                        if (fetchResponse) {
                            finalAssertExports.isInstance(fetchResponse, Response, {
                                moduleName: 'Plugin',
                                funcName: "fetchDidSucceed" /* FETCH_DID_SUCCEED */,
                                isReturnValueProblem: true,
                            });
                        }
                    }
                }
            }
            return fetchResponse;
        }
        catch (error) {
            for (const plugin of failedFetchPlugins) {
                await plugin["fetchDidFail" /* FETCH_DID_FAIL */].call(plugin, {
                    error,
                    event,
                    originalRequest: originalRequest.clone(),
                    request: pluginFilteredRequest.clone(),
                });
            }
            throw error;
        }
    };
    const fetchWrapper = {
        fetch: wrappedFetch,
    };

    // @ts-ignore
    try {
        self['workbox:strategies:5.1.2'] && _();
    }
    catch (e) { }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * An implementation of a [cache-first]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network}
     * request strategy.
     *
     * A cache first strategy is useful for assets that have been revisioned,
     * such as URLs like `/styles/example.a8f5f1.css`, since they
     * can be cached for long periods of time.
     *
     * If the network request fails, and there is no cache match, this will throw
     * a `WorkboxError` exception.
     *
     * @memberof module:workbox-strategies
     */
    class CacheFirst {
        /**
         * @param {Object} options
         * @param {string} options.cacheName Cache name to store and retrieve
         * requests. Defaults to cache names provided by
         * [workbox-core]{@link module:workbox-core.cacheNames}.
         * @param {Array<Object>} options.plugins [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
         * to use in conjunction with this caching strategy.
         * @param {Object} options.fetchOptions Values passed along to the
         * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
         * of all fetch() requests made by this strategy.
         * @param {Object} options.matchOptions [`CacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions)
         */
        constructor(options = {}) {
            this._cacheName = cacheNames.getRuntimeName(options.cacheName);
            this._plugins = options.plugins || [];
            this._fetchOptions = options.fetchOptions;
            this._matchOptions = options.matchOptions;
        }
        /**
         * This method will perform a request strategy and follows an API that
         * will work with the
         * [Workbox Router]{@link module:workbox-routing.Router}.
         *
         * @param {Object} options
         * @param {Request|string} options.request A request to run this strategy for.
         * @param {Event} [options.event] The event that triggered the request.
         * @return {Promise<Response>}
         */
        async handle({ event, request }) {
            if (typeof request === 'string') {
                request = new Request(request);
            }
            let response = await cacheWrapper.match({
                cacheName: this._cacheName,
                request,
                event,
                matchOptions: this._matchOptions,
                plugins: this._plugins,
            });
            let error;
            if (!response) {
                try {
                    response = await this._getFromNetwork(request, event);
                }
                catch (err) {
                    error = err;
                }
            }
            if (!response) {
                throw new WorkboxError('no-response', { url: request.url, error });
            }
            return response;
        }
        /**
         * Handles the network and cache part of CacheFirst.
         *
         * @param {Request} request
         * @param {Event} [event]
         * @return {Promise<Response>}
         *
         * @private
         */
        async _getFromNetwork(request, event) {
            const response = await fetchWrapper.fetch({
                request,
                event,
                fetchOptions: this._fetchOptions,
                plugins: this._plugins,
            });
            // Keep the service worker while we put the request to the cache
            const responseClone = response.clone();
            const cachePutPromise = cacheWrapper.put({
                cacheName: this._cacheName,
                request,
                response: responseClone,
                event,
                plugins: this._plugins,
            });
            if (event) {
                try {
                    event.waitUntil(cachePutPromise);
                }
                catch (error) {
                }
            }
            return response;
        }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * An implementation of a
     * [cache-only]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only}
     * request strategy.
     *
     * This class is useful if you want to take advantage of any
     * [Workbox plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}.
     *
     * If there is no cache match, this will throw a `WorkboxError` exception.
     *
     * @memberof module:workbox-strategies
     */
    class CacheOnly {
        /**
         * @param {Object} options
         * @param {string} options.cacheName Cache name to store and retrieve
         * requests. Defaults to cache names provided by
         * [workbox-core]{@link module:workbox-core.cacheNames}.
         * @param {Array<Object>} options.plugins [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
         * to use in conjunction with this caching strategy.
         * @param {Object} options.matchOptions [`CacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions)
         */
        constructor(options = {}) {
            this._cacheName = cacheNames.getRuntimeName(options.cacheName);
            this._plugins = options.plugins || [];
            this._matchOptions = options.matchOptions;
        }
        /**
         * This method will perform a request strategy and follows an API that
         * will work with the
         * [Workbox Router]{@link module:workbox-routing.Router}.
         *
         * @param {Object} options
         * @param {Request|string} options.request A request to run this strategy for.
         * @param {Event} [options.event] The event that triggered the request.
         * @return {Promise<Response>}
         */
        async handle({ event, request }) {
            if (typeof request === 'string') {
                request = new Request(request);
            }
            const response = await cacheWrapper.match({
                cacheName: this._cacheName,
                request,
                event,
                matchOptions: this._matchOptions,
                plugins: this._plugins,
            });
            if (!response) {
                throw new WorkboxError('no-response', { url: request.url });
            }
            return response;
        }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    let supportStatus;
    /**
     * A utility function that determines whether the current browser supports
     * constructing a new `Response` from a `response.body` stream.
     *
     * @return {boolean} `true`, if the current browser can successfully
     *     construct a `Response` from a `response.body` stream, `false` otherwise.
     *
     * @private
     */
    function canConstructResponseFromBodyStream() {
        if (supportStatus === undefined) {
            const testResponse = new Response('');
            if ('body' in testResponse) {
                try {
                    new Response(testResponse.body);
                    supportStatus = true;
                }
                catch (error) {
                    supportStatus = false;
                }
            }
            supportStatus = false;
        }
        return supportStatus;
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * A class that wraps common IndexedDB functionality in a promise-based API.
     * It exposes all the underlying power and functionality of IndexedDB, but
     * wraps the most commonly used features in a way that's much simpler to use.
     *
     * @private
     */
    class DBWrapper {
        /**
         * @param {string} name
         * @param {number} version
         * @param {Object=} [callback]
         * @param {!Function} [callbacks.onupgradeneeded]
         * @param {!Function} [callbacks.onversionchange] Defaults to
         *     DBWrapper.prototype._onversionchange when not specified.
         * @private
         */
        constructor(name, version, { onupgradeneeded, onversionchange, } = {}) {
            this._db = null;
            this._name = name;
            this._version = version;
            this._onupgradeneeded = onupgradeneeded;
            this._onversionchange = onversionchange || (() => this.close());
        }
        /**
         * Returns the IDBDatabase instance (not normally needed).
         * @return {IDBDatabase|undefined}
         *
         * @private
         */
        get db() {
            return this._db;
        }
        /**
         * Opens a connected to an IDBDatabase, invokes any onupgradedneeded
         * callback, and added an onversionchange callback to the database.
         *
         * @return {IDBDatabase}
         * @private
         */
        async open() {
            if (this._db)
                return;
            this._db = await new Promise((resolve, reject) => {
                // This flag is flipped to true if the timeout callback runs prior
                // to the request failing or succeeding. Note: we use a timeout instead
                // of an onblocked handler since there are cases where onblocked will
                // never never run. A timeout better handles all possible scenarios:
                // https://github.com/w3c/IndexedDB/issues/223
                let openRequestTimedOut = false;
                setTimeout(() => {
                    openRequestTimedOut = true;
                    reject(new Error('The open request was blocked and timed out'));
                }, this.OPEN_TIMEOUT);
                const openRequest = indexedDB.open(this._name, this._version);
                openRequest.onerror = () => reject(openRequest.error);
                openRequest.onupgradeneeded = (evt) => {
                    if (openRequestTimedOut) {
                        openRequest.transaction.abort();
                        openRequest.result.close();
                    }
                    else if (typeof this._onupgradeneeded === 'function') {
                        this._onupgradeneeded(evt);
                    }
                };
                openRequest.onsuccess = () => {
                    const db = openRequest.result;
                    if (openRequestTimedOut) {
                        db.close();
                    }
                    else {
                        db.onversionchange = this._onversionchange.bind(this);
                        resolve(db);
                    }
                };
            });
            return this;
        }
        /**
         * Polyfills the native `getKey()` method. Note, this is overridden at
         * runtime if the browser supports the native method.
         *
         * @param {string} storeName
         * @param {*} query
         * @return {Array}
         * @private
         */
        async getKey(storeName, query) {
            return (await this.getAllKeys(storeName, query, 1))[0];
        }
        /**
         * Polyfills the native `getAll()` method. Note, this is overridden at
         * runtime if the browser supports the native method.
         *
         * @param {string} storeName
         * @param {*} query
         * @param {number} count
         * @return {Array}
         * @private
         */
        async getAll(storeName, query, count) {
            return await this.getAllMatching(storeName, { query, count });
        }
        /**
         * Polyfills the native `getAllKeys()` method. Note, this is overridden at
         * runtime if the browser supports the native method.
         *
         * @param {string} storeName
         * @param {*} query
         * @param {number} count
         * @return {Array}
         * @private
         */
        async getAllKeys(storeName, query, count) {
            const entries = await this.getAllMatching(storeName, { query, count, includeKeys: true });
            return entries.map((entry) => entry.key);
        }
        /**
         * Supports flexible lookup in an object store by specifying an index,
         * query, direction, and count. This method returns an array of objects
         * with the signature .
         *
         * @param {string} storeName
         * @param {Object} [opts]
         * @param {string} [opts.index] The index to use (if specified).
         * @param {*} [opts.query]
         * @param {IDBCursorDirection} [opts.direction]
         * @param {number} [opts.count] The max number of results to return.
         * @param {boolean} [opts.includeKeys] When true, the structure of the
         *     returned objects is changed from an array of values to an array of
         *     objects in the form {key, primaryKey, value}.
         * @return {Array}
         * @private
         */
        async getAllMatching(storeName, { index, query = null, // IE/Edge errors if query === `undefined`.
        direction = 'next', count, includeKeys = false, } = {}) {
            return await this.transaction([storeName], 'readonly', (txn, done) => {
                const store = txn.objectStore(storeName);
                const target = index ? store.index(index) : store;
                const results = [];
                const request = target.openCursor(query, direction);
                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor) {
                        results.push(includeKeys ? cursor : cursor.value);
                        if (count && results.length >= count) {
                            done(results);
                        }
                        else {
                            cursor.continue();
                        }
                    }
                    else {
                        done(results);
                    }
                };
            });
        }
        /**
         * Accepts a list of stores, a transaction type, and a callback and
         * performs a transaction. A promise is returned that resolves to whatever
         * value the callback chooses. The callback holds all the transaction logic
         * and is invoked with two arguments:
         *   1. The IDBTransaction object
         *   2. A `done` function, that's used to resolve the promise when
         *      when the transaction is done, if passed a value, the promise is
         *      resolved to that value.
         *
         * @param {Array<string>} storeNames An array of object store names
         *     involved in the transaction.
         * @param {string} type Can be `readonly` or `readwrite`.
         * @param {!Function} callback
         * @return {*} The result of the transaction ran by the callback.
         * @private
         */
        async transaction(storeNames, type, callback) {
            await this.open();
            return await new Promise((resolve, reject) => {
                const txn = this._db.transaction(storeNames, type);
                txn.onabort = () => reject(txn.error);
                txn.oncomplete = () => resolve();
                callback(txn, (value) => resolve(value));
            });
        }
        /**
         * Delegates async to a native IDBObjectStore method.
         *
         * @param {string} method The method name.
         * @param {string} storeName The object store name.
         * @param {string} type Can be `readonly` or `readwrite`.
         * @param {...*} args The list of args to pass to the native method.
         * @return {*} The result of the transaction.
         * @private
         */
        async _call(method, storeName, type, ...args) {
            const callback = (txn, done) => {
                const objStore = txn.objectStore(storeName);
                // TODO(philipwalton): Fix this underlying TS2684 error.
                // @ts-ignore
                const request = objStore[method].apply(objStore, args);
                request.onsuccess = () => done(request.result);
            };
            return await this.transaction([storeName], type, callback);
        }
        /**
         * Closes the connection opened by `DBWrapper.open()`. Generally this method
         * doesn't need to be called since:
         *   1. It's usually better to keep a connection open since opening
         *      a new connection is somewhat slow.
         *   2. Connections are automatically closed when the reference is
         *      garbage collected.
         * The primary use case for needing to close a connection is when another
         * reference (typically in another tab) needs to upgrade it and would be
         * blocked by the current, open connection.
         *
         * @private
         */
        close() {
            if (this._db) {
                this._db.close();
                this._db = null;
            }
        }
    }
    // Exposed on the prototype to let users modify the default timeout on a
    // per-instance or global basis.
    DBWrapper.prototype.OPEN_TIMEOUT = 2000;
    // Wrap native IDBObjectStore methods according to their mode.
    const methodsToWrap = {
        readonly: ['get', 'count', 'getKey', 'getAll', 'getAllKeys'],
        readwrite: ['add', 'put', 'clear', 'delete'],
    };
    for (const [mode, methods] of Object.entries(methodsToWrap)) {
        for (const method of methods) {
            if (method in IDBObjectStore.prototype) {
                // Don't use arrow functions here since we're outside of the class.
                DBWrapper.prototype[method] =
                    async function (storeName, ...args) {
                        return await this._call(method, storeName, mode, ...args);
                    };
            }
        }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Allows developers to copy a response and modify its `headers`, `status`,
     * or `statusText` values (the values settable via a
     * [`ResponseInit`]{@link https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#Syntax}
     * object in the constructor).
     * To modify these values, pass a function as the second argument. That
     * function will be invoked with a single object with the response properties
     * `{headers, status, statusText}`. The return value of this function will
     * be used as the `ResponseInit` for the new `Response`. To change the values
     * either modify the passed parameter(s) and return it, or return a totally
     * new object.
     *
     * @param {Response} response
     * @param {Function} modifier
     * @memberof module:workbox-core
     */
    async function copyResponse(response, modifier) {
        const clonedResponse = response.clone();
        // Create a fresh `ResponseInit` object by cloning the headers.
        const responseInit = {
            headers: new Headers(clonedResponse.headers),
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
        };
        // Apply any user modifications.
        const modifiedResponseInit = modifier ? modifier(responseInit) : responseInit;
        // Create the new response from the body stream and `ResponseInit`
        // modifications. Note: not all browsers support the Response.body stream,
        // so fall back to reading the entire body into memory as a blob.
        const body = canConstructResponseFromBodyStream() ?
            clonedResponse.body : await clonedResponse.blob();
        return new Response(body, modifiedResponseInit);
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Claim any currently available clients once the service worker
     * becomes active. This is normally used in conjunction with `skipWaiting()`.
     *
     * @memberof module:workbox-core
     */
    function clientsClaim() {
        self.addEventListener('activate', () => self.clients.claim());
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Force a service worker to activate immediately, instead of
     * [waiting](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#waiting)
     * for existing clients to close.
     *
     * @memberof module:workbox-core
     */
    function skipWaiting() {
        // We need to explicitly call `self.skipWaiting()` here because we're
        // shadowing `skipWaiting` with this local function.
        self.addEventListener('install', () => self.skipWaiting());
    }

    // @ts-ignore
    try {
        self['workbox:precaching:5.1.2'] && _();
    }
    catch (e) { }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const plugins = [];
    const precachePlugins = {
        /*
         * @return {Array}
         * @private
         */
        get() {
            return plugins;
        },
        /*
         * @param {Array} newPlugins
         * @private
         */
        add(newPlugins) {
            plugins.push(...newPlugins);
        },
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    // Name of the search parameter used to store revision info.
    const REVISION_SEARCH_PARAM = '__WB_REVISION__';
    /**
     * Converts a manifest entry into a versioned URL suitable for precaching.
     *
     * @param {Object|string} entry
     * @return {string} A URL with versioning info.
     *
     * @private
     * @memberof module:workbox-precaching
     */
    function createCacheKey(entry) {
        if (!entry) {
            throw new WorkboxError('add-to-cache-list-unexpected-type', { entry });
        }
        // If a precache manifest entry is a string, it's assumed to be a versioned
        // URL, like '/app.abcd1234.js'. Return as-is.
        if (typeof entry === 'string') {
            const urlObject = new URL(entry, location.href);
            return {
                cacheKey: urlObject.href,
                url: urlObject.href,
            };
        }
        const { revision, url } = entry;
        if (!url) {
            throw new WorkboxError('add-to-cache-list-unexpected-type', { entry });
        }
        // If there's just a URL and no revision, then it's also assumed to be a
        // versioned URL.
        if (!revision) {
            const urlObject = new URL(url, location.href);
            return {
                cacheKey: urlObject.href,
                url: urlObject.href,
            };
        }
        // Otherwise, construct a properly versioned URL using the custom Workbox
        // search parameter along with the revision info.
        const cacheKeyURL = new URL(url, location.href);
        const originalURL = new URL(url, location.href);
        cacheKeyURL.searchParams.set(REVISION_SEARCH_PARAM, revision);
        return {
            cacheKey: cacheKeyURL.href,
            url: originalURL.href,
        };
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Performs efficient precaching of assets.
     *
     * @memberof module:workbox-precaching
     */
    class PrecacheController {
        /**
         * Create a new PrecacheController.
         *
         * @param {string} [cacheName] An optional name for the cache, to override
         * the default precache name.
         */
        constructor(cacheName) {
            this._cacheName = cacheNames.getPrecacheName(cacheName);
            this._urlsToCacheKeys = new Map();
            this._urlsToCacheModes = new Map();
            this._cacheKeysToIntegrities = new Map();
        }
        /**
         * This method will add items to the precache list, removing duplicates
         * and ensuring the information is valid.
         *
         * @param {
         * Array<module:workbox-precaching.PrecacheController.PrecacheEntry|string>
         * } entries Array of entries to precache.
         */
        addToCacheList(entries) {
            const urlsToWarnAbout = [];
            for (const entry of entries) {
                // See https://github.com/GoogleChrome/workbox/issues/2259
                if (typeof entry === 'string') {
                    urlsToWarnAbout.push(entry);
                }
                else if (entry && entry.revision === undefined) {
                    urlsToWarnAbout.push(entry.url);
                }
                const { cacheKey, url } = createCacheKey(entry);
                const cacheMode = (typeof entry !== 'string' && entry.revision) ?
                    'reload' : 'default';
                if (this._urlsToCacheKeys.has(url) &&
                    this._urlsToCacheKeys.get(url) !== cacheKey) {
                    throw new WorkboxError('add-to-cache-list-conflicting-entries', {
                        firstEntry: this._urlsToCacheKeys.get(url),
                        secondEntry: cacheKey,
                    });
                }
                if (typeof entry !== 'string' && entry.integrity) {
                    if (this._cacheKeysToIntegrities.has(cacheKey) &&
                        this._cacheKeysToIntegrities.get(cacheKey) !== entry.integrity) {
                        throw new WorkboxError('add-to-cache-list-conflicting-integrities', {
                            url,
                        });
                    }
                    this._cacheKeysToIntegrities.set(cacheKey, entry.integrity);
                }
                this._urlsToCacheKeys.set(url, cacheKey);
                this._urlsToCacheModes.set(url, cacheMode);
                if (urlsToWarnAbout.length > 0) {
                    const warningMessage = `Workbox is precaching URLs without revision ` +
                        `info: ${urlsToWarnAbout.join(', ')}\nThis is generally NOT safe. ` +
                        `Learn more at https://bit.ly/wb-precache`;
                    {
                        // Use console directly to display this warning without bloating
                        // bundle sizes by pulling in all of the logger codebase in prod.
                        console.warn(warningMessage);
                    }
                }
            }
        }
        /**
         * Precaches new and updated assets. Call this method from the service worker
         * install event.
         *
         * @param {Object} options
         * @param {Event} [options.event] The install event (if needed).
         * @param {Array<Object>} [options.plugins] Plugins to be used for fetching
         * and caching during install.
         * @return {Promise<module:workbox-precaching.InstallResult>}
         */
        async install({ event, plugins } = {}) {
            const toBePrecached = [];
            const alreadyPrecached = [];
            const cache = await self.caches.open(this._cacheName);
            const alreadyCachedRequests = await cache.keys();
            const existingCacheKeys = new Set(alreadyCachedRequests.map((request) => request.url));
            for (const [url, cacheKey] of this._urlsToCacheKeys) {
                if (existingCacheKeys.has(cacheKey)) {
                    alreadyPrecached.push(url);
                }
                else {
                    toBePrecached.push({ cacheKey, url });
                }
            }
            const precacheRequests = toBePrecached.map(({ cacheKey, url }) => {
                const integrity = this._cacheKeysToIntegrities.get(cacheKey);
                const cacheMode = this._urlsToCacheModes.get(url);
                return this._addURLToCache({
                    cacheKey,
                    cacheMode,
                    event,
                    integrity,
                    plugins,
                    url,
                });
            });
            await Promise.all(precacheRequests);
            const updatedURLs = toBePrecached.map((item) => item.url);
            return {
                updatedURLs,
                notUpdatedURLs: alreadyPrecached,
            };
        }
        /**
         * Deletes assets that are no longer present in the current precache manifest.
         * Call this method from the service worker activate event.
         *
         * @return {Promise<module:workbox-precaching.CleanupResult>}
         */
        async activate() {
            const cache = await self.caches.open(this._cacheName);
            const currentlyCachedRequests = await cache.keys();
            const expectedCacheKeys = new Set(this._urlsToCacheKeys.values());
            const deletedURLs = [];
            for (const request of currentlyCachedRequests) {
                if (!expectedCacheKeys.has(request.url)) {
                    await cache.delete(request);
                    deletedURLs.push(request.url);
                }
            }
            return { deletedURLs };
        }
        /**
         * Requests the entry and saves it to the cache if the response is valid.
         * By default, any response with a status code of less than 400 (including
         * opaque responses) is considered valid.
         *
         * If you need to use custom criteria to determine what's valid and what
         * isn't, then pass in an item in `options.plugins` that implements the
         * `cacheWillUpdate()` lifecycle event.
         *
         * @private
         * @param {Object} options
         * @param {string} options.cacheKey The string to use a cache key.
         * @param {string} options.url The URL to fetch and cache.
         * @param {string} [options.cacheMode] The cache mode for the network request.
         * @param {Event} [options.event] The install event (if passed).
         * @param {Array<Object>} [options.plugins] An array of plugins to apply to
         * fetch and caching.
         * @param {string} [options.integrity] The value to use for the `integrity`
         * field when making the request.
         */
        async _addURLToCache({ cacheKey, url, cacheMode, event, plugins, integrity }) {
            const request = new Request(url, {
                integrity,
                cache: cacheMode,
                credentials: 'same-origin',
            });
            let response = await fetchWrapper.fetch({
                event,
                plugins,
                request,
            });
            // Allow developers to override the default logic about what is and isn't
            // valid by passing in a plugin implementing cacheWillUpdate(), e.g.
            // a `CacheableResponsePlugin` instance.
            let cacheWillUpdatePlugin;
            for (const plugin of (plugins || [])) {
                if ('cacheWillUpdate' in plugin) {
                    cacheWillUpdatePlugin = plugin;
                }
            }
            const isValidResponse = cacheWillUpdatePlugin ?
                // Use a callback if provided. It returns a truthy value if valid.
                // NOTE: invoke the method on the plugin instance so the `this` context
                // is correct.
                await cacheWillUpdatePlugin.cacheWillUpdate({ event, request, response }) :
                // Otherwise, default to considering any response status under 400 valid.
                // This includes, by default, considering opaque responses valid.
                response.status < 400;
            // Consider this a failure, leading to the `install` handler failing, if
            // we get back an invalid response.
            if (!isValidResponse) {
                throw new WorkboxError('bad-precaching-response', {
                    url,
                    status: response.status,
                });
            }
            // Redirected responses cannot be used to satisfy a navigation request, so
            // any redirected response must be "copied" rather than cloned, so the new
            // response doesn't contain the `redirected` flag. See:
            // https://bugs.chromium.org/p/chromium/issues/detail?id=669363&desc=2#c1
            if (response.redirected) {
                response = await copyResponse(response);
            }
            await cacheWrapper.put({
                event,
                plugins,
                response,
                // `request` already uses `url`. We may be able to reuse it.
                request: cacheKey === url ? request : new Request(cacheKey),
                cacheName: this._cacheName,
                matchOptions: {
                    ignoreSearch: true,
                },
            });
        }
        /**
         * Returns a mapping of a precached URL to the corresponding cache key, taking
         * into account the revision information for the URL.
         *
         * @return {Map<string, string>} A URL to cache key mapping.
         */
        getURLsToCacheKeys() {
            return this._urlsToCacheKeys;
        }
        /**
         * Returns a list of all the URLs that have been precached by the current
         * service worker.
         *
         * @return {Array<string>} The precached URLs.
         */
        getCachedURLs() {
            return [...this._urlsToCacheKeys.keys()];
        }
        /**
         * Returns the cache key used for storing a given URL. If that URL is
         * unversioned, like `/index.html', then the cache key will be the original
         * URL with a search parameter appended to it.
         *
         * @param {string} url A URL whose cache key you want to look up.
         * @return {string} The versioned URL that corresponds to a cache key
         * for the original URL, or undefined if that URL isn't precached.
         */
        getCacheKeyForURL(url) {
            const urlObject = new URL(url, location.href);
            return this._urlsToCacheKeys.get(urlObject.href);
        }
        /**
         * This acts as a drop-in replacement for [`cache.match()`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match)
         * with the following differences:
         *
         * - It knows what the name of the precache is, and only checks in that cache.
         * - It allows you to pass in an "original" URL without versioning parameters,
         * and it will automatically look up the correct cache key for the currently
         * active revision of that URL.
         *
         * E.g., `matchPrecache('index.html')` will find the correct precached
         * response for the currently active service worker, even if the actual cache
         * key is `'/index.html?__WB_REVISION__=1234abcd'`.
         *
         * @param {string|Request} request The key (without revisioning parameters)
         * to look up in the precache.
         * @return {Promise<Response|undefined>}
         */
        async matchPrecache(request) {
            const url = request instanceof Request ? request.url : request;
            const cacheKey = this.getCacheKeyForURL(url);
            if (cacheKey) {
                const cache = await self.caches.open(this._cacheName);
                return cache.match(cacheKey);
            }
            return undefined;
        }
        /**
         * Returns a function that can be used within a
         * {@link module:workbox-routing.Route} that will find a response for the
         * incoming request against the precache.
         *
         * If for an unexpected reason there is a cache miss for the request,
         * this will fall back to retrieving the `Response` via `fetch()` when
         * `fallbackToNetwork` is `true`.
         *
         * @param {boolean} [fallbackToNetwork=true] Whether to attempt to get the
         * response from the network if there's a precache miss.
         * @return {module:workbox-routing~handlerCallback}
         */
        createHandler(fallbackToNetwork = true) {
            return async ({ request }) => {
                try {
                    const response = await this.matchPrecache(request);
                    if (response) {
                        return response;
                    }
                    // This shouldn't normally happen, but there are edge cases:
                    // https://github.com/GoogleChrome/workbox/issues/1441
                    throw new WorkboxError('missing-precache-entry', {
                        cacheName: this._cacheName,
                        url: request instanceof Request ? request.url : request,
                    });
                }
                catch (error) {
                    if (fallbackToNetwork) {
                        return fetch(request);
                    }
                    throw error;
                }
            };
        }
        /**
         * Returns a function that looks up `url` in the precache (taking into
         * account revision information), and returns the corresponding `Response`.
         *
         * If for an unexpected reason there is a cache miss when looking up `url`,
         * this will fall back to retrieving the `Response` via `fetch()` when
         * `fallbackToNetwork` is `true`.
         *
         * @param {string} url The precached URL which will be used to lookup the
         * `Response`.
         * @param {boolean} [fallbackToNetwork=true] Whether to attempt to get the
         * response from the network if there's a precache miss.
         * @return {module:workbox-routing~handlerCallback}
         */
        createHandlerBoundToURL(url, fallbackToNetwork = true) {
            const cacheKey = this.getCacheKeyForURL(url);
            if (!cacheKey) {
                throw new WorkboxError('non-precached-url', { url });
            }
            const handler = this.createHandler(fallbackToNetwork);
            const request = new Request(url);
            return () => handler({ request });
        }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    let precacheController;
    /**
     * @return {PrecacheController}
     * @private
     */
    const getOrCreatePrecacheController = () => {
        if (!precacheController) {
            precacheController = new PrecacheController();
        }
        return precacheController;
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Removes any URL search parameters that should be ignored.
     *
     * @param {URL} urlObject The original URL.
     * @param {Array<RegExp>} ignoreURLParametersMatching RegExps to test against
     * each search parameter name. Matches mean that the search parameter should be
     * ignored.
     * @return {URL} The URL with any ignored search parameters removed.
     *
     * @private
     * @memberof module:workbox-precaching
     */
    function removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching = []) {
        // Convert the iterable into an array at the start of the loop to make sure
        // deletion doesn't mess up iteration.
        for (const paramName of [...urlObject.searchParams.keys()]) {
            if (ignoreURLParametersMatching.some((regExp) => regExp.test(paramName))) {
                urlObject.searchParams.delete(paramName);
            }
        }
        return urlObject;
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Generator function that yields possible variations on the original URL to
     * check, one at a time.
     *
     * @param {string} url
     * @param {Object} options
     *
     * @private
     * @memberof module:workbox-precaching
     */
    function* generateURLVariations(url, { ignoreURLParametersMatching, directoryIndex, cleanURLs, urlManipulation, } = {}) {
        const urlObject = new URL(url, location.href);
        urlObject.hash = '';
        yield urlObject.href;
        const urlWithoutIgnoredParams = removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching);
        yield urlWithoutIgnoredParams.href;
        if (directoryIndex && urlWithoutIgnoredParams.pathname.endsWith('/')) {
            const directoryURL = new URL(urlWithoutIgnoredParams.href);
            directoryURL.pathname += directoryIndex;
            yield directoryURL.href;
        }
        if (cleanURLs) {
            const cleanURL = new URL(urlWithoutIgnoredParams.href);
            cleanURL.pathname += '.html';
            yield cleanURL.href;
        }
        if (urlManipulation) {
            const additionalURLs = urlManipulation({ url: urlObject });
            for (const urlToAttempt of additionalURLs) {
                yield urlToAttempt.href;
            }
        }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * This function will take the request URL and manipulate it based on the
     * configuration options.
     *
     * @param {string} url
     * @param {Object} options
     * @return {string} Returns the URL in the cache that matches the request,
     * if possible.
     *
     * @private
     */
    const getCacheKeyForURL = (url, options) => {
        const precacheController = getOrCreatePrecacheController();
        const urlsToCacheKeys = precacheController.getURLsToCacheKeys();
        for (const possibleURL of generateURLVariations(url, options)) {
            const possibleCacheKey = urlsToCacheKeys.get(possibleURL);
            if (possibleCacheKey) {
                return possibleCacheKey;
            }
        }
    };

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Adds a `fetch` listener to the service worker that will
     * respond to
     * [network requests]{@link https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Custom_responses_to_requests}
     * with precached assets.
     *
     * Requests for assets that aren't precached, the `FetchEvent` will not be
     * responded to, allowing the event to fall through to other `fetch` event
     * listeners.
     *
     * NOTE: when called more than once this method will replace the previously set
     * configuration options. Calling it more than once is not recommended outside
     * of tests.
     *
     * @private
     * @param {Object} [options]
     * @param {string} [options.directoryIndex=index.html] The `directoryIndex` will
     * check cache entries for a URLs ending with '/' to see if there is a hit when
     * appending the `directoryIndex` value.
     * @param {Array<RegExp>} [options.ignoreURLParametersMatching=[/^utm_/]] An
     * array of regex's to remove search params when looking for a cache match.
     * @param {boolean} [options.cleanURLs=true] The `cleanURLs` option will
     * check the cache for the URL with a `.html` added to the end of the end.
     * @param {workbox.precaching~urlManipulation} [options.urlManipulation]
     * This is a function that should take a URL and return an array of
     * alternative URLs that should be checked for precache matches.
     */
    const addFetchListener = ({ ignoreURLParametersMatching = [/^utm_/], directoryIndex = 'index.html', cleanURLs = true, urlManipulation, } = {}) => {
        const cacheName = cacheNames.getPrecacheName();
        // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
        self.addEventListener('fetch', ((event) => {
            const precachedURL = getCacheKeyForURL(event.request.url, {
                cleanURLs,
                directoryIndex,
                ignoreURLParametersMatching,
                urlManipulation,
            });
            if (!precachedURL) {
                return;
            }
            let responsePromise = self.caches.open(cacheName).then((cache) => {
                return cache.match(precachedURL);
            }).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(precachedURL);
            });
            event.respondWith(responsePromise);
        }));
    };

    /*
      Copyright 2019 Google LLC
      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    let listenerAdded = false;
    /**
     * Add a `fetch` listener to the service worker that will
     * respond to
     * [network requests]{@link https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Custom_responses_to_requests}
     * with precached assets.
     *
     * Requests for assets that aren't precached, the `FetchEvent` will not be
     * responded to, allowing the event to fall through to other `fetch` event
     * listeners.
     *
     * @param {Object} [options]
     * @param {string} [options.directoryIndex=index.html] The `directoryIndex` will
     * check cache entries for a URLs ending with '/' to see if there is a hit when
     * appending the `directoryIndex` value.
     * @param {Array<RegExp>} [options.ignoreURLParametersMatching=[/^utm_/]] An
     * array of regex's to remove search params when looking for a cache match.
     * @param {boolean} [options.cleanURLs=true] The `cleanURLs` option will
     * check the cache for the URL with a `.html` added to the end of the end.
     * @param {module:workbox-precaching~urlManipulation} [options.urlManipulation]
     * This is a function that should take a URL and return an array of
     * alternative URLs that should be checked for precache matches.
     *
     * @memberof module:workbox-precaching
     */
    function addRoute(options) {
        if (!listenerAdded) {
            addFetchListener(options);
            listenerAdded = true;
        }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const installListener = (event) => {
        const precacheController = getOrCreatePrecacheController();
        const plugins = precachePlugins.get();
        event.waitUntil(precacheController.install({ event, plugins })
            .catch((error) => {
            // Re-throw the error to ensure installation fails.
            throw error;
        }));
    };
    const activateListener = (event) => {
        const precacheController = getOrCreatePrecacheController();
        event.waitUntil(precacheController.activate());
    };
    /**
     * Adds items to the precache list, removing any duplicates and
     * stores the files in the
     * ["precache cache"]{@link module:workbox-core.cacheNames} when the service
     * worker installs.
     *
     * This method can be called multiple times.
     *
     * Please note: This method **will not** serve any of the cached files for you.
     * It only precaches files. To respond to a network request you call
     * [addRoute()]{@link module:workbox-precaching.addRoute}.
     *
     * If you have a single array of files to precache, you can just call
     * [precacheAndRoute()]{@link module:workbox-precaching.precacheAndRoute}.
     *
     * @param {Array<Object|string>} [entries=[]] Array of entries to precache.
     *
     * @memberof module:workbox-precaching
     */
    function precache(entries) {
        const precacheController = getOrCreatePrecacheController();
        precacheController.addToCacheList(entries);
        if (entries.length > 0) {
            // NOTE: these listeners will only be added once (even if the `precache()`
            // method is called multiple times) because event listeners are implemented
            // as a set, where each listener must be unique.
            // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
            self.addEventListener('install', installListener);
            self.addEventListener('activate', activateListener);
        }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * This method will add entries to the precache list and add a route to
     * respond to fetch events.
     *
     * This is a convenience method that will call
     * [precache()]{@link module:workbox-precaching.precache} and
     * [addRoute()]{@link module:workbox-precaching.addRoute} in a single call.
     *
     * @param {Array<Object|string>} entries Array of entries to precache.
     * @param {Object} [options] See
     * [addRoute() options]{@link module:workbox-precaching.addRoute}.
     *
     * @memberof module:workbox-precaching
     */
    function precacheAndRoute(entries, options) {
        precache(entries);
        addRoute(options);
    }

    function preparePushMessage(event) {
      if (event.data) {
        console.log('This push event has data: ', event.data.text());
      } else {
        console.log('This push event has no data.');
      }

      var pushMsg = convertMessage(event.data);
      if (pushMsg.type) {
        var options = prepareOptions(pushMsg);
        return { title: pushMsg.title, options }
      } else {
        console.log('This push event has no pushType.');
      }
    }

    function convertMessage(data) {
      try {
        return data.json()
      } catch (err) {
        console.log('could not jsonize ' + data.text(), err);
      }
      //return test message!
      return {
        type: 'message',
        title: 'Lurin just like to say that he is watching you!',
        message: '',
        timestamp: new Date(),
      }
    }

    function prepareOptions(pushMsg) {
      console.log('handle push msg:' + pushMsg.type);
      var data = { url: '/home' };

      if (pushMsg.type == 'newfact' || pushMsg.type == 'randomfact') {
        data = { url: '/facts?key=' + pushMsg.itemKey };
      }
      if (pushMsg.type == 'newimage' || pushMsg.type == 'randomimage') {
        data = { url: '/images/slideShow?key=' + pushMsg.itemKey };
      }

      const options = {
        badge: '/images/logo192m.png',
        icon: '/images/logo192m.png',
        body: pushMsg.message,
        data: data,
        vibrate: [500, 110, 500],
        timestamp: pushMsg.timestamp,
      };

      return options
    }

    // @ts-ignore
    try {
        self['workbox:routing:5.1.2'] && _();
    }
    catch (e) { }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * The default HTTP method, 'GET', used when there's no specific method
     * configured for a route.
     *
     * @type {string}
     *
     * @private
     */
    const defaultMethod = 'GET';

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * @param {function()|Object} handler Either a function, or an object with a
     * 'handle' method.
     * @return {Object} An object with a handle method.
     *
     * @private
     */
    const normalizeHandler = (handler) => {
        if (handler && typeof handler === 'object') {
            return handler;
        }
        else {
            return { handle: handler };
        }
    };

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * A `Route` consists of a pair of callback functions, "match" and "handler".
     * The "match" callback determine if a route should be used to "handle" a
     * request by returning a non-falsy value if it can. The "handler" callback
     * is called when there is a match and should return a Promise that resolves
     * to a `Response`.
     *
     * @memberof module:workbox-routing
     */
    class Route {
        /**
         * Constructor for Route class.
         *
         * @param {module:workbox-routing~matchCallback} match
         * A callback function that determines whether the route matches a given
         * `fetch` event by returning a non-falsy value.
         * @param {module:workbox-routing~handlerCallback} handler A callback
         * function that returns a Promise resolving to a Response.
         * @param {string} [method='GET'] The HTTP method to match the Route
         * against.
         */
        constructor(match, handler, method = defaultMethod) {
            // These values are referenced directly by Router so cannot be
            // altered by minificaton.
            this.handler = normalizeHandler(handler);
            this.match = match;
            this.method = method;
        }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * RegExpRoute makes it easy to create a regular expression based
     * [Route]{@link module:workbox-routing.Route}.
     *
     * For same-origin requests the RegExp only needs to match part of the URL. For
     * requests against third-party servers, you must define a RegExp that matches
     * the start of the URL.
     *
     * [See the module docs for info.]{@link https://developers.google.com/web/tools/workbox/modules/workbox-routing}
     *
     * @memberof module:workbox-routing
     * @extends module:workbox-routing.Route
     */
    class RegExpRoute extends Route {
        /**
         * If the regular expression contains
         * [capture groups]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references},
         * the captured values will be passed to the
         * [handler's]{@link module:workbox-routing~handlerCallback} `params`
         * argument.
         *
         * @param {RegExp} regExp The regular expression to match against URLs.
         * @param {module:workbox-routing~handlerCallback} handler A callback
         * function that returns a Promise resulting in a Response.
         * @param {string} [method='GET'] The HTTP method to match the Route
         * against.
         */
        constructor(regExp, handler, method) {
            const match = ({ url }) => {
                const result = regExp.exec(url.href);
                // Return immediately if there's no match.
                if (!result) {
                    return;
                }
                // Require that the match start at the first character in the URL string
                // if it's a cross-origin request.
                // See https://github.com/GoogleChrome/workbox/issues/281 for the context
                // behind this behavior.
                if ((url.origin !== location.origin) && (result.index !== 0)) {
                    return;
                }
                // If the route matches, but there aren't any capture groups defined, then
                // this will return [], which is truthy and therefore sufficient to
                // indicate a match.
                // If there are capture groups, then it will return their values.
                return result.slice(1);
            };
            super(match, handler, method);
        }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * The Router can be used to process a FetchEvent through one or more
     * [Routes]{@link module:workbox-routing.Route} responding  with a Request if
     * a matching route exists.
     *
     * If no route matches a given a request, the Router will use a "default"
     * handler if one is defined.
     *
     * Should the matching Route throw an error, the Router will use a "catch"
     * handler if one is defined to gracefully deal with issues and respond with a
     * Request.
     *
     * If a request matches multiple routes, the **earliest** registered route will
     * be used to respond to the request.
     *
     * @memberof module:workbox-routing
     */
    class Router {
        /**
         * Initializes a new Router.
         */
        constructor() {
            this._routes = new Map();
        }
        /**
         * @return {Map<string, Array<module:workbox-routing.Route>>} routes A `Map` of HTTP
         * method name ('GET', etc.) to an array of all the corresponding `Route`
         * instances that are registered.
         */
        get routes() {
            return this._routes;
        }
        /**
         * Adds a fetch event listener to respond to events when a route matches
         * the event's request.
         */
        addFetchListener() {
            // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
            self.addEventListener('fetch', ((event) => {
                const { request } = event;
                const responsePromise = this.handleRequest({ request, event });
                if (responsePromise) {
                    event.respondWith(responsePromise);
                }
            }));
        }
        /**
         * Adds a message event listener for URLs to cache from the window.
         * This is useful to cache resources loaded on the page prior to when the
         * service worker started controlling it.
         *
         * The format of the message data sent from the window should be as follows.
         * Where the `urlsToCache` array may consist of URL strings or an array of
         * URL string + `requestInit` object (the same as you'd pass to `fetch()`).
         *
         * ```
         * {
         *   type: 'CACHE_URLS',
         *   payload: {
         *     urlsToCache: [
         *       './script1.js',
         *       './script2.js',
         *       ['./script3.js', {mode: 'no-cors'}],
         *     ],
         *   },
         * }
         * ```
         */
        addCacheListener() {
            // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
            self.addEventListener('message', ((event) => {
                if (event.data && event.data.type === 'CACHE_URLS') {
                    const { payload } = event.data;
                    const requestPromises = Promise.all(payload.urlsToCache.map((entry) => {
                        if (typeof entry === 'string') {
                            entry = [entry];
                        }
                        const request = new Request(...entry);
                        return this.handleRequest({ request });
                        // TODO(philipwalton): TypeScript errors without this typecast for
                        // some reason (probably a bug). The real type here should work but
                        // doesn't: `Array<Promise<Response> | undefined>`.
                    })); // TypeScript
                    event.waitUntil(requestPromises);
                    // If a MessageChannel was used, reply to the message on success.
                    if (event.ports && event.ports[0]) {
                        requestPromises.then(() => event.ports[0].postMessage(true));
                    }
                }
            }));
        }
        /**
         * Apply the routing rules to a FetchEvent object to get a Response from an
         * appropriate Route's handler.
         *
         * @param {Object} options
         * @param {Request} options.request The request to handle (this is usually
         *     from a fetch event, but it does not have to be).
         * @param {FetchEvent} [options.event] The event that triggered the request,
         *     if applicable.
         * @return {Promise<Response>|undefined} A promise is returned if a
         *     registered route can handle the request. If there is no matching
         *     route and there's no `defaultHandler`, `undefined` is returned.
         */
        handleRequest({ request, event }) {
            const url = new URL(request.url, location.href);
            if (!url.protocol.startsWith('http')) {
                return;
            }
            const { params, route } = this.findMatchingRoute({ url, request, event });
            let handler = route && route.handler;
            // If we don't have a handler because there was no matching route, then
            // fall back to defaultHandler if that's defined.
            if (!handler && this._defaultHandler) {
                handler = this._defaultHandler;
            }
            if (!handler) {
                return;
            }
            // Wrap in try and catch in case the handle method throws a synchronous
            // error. It should still callback to the catch handler.
            let responsePromise;
            try {
                responsePromise = handler.handle({ url, request, event, params });
            }
            catch (err) {
                responsePromise = Promise.reject(err);
            }
            if (responsePromise instanceof Promise && this._catchHandler) {
                responsePromise = responsePromise.catch((err) => {
                    return this._catchHandler.handle({ url, request, event });
                });
            }
            return responsePromise;
        }
        /**
         * Checks a request and URL (and optionally an event) against the list of
         * registered routes, and if there's a match, returns the corresponding
         * route along with any params generated by the match.
         *
         * @param {Object} options
         * @param {URL} options.url
         * @param {Request} options.request The request to match.
         * @param {Event} [options.event] The corresponding event (unless N/A).
         * @return {Object} An object with `route` and `params` properties.
         *     They are populated if a matching route was found or `undefined`
         *     otherwise.
         */
        findMatchingRoute({ url, request, event }) {
            const routes = this._routes.get(request.method) || [];
            for (const route of routes) {
                let params;
                const matchResult = route.match({ url, request, event });
                if (matchResult) {
                    // See https://github.com/GoogleChrome/workbox/issues/2079
                    params = matchResult;
                    if (Array.isArray(matchResult) && matchResult.length === 0) {
                        // Instead of passing an empty array in as params, use undefined.
                        params = undefined;
                    }
                    else if ((matchResult.constructor === Object &&
                        Object.keys(matchResult).length === 0)) {
                        // Instead of passing an empty object in as params, use undefined.
                        params = undefined;
                    }
                    else if (typeof matchResult === 'boolean') {
                        // For the boolean value true (rather than just something truth-y),
                        // don't set params.
                        // See https://github.com/GoogleChrome/workbox/pull/2134#issuecomment-513924353
                        params = undefined;
                    }
                    // Return early if have a match.
                    return { route, params };
                }
            }
            // If no match was found above, return and empty object.
            return {};
        }
        /**
         * Define a default `handler` that's called when no routes explicitly
         * match the incoming request.
         *
         * Without a default handler, unmatched requests will go against the
         * network as if there were no service worker present.
         *
         * @param {module:workbox-routing~handlerCallback} handler A callback
         * function that returns a Promise resulting in a Response.
         */
        setDefaultHandler(handler) {
            this._defaultHandler = normalizeHandler(handler);
        }
        /**
         * If a Route throws an error while handling a request, this `handler`
         * will be called and given a chance to provide a response.
         *
         * @param {module:workbox-routing~handlerCallback} handler A callback
         * function that returns a Promise resulting in a Response.
         */
        setCatchHandler(handler) {
            this._catchHandler = normalizeHandler(handler);
        }
        /**
         * Registers a route with the router.
         *
         * @param {module:workbox-routing.Route} route The route to register.
         */
        registerRoute(route) {
            if (!this._routes.has(route.method)) {
                this._routes.set(route.method, []);
            }
            // Give precedence to all of the earlier routes by adding this additional
            // route to the end of the array.
            this._routes.get(route.method).push(route);
        }
        /**
         * Unregisters a route with the router.
         *
         * @param {module:workbox-routing.Route} route The route to unregister.
         */
        unregisterRoute(route) {
            if (!this._routes.has(route.method)) {
                throw new WorkboxError('unregister-route-but-not-found-with-method', {
                    method: route.method,
                });
            }
            const routeIndex = this._routes.get(route.method).indexOf(route);
            if (routeIndex > -1) {
                this._routes.get(route.method).splice(routeIndex, 1);
            }
            else {
                throw new WorkboxError('unregister-route-route-not-registered');
            }
        }
    }

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    let defaultRouter;
    /**
     * Creates a new, singleton Router instance if one does not exist. If one
     * does already exist, that instance is returned.
     *
     * @private
     * @return {Router}
     */
    const getOrCreateDefaultRouter = () => {
        if (!defaultRouter) {
            defaultRouter = new Router();
            // The helpers that use the default Router assume these listeners exist.
            defaultRouter.addFetchListener();
            defaultRouter.addCacheListener();
        }
        return defaultRouter;
    };

    /*
      Copyright 2019 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Easily register a RegExp, string, or function with a caching
     * strategy to a singleton Router instance.
     *
     * This method will generate a Route for you if needed and
     * call [registerRoute()]{@link module:workbox-routing.Router#registerRoute}.
     *
     * @param {RegExp|string|module:workbox-routing.Route~matchCallback|module:workbox-routing.Route} capture
     * If the capture param is a `Route`, all other arguments will be ignored.
     * @param {module:workbox-routing~handlerCallback} [handler] A callback
     * function that returns a Promise resulting in a Response. This parameter
     * is required if `capture` is not a `Route` object.
     * @param {string} [method='GET'] The HTTP method to match the Route
     * against.
     * @return {module:workbox-routing.Route} The generated `Route`(Useful for
     * unregistering).
     *
     * @memberof module:workbox-routing
     */
    function registerRoute(capture, handler, method) {
        let route;
        if (typeof capture === 'string') {
            const captureUrl = new URL(capture, location.href);
            const matchCallback = ({ url }) => {
                return url.href === captureUrl.href;
            };
            // If `capture` is a string then `handler` and `method` must be present.
            route = new Route(matchCallback, handler, method);
        }
        else if (capture instanceof RegExp) {
            // If `capture` is a `RegExp` then `handler` and `method` must be present.
            route = new RegExpRoute(capture, handler, method);
        }
        else if (typeof capture === 'function') {
            // If `capture` is a function then `handler` and `method` must be present.
            route = new Route(capture, handler, method);
        }
        else if (capture instanceof Route) {
            route = capture;
        }
        else {
            throw new WorkboxError('unsupported-route-type', {
                moduleName: 'workbox-routing',
                funcName: 'registerRoute',
                paramName: 'capture',
            });
        }
        const defaultRouter = getOrCreateDefaultRouter();
        defaultRouter.registerRoute(route);
        return route;
    }

    // @ts-ignore
    try {
        self['workbox:range-requests:5.1.2'] && _();
    }
    catch (e) { }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * @param {Blob} blob A source blob.
     * @param {number} [start] The offset to use as the start of the
     * slice.
     * @param {number} [end] The offset to use as the end of the slice.
     * @return {Object} An object with `start` and `end` properties, reflecting
     * the effective boundaries to use given the size of the blob.
     *
     * @private
     */
    function calculateEffectiveBoundaries(blob, start, end) {
        const blobSize = blob.size;
        if ((end && end > blobSize) || (start && start < 0)) {
            throw new WorkboxError('range-not-satisfiable', {
                size: blobSize,
                end,
                start,
            });
        }
        let effectiveStart;
        let effectiveEnd;
        if (start !== undefined && end !== undefined) {
            effectiveStart = start;
            // Range values are inclusive, so add 1 to the value.
            effectiveEnd = end + 1;
        }
        else if (start !== undefined && end === undefined) {
            effectiveStart = start;
            effectiveEnd = blobSize;
        }
        else if (end !== undefined && start === undefined) {
            effectiveStart = blobSize - end;
            effectiveEnd = blobSize;
        }
        return {
            start: effectiveStart,
            end: effectiveEnd,
        };
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * @param {string} rangeHeader A Range: header value.
     * @return {Object} An object with `start` and `end` properties, reflecting
     * the parsed value of the Range: header. If either the `start` or `end` are
     * omitted, then `null` will be returned.
     *
     * @private
     */
    function parseRangeHeader(rangeHeader) {
        const normalizedRangeHeader = rangeHeader.trim().toLowerCase();
        if (!normalizedRangeHeader.startsWith('bytes=')) {
            throw new WorkboxError('unit-must-be-bytes', { normalizedRangeHeader });
        }
        // Specifying multiple ranges separate by commas is valid syntax, but this
        // library only attempts to handle a single, contiguous sequence of bytes.
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range#Syntax
        if (normalizedRangeHeader.includes(',')) {
            throw new WorkboxError('single-range-only', { normalizedRangeHeader });
        }
        const rangeParts = /(\d*)-(\d*)/.exec(normalizedRangeHeader);
        // We need either at least one of the start or end values.
        if (!rangeParts || !(rangeParts[1] || rangeParts[2])) {
            throw new WorkboxError('invalid-range-values', { normalizedRangeHeader });
        }
        return {
            start: rangeParts[1] === '' ? undefined : Number(rangeParts[1]),
            end: rangeParts[2] === '' ? undefined : Number(rangeParts[2]),
        };
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Given a `Request` and `Response` objects as input, this will return a
     * promise for a new `Response`.
     *
     * If the original `Response` already contains partial content (i.e. it has
     * a status of 206), then this assumes it already fulfills the `Range:`
     * requirements, and will return it as-is.
     *
     * @param {Request} request A request, which should contain a Range:
     * header.
     * @param {Response} originalResponse A response.
     * @return {Promise<Response>} Either a `206 Partial Content` response, with
     * the response body set to the slice of content specified by the request's
     * `Range:` header, or a `416 Range Not Satisfiable` response if the
     * conditions of the `Range:` header can't be met.
     *
     * @memberof module:workbox-range-requests
     */
    async function createPartialResponse(request, originalResponse) {
        try {
            if ("production" !== 'production') {
                finalAssertExports.isInstance(request, Request, {
                    moduleName: 'workbox-range-requests',
                    funcName: 'createPartialResponse',
                    paramName: 'request',
                });
                finalAssertExports.isInstance(originalResponse, Response, {
                    moduleName: 'workbox-range-requests',
                    funcName: 'createPartialResponse',
                    paramName: 'originalResponse',
                });
            }
            if (originalResponse.status === 206) {
                // If we already have a 206, then just pass it through as-is;
                // see https://github.com/GoogleChrome/workbox/issues/1720
                return originalResponse;
            }
            const rangeHeader = request.headers.get('range');
            if (!rangeHeader) {
                throw new WorkboxError('no-range-header');
            }
            const boundaries = parseRangeHeader(rangeHeader);
            const originalBlob = await originalResponse.blob();
            const effectiveBoundaries = calculateEffectiveBoundaries(originalBlob, boundaries.start, boundaries.end);
            const slicedBlob = originalBlob.slice(effectiveBoundaries.start, effectiveBoundaries.end);
            const slicedBlobSize = slicedBlob.size;
            const slicedResponse = new Response(slicedBlob, {
                // Status code 206 is for a Partial Content response.
                // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
                status: 206,
                statusText: 'Partial Content',
                headers: originalResponse.headers,
            });
            slicedResponse.headers.set('Content-Length', String(slicedBlobSize));
            slicedResponse.headers.set('Content-Range', `bytes ${effectiveBoundaries.start}-${effectiveBoundaries.end - 1}/` +
                originalBlob.size);
            return slicedResponse;
        }
        catch (error) {
            return new Response('', {
                status: 416,
                statusText: 'Range Not Satisfiable',
            });
        }
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * The range request plugin makes it easy for a request with a 'Range' header to
     * be fulfilled by a cached response.
     *
     * It does this by intercepting the `cachedResponseWillBeUsed` plugin callback
     * and returning the appropriate subset of the cached response body.
     *
     * @memberof module:workbox-range-requests
     */
    class RangeRequestsPlugin {
        constructor() {
            /**
             * @param {Object} options
             * @param {Request} options.request The original request, which may or may not
             * contain a Range: header.
             * @param {Response} options.cachedResponse The complete cached response.
             * @return {Promise<Response>} If request contains a 'Range' header, then a
             * new response with status 206 whose body is a subset of `cachedResponse` is
             * returned. Otherwise, `cachedResponse` is returned as-is.
             *
             * @private
             */
            this.cachedResponseWillBeUsed = async ({ request, cachedResponse }) => {
                // Only return a sliced response if there's something valid in the cache,
                // and there's a Range: header in the request.
                if (cachedResponse && request.headers.has('range')) {
                    return await createPartialResponse(request, cachedResponse);
                }
                // If there was no Range: header, or if cachedResponse wasn't valid, just
                // pass it through as-is.
                return cachedResponse;
            };
        }
    }

    const cacheName = 'webShareMediaCache';

    registerRoute(
      /\.(?:png|jpg|jpeg|svg|gif)$/,
      new CacheFirst({
        cacheName: 'my-image-cache',
      })
    );

    const shareTargetHandler = async ({ event }) => {
      if (broadcastChannel) {
        broadcastChannel.postMessage('Saving media locally...');
      }
      const formData = await event.request.formData();
      const mediaFiles = formData.getAll('media');
      const cache = await caches.open(cacheName);

      for (const mediaFile of mediaFiles) {
        // TODO: Instead of bailing, come up with a
        // default name for each possible MIME type.
        if (!mediaFile.name) {
          if (broadcastChannel) {
            broadcastChannel.postMessage('Sorry! No name found on incoming media.');
          }
          continue
        }
        await cache.put(
          // TODO: Handle scenarios in which mediaFile.name isn't set,
          // or doesn't include a proper extension.
          `${urlPrefix}${Date.now()}-${mediaFile.name}`,
          new Response(mediaFile, {
            headers: {
              'content-length': mediaFile.size,
              'content-type': mediaFile.type,
            },
          })
        );
      }

      // After the POST succeeds, redirect to the main page.
      return Response.redirect('/images?shareTarget', 303)
    };

    const cachedMediaHandler = new CacheOnly({
      cacheName,
      plugins: [
        // Support for cache requests that include a Range: header.
        new RangeRequestsPlugin(),
      ],
    });

    skipWaiting();
    clientsClaim();

    // This will be replaced by the list of files to precache by
    // the `workbox injectManifest` build step.
    precacheAndRoute([{"revision":"0a27a4163254fc8fce870c8cc3a3f94f","url":"404.html"},{"revision":"9da66b5d779819c7c9bd13fb7822d8aa","url":"components.css"},{"revision":"9da66b5d779819c7c9bd13fb7822d8aa","url":"components2.css"},{"revision":"46d5bd44fd4204f49960d5e94fb31a92","url":"index.html"},{"revision":"d41d8cd98f00b204e9800998ecf8427e","url":"main.css"},{"revision":"400febbce97e2a70ec56aea85cc02dd3","url":"main.js"}]);

    registerRoute('/_share-target', shareTargetHandler, 'POST');

    registerRoute(new RegExp('/_media/'), cachedMediaHandler);

    // test content: {"type":"newfact","itemKey":"-Ldehm5uG6-Aij15awKw","message":"newfact!!","title":"pushTitle"}
    self.addEventListener('push', function (event) {
      var msg = preparePushMessage(event);
      event.waitUntil(self.registration.showNotification(msg.title, msg.options));
    });

}());
//# sourceMappingURL=service-worker_temp.js.map
