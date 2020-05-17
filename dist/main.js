
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
(function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value' || descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * Copyright 2019 Google Inc. All Rights Reserved.
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *     http://www.apache.org/licenses/LICENSE-2.0
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const proxyMarker = Symbol("Comlink.proxy");
    const createEndpoint = Symbol("Comlink.endpoint");
    const releaseProxy = Symbol("Comlink.releaseProxy");
    const throwMarker = Symbol("Comlink.thrown");
    const isObject = (val) => (typeof val === "object" && val !== null) || typeof val === "function";
    /**
     * Internal transfer handle to handle objects marked to proxy.
     */
    const proxyTransferHandler = {
        canHandle: (val) => isObject(val) && val[proxyMarker],
        serialize(obj) {
            const { port1, port2 } = new MessageChannel();
            expose(obj, port1);
            return [port2, [port2]];
        },
        deserialize(port) {
            port.start();
            return wrap(port);
        },
    };
    /**
     * Internal transfer handler to handle thrown exceptions.
     */
    const throwTransferHandler = {
        canHandle: (value) => isObject(value) && throwMarker in value,
        serialize({ value }) {
            let serialized;
            if (value instanceof Error) {
                serialized = {
                    isError: true,
                    value: {
                        message: value.message,
                        name: value.name,
                        stack: value.stack,
                    },
                };
            }
            else {
                serialized = { isError: false, value };
            }
            return [serialized, []];
        },
        deserialize(serialized) {
            if (serialized.isError) {
                throw Object.assign(new Error(serialized.value.message), serialized.value);
            }
            throw serialized.value;
        },
    };
    /**
     * Allows customizing the serialization of certain values.
     */
    const transferHandlers = new Map([
        ["proxy", proxyTransferHandler],
        ["throw", throwTransferHandler],
    ]);
    function expose(obj, ep = self) {
        ep.addEventListener("message", function callback(ev) {
            if (!ev || !ev.data) {
                return;
            }
            const { id, type, path } = Object.assign({ path: [] }, ev.data);
            const argumentList = (ev.data.argumentList || []).map(fromWireValue);
            let returnValue;
            try {
                const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
                const rawValue = path.reduce((obj, prop) => obj[prop], obj);
                switch (type) {
                    case 0 /* GET */:
                        {
                            returnValue = rawValue;
                        }
                        break;
                    case 1 /* SET */:
                        {
                            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                            returnValue = true;
                        }
                        break;
                    case 2 /* APPLY */:
                        {
                            returnValue = rawValue.apply(parent, argumentList);
                        }
                        break;
                    case 3 /* CONSTRUCT */:
                        {
                            const value = new rawValue(...argumentList);
                            returnValue = proxy(value);
                        }
                        break;
                    case 4 /* ENDPOINT */:
                        {
                            const { port1, port2 } = new MessageChannel();
                            expose(obj, port2);
                            returnValue = transfer(port1, [port1]);
                        }
                        break;
                    case 5 /* RELEASE */:
                        {
                            returnValue = undefined;
                        }
                        break;
                }
            }
            catch (value) {
                returnValue = { value, [throwMarker]: 0 };
            }
            Promise.resolve(returnValue)
                .catch((value) => {
                return { value, [throwMarker]: 0 };
            })
                .then((returnValue) => {
                const [wireValue, transferables] = toWireValue(returnValue);
                ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
                if (type === 5 /* RELEASE */) {
                    // detach and deactive after sending release response above.
                    ep.removeEventListener("message", callback);
                    closeEndPoint(ep);
                }
            });
        });
        if (ep.start) {
            ep.start();
        }
    }
    function isMessagePort(endpoint) {
        return endpoint.constructor.name === "MessagePort";
    }
    function closeEndPoint(endpoint) {
        if (isMessagePort(endpoint))
            endpoint.close();
    }
    function wrap(ep, target) {
        return createProxy(ep, [], target);
    }
    function throwIfProxyReleased(isReleased) {
        if (isReleased) {
            throw new Error("Proxy has been released and is not useable");
        }
    }
    function createProxy(ep, path = [], target = function () { }) {
        let isProxyReleased = false;
        const proxy = new Proxy(target, {
            get(_target, prop) {
                throwIfProxyReleased(isProxyReleased);
                if (prop === releaseProxy) {
                    return () => {
                        return requestResponseMessage(ep, {
                            type: 5 /* RELEASE */,
                            path: path.map((p) => p.toString()),
                        }).then(() => {
                            closeEndPoint(ep);
                            isProxyReleased = true;
                        });
                    };
                }
                if (prop === "then") {
                    if (path.length === 0) {
                        return { then: () => proxy };
                    }
                    const r = requestResponseMessage(ep, {
                        type: 0 /* GET */,
                        path: path.map((p) => p.toString()),
                    }).then(fromWireValue);
                    return r.then.bind(r);
                }
                return createProxy(ep, [...path, prop]);
            },
            set(_target, prop, rawValue) {
                throwIfProxyReleased(isProxyReleased);
                // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
                // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
                const [value, transferables] = toWireValue(rawValue);
                return requestResponseMessage(ep, {
                    type: 1 /* SET */,
                    path: [...path, prop].map((p) => p.toString()),
                    value,
                }, transferables).then(fromWireValue);
            },
            apply(_target, _thisArg, rawArgumentList) {
                throwIfProxyReleased(isProxyReleased);
                const last = path[path.length - 1];
                if (last === createEndpoint) {
                    return requestResponseMessage(ep, {
                        type: 4 /* ENDPOINT */,
                    }).then(fromWireValue);
                }
                // We just pretend that `bind()` didn’t happen.
                if (last === "bind") {
                    return createProxy(ep, path.slice(0, -1));
                }
                const [argumentList, transferables] = processArguments(rawArgumentList);
                return requestResponseMessage(ep, {
                    type: 2 /* APPLY */,
                    path: path.map((p) => p.toString()),
                    argumentList,
                }, transferables).then(fromWireValue);
            },
            construct(_target, rawArgumentList) {
                throwIfProxyReleased(isProxyReleased);
                const [argumentList, transferables] = processArguments(rawArgumentList);
                return requestResponseMessage(ep, {
                    type: 3 /* CONSTRUCT */,
                    path: path.map((p) => p.toString()),
                    argumentList,
                }, transferables).then(fromWireValue);
            },
        });
        return proxy;
    }
    function myFlat(arr) {
        return Array.prototype.concat.apply([], arr);
    }
    function processArguments(argumentList) {
        const processed = argumentList.map(toWireValue);
        return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
    }
    const transferCache = new WeakMap();
    function transfer(obj, transfers) {
        transferCache.set(obj, transfers);
        return obj;
    }
    function proxy(obj) {
        return Object.assign(obj, { [proxyMarker]: true });
    }
    function toWireValue(value) {
        for (const [name, handler] of transferHandlers) {
            if (handler.canHandle(value)) {
                const [serializedValue, transferables] = handler.serialize(value);
                return [
                    {
                        type: 3 /* HANDLER */,
                        name,
                        value: serializedValue,
                    },
                    transferables,
                ];
            }
        }
        return [
            {
                type: 0 /* RAW */,
                value,
            },
            transferCache.get(value) || [],
        ];
    }
    function fromWireValue(value) {
        switch (value.type) {
            case 3 /* HANDLER */:
                return transferHandlers.get(value.name).deserialize(value.value);
            case 0 /* RAW */:
                return value.value;
        }
    }
    function requestResponseMessage(ep, msg, transfers) {
        return new Promise((resolve) => {
            const id = generateUUID();
            ep.addEventListener("message", function l(ev) {
                if (!ev.data || !ev.data.id || ev.data.id !== id) {
                    return;
                }
                ep.removeEventListener("message", l);
                resolve(ev.data);
            });
            if (ep.start) {
                ep.start();
            }
            ep.postMessage(Object.assign({ id }, msg), transfers);
        });
    }
    function generateUUID() {
        return new Array(4)
            .fill(0)
            .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
            .join("-");
    }
    //# sourceMappingURL=comlink.mjs.map

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const worker = new Worker("worker.js");

    let facts = writable([]);
    let newestFacts = writable([]);
    let factAdapter = writable([]);

    let dataInterface = wrap(worker);

    async function addFactProposal(...p) {
      return dataInterface.addFactProposal(...p);
    }

    async function getFactsProposals(...p) {
      return dataInterface.getFactsProposals(...p);
    }

    async function deleteFactProposal(...p) {
      return dataInterface.deleteFactProposal(...p);
    }

    async function acceptFactProposal(...p) {
      return dataInterface.acceptFactProposal(...p);
    }

    async function deleteFact(...p) {
      return dataInterface.deleteFact(...p);
    }

    async function subscribeToFacts() {
      return facts;
    }

    async function subscribeToNewestFacts() {
      return newestFacts;
    }

    async function loadFacts() {
      var storedFacts = localStorage.getItem("facts") || "[]";
      const factsArray = JSON.parse(storedFacts);

      facts.set(factsArray);
      newestFacts.set(getNewest(factsArray));

      function callback(f) {
        factAdapter.set(f);
      }
      dataInterface.subscribeToFacts(proxy(callback));

      factAdapter.subscribe((f) => {
        // console.log("got call back from comlink", f);
        var valToAdd = Array.isArray(f) ? f : [f];

        var notYetStoredFacts = valToAdd.filter(
          (x) => !factsArray.some((a) => a.key == x.key)
        );

        if (notYetStoredFacts.length == 0) {
          return;
        }

        factsArray.push(...notYetStoredFacts);

        factsArray.sort((x, y) => y.insertTime - x.insertTime);

        let factsForLocalStore = factsArray.filter((x, idx) => idx < 10);
        localStorage.setItem("facts", JSON.stringify(factsForLocalStore));

        facts.set(factsArray);
        newestFacts.set(getNewest(factsArray));
      });
    }

    function getNewest(factsArray) {
      return factsArray.filter((x, idx) => idx < 3);
    }

    loadFacts();

    var candidateSelectors = [
      'input',
      'select',
      'textarea',
      'a[href]',
      'button',
      '[tabindex]',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]:not([contenteditable="false"])',
    ];
    var candidateSelector = candidateSelectors.join(',');

    var matches = typeof Element === 'undefined'
      ? function () {}
      : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;

    function tabbable(el, options) {
      options = options || {};

      var regularTabbables = [];
      var orderedTabbables = [];

      var candidates = el.querySelectorAll(candidateSelector);

      if (options.includeContainer) {
        if (matches.call(el, candidateSelector)) {
          candidates = Array.prototype.slice.apply(candidates);
          candidates.unshift(el);
        }
      }

      var i, candidate, candidateTabindex;
      for (i = 0; i < candidates.length; i++) {
        candidate = candidates[i];

        if (!isNodeMatchingSelectorTabbable(candidate)) continue;

        candidateTabindex = getTabindex(candidate);
        if (candidateTabindex === 0) {
          regularTabbables.push(candidate);
        } else {
          orderedTabbables.push({
            documentOrder: i,
            tabIndex: candidateTabindex,
            node: candidate,
          });
        }
      }

      var tabbableNodes = orderedTabbables
        .sort(sortOrderedTabbables)
        .map(function(a) { return a.node })
        .concat(regularTabbables);

      return tabbableNodes;
    }

    tabbable.isTabbable = isTabbable;
    tabbable.isFocusable = isFocusable;

    function isNodeMatchingSelectorTabbable(node) {
      if (
        !isNodeMatchingSelectorFocusable(node)
        || isNonTabbableRadio(node)
        || getTabindex(node) < 0
      ) {
        return false;
      }
      return true;
    }

    function isTabbable(node) {
      if (!node) throw new Error('No node provided');
      if (matches.call(node, candidateSelector) === false) return false;
      return isNodeMatchingSelectorTabbable(node);
    }

    function isNodeMatchingSelectorFocusable(node) {
      if (
        node.disabled
        || isHiddenInput(node)
        || isHidden(node)
      ) {
        return false;
      }
      return true;
    }

    var focusableCandidateSelector = candidateSelectors.concat('iframe').join(',');
    function isFocusable(node) {
      if (!node) throw new Error('No node provided');
      if (matches.call(node, focusableCandidateSelector) === false) return false;
      return isNodeMatchingSelectorFocusable(node);
    }

    function getTabindex(node) {
      var tabindexAttr = parseInt(node.getAttribute('tabindex'), 10);
      if (!isNaN(tabindexAttr)) return tabindexAttr;
      // Browsers do not return `tabIndex` correctly for contentEditable nodes;
      // so if they don't have a tabindex attribute specifically set, assume it's 0.
      if (isContentEditable(node)) return 0;
      return node.tabIndex;
    }

    function sortOrderedTabbables(a, b) {
      return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
    }

    function isContentEditable(node) {
      return node.contentEditable === 'true';
    }

    function isInput(node) {
      return node.tagName === 'INPUT';
    }

    function isHiddenInput(node) {
      return isInput(node) && node.type === 'hidden';
    }

    function isRadio(node) {
      return isInput(node) && node.type === 'radio';
    }

    function isNonTabbableRadio(node) {
      return isRadio(node) && !isTabbableRadio(node);
    }

    function getCheckedRadio(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].checked) {
          return nodes[i];
        }
      }
    }

    function isTabbableRadio(node) {
      if (!node.name) return true;
      // This won't account for the edge case where you have radio groups with the same
      // in separate forms on the same page.
      var radioSet = node.ownerDocument.querySelectorAll('input[type="radio"][name="' + node.name + '"]');
      var checked = getCheckedRadio(radioSet);
      return !checked || checked === node;
    }

    function isHidden(node) {
      // offsetParent being null will allow detecting cases where an element is invisible or inside an invisible element,
      // as long as the element does not use position: fixed. For them, their visibility has to be checked directly as well.
      return node.offsetParent === null || getComputedStyle(node).visibility === 'hidden';
    }

    var tabbable_1 = tabbable;

    var immutable = extend;

    var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

    function extend() {
        var target = {};

        for (var i = 0; i < arguments.length; i++) {
            var source = arguments[i];

            for (var key in source) {
                if (hasOwnProperty$1.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }

        return target
    }

    var activeFocusDelay;

    var activeFocusTraps = (function() {
      var trapQueue = [];
      return {
        activateTrap: function(trap) {
          if (trapQueue.length > 0) {
            var activeTrap = trapQueue[trapQueue.length - 1];
            if (activeTrap !== trap) {
              activeTrap.pause();
            }
          }

          var trapIndex = trapQueue.indexOf(trap);
          if (trapIndex === -1) {
            trapQueue.push(trap);
          } else {
            // move this existing trap to the front of the queue
            trapQueue.splice(trapIndex, 1);
            trapQueue.push(trap);
          }
        },

        deactivateTrap: function(trap) {
          var trapIndex = trapQueue.indexOf(trap);
          if (trapIndex !== -1) {
            trapQueue.splice(trapIndex, 1);
          }

          if (trapQueue.length > 0) {
            trapQueue[trapQueue.length - 1].unpause();
          }
        }
      };
    })();

    function focusTrap(element, userOptions) {
      var doc = document;
      var container =
        typeof element === 'string' ? doc.querySelector(element) : element;

      var config = immutable(
        {
          returnFocusOnDeactivate: true,
          escapeDeactivates: true
        },
        userOptions
      );

      var state = {
        firstTabbableNode: null,
        lastTabbableNode: null,
        nodeFocusedBeforeActivation: null,
        mostRecentlyFocusedNode: null,
        active: false,
        paused: false
      };

      var trap = {
        activate: activate,
        deactivate: deactivate,
        pause: pause,
        unpause: unpause
      };

      return trap;

      function activate(activateOptions) {
        if (state.active) return;

        updateTabbableNodes();

        state.active = true;
        state.paused = false;
        state.nodeFocusedBeforeActivation = doc.activeElement;

        var onActivate =
          activateOptions && activateOptions.onActivate
            ? activateOptions.onActivate
            : config.onActivate;
        if (onActivate) {
          onActivate();
        }

        addListeners();
        return trap;
      }

      function deactivate(deactivateOptions) {
        if (!state.active) return;

        clearTimeout(activeFocusDelay);

        removeListeners();
        state.active = false;
        state.paused = false;

        activeFocusTraps.deactivateTrap(trap);

        var onDeactivate =
          deactivateOptions && deactivateOptions.onDeactivate !== undefined
            ? deactivateOptions.onDeactivate
            : config.onDeactivate;
        if (onDeactivate) {
          onDeactivate();
        }

        var returnFocus =
          deactivateOptions && deactivateOptions.returnFocus !== undefined
            ? deactivateOptions.returnFocus
            : config.returnFocusOnDeactivate;
        if (returnFocus) {
          delay(function() {
            tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
          });
        }

        return trap;
      }

      function pause() {
        if (state.paused || !state.active) return;
        state.paused = true;
        removeListeners();
      }

      function unpause() {
        if (!state.paused || !state.active) return;
        state.paused = false;
        updateTabbableNodes();
        addListeners();
      }

      function addListeners() {
        if (!state.active) return;

        // There can be only one listening focus trap at a time
        activeFocusTraps.activateTrap(trap);

        // Delay ensures that the focused element doesn't capture the event
        // that caused the focus trap activation.
        activeFocusDelay = delay(function() {
          tryFocus(getInitialFocusNode());
        });

        doc.addEventListener('focusin', checkFocusIn, true);
        doc.addEventListener('mousedown', checkPointerDown, {
          capture: true,
          passive: false
        });
        doc.addEventListener('touchstart', checkPointerDown, {
          capture: true,
          passive: false
        });
        doc.addEventListener('click', checkClick, {
          capture: true,
          passive: false
        });
        doc.addEventListener('keydown', checkKey, {
          capture: true,
          passive: false
        });

        return trap;
      }

      function removeListeners() {
        if (!state.active) return;

        doc.removeEventListener('focusin', checkFocusIn, true);
        doc.removeEventListener('mousedown', checkPointerDown, true);
        doc.removeEventListener('touchstart', checkPointerDown, true);
        doc.removeEventListener('click', checkClick, true);
        doc.removeEventListener('keydown', checkKey, true);

        return trap;
      }

      function getNodeForOption(optionName) {
        var optionValue = config[optionName];
        var node = optionValue;
        if (!optionValue) {
          return null;
        }
        if (typeof optionValue === 'string') {
          node = doc.querySelector(optionValue);
          if (!node) {
            throw new Error('`' + optionName + '` refers to no known node');
          }
        }
        if (typeof optionValue === 'function') {
          node = optionValue();
          if (!node) {
            throw new Error('`' + optionName + '` did not return a node');
          }
        }
        return node;
      }

      function getInitialFocusNode() {
        var node;
        if (getNodeForOption('initialFocus') !== null) {
          node = getNodeForOption('initialFocus');
        } else if (container.contains(doc.activeElement)) {
          node = doc.activeElement;
        } else {
          node = state.firstTabbableNode || getNodeForOption('fallbackFocus');
        }

        if (!node) {
          throw new Error(
            'Your focus-trap needs to have at least one focusable element'
          );
        }

        return node;
      }

      function getReturnFocusNode(previousActiveElement) {
        var node = getNodeForOption('setReturnFocus');
        return node ? node : previousActiveElement;
      }

      // This needs to be done on mousedown and touchstart instead of click
      // so that it precedes the focus event.
      function checkPointerDown(e) {
        if (container.contains(e.target)) return;
        if (config.clickOutsideDeactivates) {
          deactivate({
            returnFocus: !tabbable_1.isFocusable(e.target)
          });
          return;
        }
        // This is needed for mobile devices.
        // (If we'll only let `click` events through,
        // then on mobile they will be blocked anyways if `touchstart` is blocked.)
        if (config.allowOutsideClick && config.allowOutsideClick(e)) {
          return;
        }
        e.preventDefault();
      }

      // In case focus escapes the trap for some strange reason, pull it back in.
      function checkFocusIn(e) {
        // In Firefox when you Tab out of an iframe the Document is briefly focused.
        if (container.contains(e.target) || e.target instanceof Document) {
          return;
        }
        e.stopImmediatePropagation();
        tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
      }

      function checkKey(e) {
        if (config.escapeDeactivates !== false && isEscapeEvent(e)) {
          e.preventDefault();
          deactivate();
          return;
        }
        if (isTabEvent(e)) {
          checkTab(e);
          return;
        }
      }

      // Hijack Tab events on the first and last focusable nodes of the trap,
      // in order to prevent focus from escaping. If it escapes for even a
      // moment it can end up scrolling the page and causing confusion so we
      // kind of need to capture the action at the keydown phase.
      function checkTab(e) {
        updateTabbableNodes();
        if (e.shiftKey && e.target === state.firstTabbableNode) {
          e.preventDefault();
          tryFocus(state.lastTabbableNode);
          return;
        }
        if (!e.shiftKey && e.target === state.lastTabbableNode) {
          e.preventDefault();
          tryFocus(state.firstTabbableNode);
          return;
        }
      }

      function checkClick(e) {
        if (config.clickOutsideDeactivates) return;
        if (container.contains(e.target)) return;
        if (config.allowOutsideClick && config.allowOutsideClick(e)) {
          return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
      }

      function updateTabbableNodes() {
        var tabbableNodes = tabbable_1(container);
        state.firstTabbableNode = tabbableNodes[0] || getInitialFocusNode();
        state.lastTabbableNode =
          tabbableNodes[tabbableNodes.length - 1] || getInitialFocusNode();
      }

      function tryFocus(node) {
        if (node === doc.activeElement) return;
        if (!node || !node.focus) {
          tryFocus(getInitialFocusNode());
          return;
        }
        node.focus();
        state.mostRecentlyFocusedNode = node;
        if (isSelectableInput(node)) {
          node.select();
        }
      }
    }

    function isSelectableInput(node) {
      return (
        node.tagName &&
        node.tagName.toLowerCase() === 'input' &&
        typeof node.select === 'function'
      );
    }

    function isEscapeEvent(e) {
      return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
    }

    function isTabEvent(e) {
      return e.key === 'Tab' || e.keyCode === 9;
    }

    function delay(fn) {
      return setTimeout(fn, 0);
    }

    var focusTrap_1 = focusTrap;

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    function createFocusTrapInstance(surfaceEl, focusTrapFactory, initialFocusEl) {
        if (focusTrapFactory === void 0) { focusTrapFactory = focusTrap_1; }
        return focusTrapFactory(surfaceEl, {
            clickOutsideDeactivates: true,
            escapeDeactivates: false,
            initialFocus: initialFocusEl,
        });
    }
    function isScrollable(el) {
        return el ? el.scrollHeight > el.offsetHeight : false;
    }
    function areTopsMisaligned(els) {
        var tops = new Set();
        [].forEach.call(els, function (el) { return tops.add(el.offsetTop); });
        return tops.size > 1;
    }
    //# sourceMappingURL=util.js.map

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFoundation = /** @class */ (function () {
        function MDCFoundation(adapter) {
            if (adapter === void 0) { adapter = {}; }
            this.adapter_ = adapter;
        }
        Object.defineProperty(MDCFoundation, "cssClasses", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports every
                // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "strings", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "numbers", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "defaultAdapter", {
            get: function () {
                // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
                // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
                // validation.
                return {};
            },
            enumerable: true,
            configurable: true
        });
        MDCFoundation.prototype.init = function () {
            // Subclasses should override this method to perform initialization routines (registering events, etc.)
        };
        MDCFoundation.prototype.destroy = function () {
            // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
        };
        return MDCFoundation;
    }());
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCComponent = /** @class */ (function () {
        function MDCComponent(root, foundation) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            this.root_ = root;
            this.initialize.apply(this, __spread(args));
            // Note that we initialize foundation here and not within the constructor's default param so that
            // this.root_ is defined and can be used within the foundation class.
            this.foundation_ = foundation === undefined ? this.getDefaultFoundation() : foundation;
            this.foundation_.init();
            this.initialSyncWithDOM();
        }
        MDCComponent.attachTo = function (root) {
            // Subclasses which extend MDCBase should provide an attachTo() method that takes a root element and
            // returns an instantiated component with its root set to that element. Also note that in the cases of
            // subclasses, an explicit foundation class will not have to be passed in; it will simply be initialized
            // from getDefaultFoundation().
            return new MDCComponent(root, new MDCFoundation({}));
        };
        /* istanbul ignore next: method param only exists for typing purposes; it does not need to be unit tested */
        MDCComponent.prototype.initialize = function () {
            var _args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _args[_i] = arguments[_i];
            }
            // Subclasses can override this to do any additional setup work that would be considered part of a
            // "constructor". Essentially, it is a hook into the parent constructor before the foundation is
            // initialized. Any additional arguments besides root and foundation will be passed in here.
        };
        MDCComponent.prototype.getDefaultFoundation = function () {
            // Subclasses must override this method to return a properly configured foundation class for the
            // component.
            throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
                'foundation class');
        };
        MDCComponent.prototype.initialSyncWithDOM = function () {
            // Subclasses should override this method if they need to perform work to synchronize with a host DOM
            // object. An example of this would be a form control wrapper that needs to synchronize its internal state
            // to some property or attribute of the host DOM. Please note: this is *not* the place to perform DOM
            // reads/writes that would cause layout / paint, as this is called synchronously from within the constructor.
        };
        MDCComponent.prototype.destroy = function () {
            // Subclasses may implement this method to release any resources / deregister any listeners they have
            // attached. An example of this might be deregistering a resize event from the window object.
            this.foundation_.destroy();
        };
        MDCComponent.prototype.listen = function (evtType, handler, options) {
            this.root_.addEventListener(evtType, handler, options);
        };
        MDCComponent.prototype.unlisten = function (evtType, handler, options) {
            this.root_.removeEventListener(evtType, handler, options);
        };
        /**
         * Fires a cross-browser-compatible custom event from the component root of the given type, with the given data.
         */
        MDCComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
            if (shouldBubble === void 0) { shouldBubble = false; }
            var evt;
            if (typeof CustomEvent === 'function') {
                evt = new CustomEvent(evtType, {
                    bubbles: shouldBubble,
                    detail: evtData,
                });
            }
            else {
                evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(evtType, shouldBubble, false, evtData);
            }
            this.root_.dispatchEvent(evt);
        };
        return MDCComponent;
    }());
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * @fileoverview A "ponyfill" is a polyfill that doesn't modify the global prototype chain.
     * This makes ponyfills safer than traditional polyfills, especially for libraries like MDC.
     */
    function closest(element, selector) {
        if (element.closest) {
            return element.closest(selector);
        }
        var el = element;
        while (el) {
            if (matches$1(el, selector)) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }
    function matches$1(element, selector) {
        var nativeMatches = element.matches
            || element.webkitMatchesSelector
            || element.msMatchesSelector;
        return nativeMatches.call(element, selector);
    }
    //# sourceMappingURL=ponyfill.js.map

    /**
     * @license
     * Copyright 2019 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * Stores result from applyPassive to avoid redundant processing to detect
     * passive event listener support.
     */
    var supportsPassive_;
    /**
     * Determine whether the current browser supports passive event listeners, and
     * if so, use them.
     */
    function applyPassive(globalObj, forceRefresh) {
        if (globalObj === void 0) { globalObj = window; }
        if (forceRefresh === void 0) { forceRefresh = false; }
        if (supportsPassive_ === undefined || forceRefresh) {
            var isSupported_1 = false;
            try {
                globalObj.document.addEventListener('test', function () { return undefined; }, {
                    get passive() {
                        isSupported_1 = true;
                        return isSupported_1;
                    },
                });
            }
            catch (e) {
            } // tslint:disable-line:no-empty cannot throw error due to tests. tslint also disables console.log.
            supportsPassive_ = isSupported_1;
        }
        return supportsPassive_ ? { passive: true } : false;
    }
    //# sourceMappingURL=events.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses = {
        // Ripple is a special case where the "root" component is really a "mixin" of sorts,
        // given that it's an 'upgrade' to an existing component. That being said it is the root
        // CSS class that all other CSS classes derive from.
        BG_FOCUSED: 'mdc-ripple-upgraded--background-focused',
        FG_ACTIVATION: 'mdc-ripple-upgraded--foreground-activation',
        FG_DEACTIVATION: 'mdc-ripple-upgraded--foreground-deactivation',
        ROOT: 'mdc-ripple-upgraded',
        UNBOUNDED: 'mdc-ripple-upgraded--unbounded',
    };
    var strings = {
        VAR_FG_SCALE: '--mdc-ripple-fg-scale',
        VAR_FG_SIZE: '--mdc-ripple-fg-size',
        VAR_FG_TRANSLATE_END: '--mdc-ripple-fg-translate-end',
        VAR_FG_TRANSLATE_START: '--mdc-ripple-fg-translate-start',
        VAR_LEFT: '--mdc-ripple-left',
        VAR_TOP: '--mdc-ripple-top',
    };
    var numbers = {
        DEACTIVATION_TIMEOUT_MS: 225,
        FG_DEACTIVATION_MS: 150,
        INITIAL_ORIGIN_SCALE: 0.6,
        PADDING: 10,
        TAP_DELAY_MS: 300,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * Stores result from supportsCssVariables to avoid redundant processing to
     * detect CSS custom variable support.
     */
    var supportsCssVariables_;
    function detectEdgePseudoVarBug(windowObj) {
        // Detect versions of Edge with buggy var() support
        // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11495448/
        var document = windowObj.document;
        var node = document.createElement('div');
        node.className = 'mdc-ripple-surface--test-edge-var-bug';
        // Append to head instead of body because this script might be invoked in the
        // head, in which case the body doesn't exist yet. The probe works either way.
        document.head.appendChild(node);
        // The bug exists if ::before style ends up propagating to the parent element.
        // Additionally, getComputedStyle returns null in iframes with display: "none" in Firefox,
        // but Firefox is known to support CSS custom properties correctly.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
        var computedStyle = windowObj.getComputedStyle(node);
        var hasPseudoVarBug = computedStyle !== null && computedStyle.borderTopStyle === 'solid';
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        return hasPseudoVarBug;
    }
    function supportsCssVariables(windowObj, forceRefresh) {
        if (forceRefresh === void 0) { forceRefresh = false; }
        var CSS = windowObj.CSS;
        var supportsCssVars = supportsCssVariables_;
        if (typeof supportsCssVariables_ === 'boolean' && !forceRefresh) {
            return supportsCssVariables_;
        }
        var supportsFunctionPresent = CSS && typeof CSS.supports === 'function';
        if (!supportsFunctionPresent) {
            return false;
        }
        var explicitlySupportsCssVars = CSS.supports('--css-vars', 'yes');
        // See: https://bugs.webkit.org/show_bug.cgi?id=154669
        // See: README section on Safari
        var weAreFeatureDetectingSafari10plus = (CSS.supports('(--css-vars: yes)') &&
            CSS.supports('color', '#00000000'));
        if (explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus) {
            supportsCssVars = !detectEdgePseudoVarBug(windowObj);
        }
        else {
            supportsCssVars = false;
        }
        if (!forceRefresh) {
            supportsCssVariables_ = supportsCssVars;
        }
        return supportsCssVars;
    }
    function getNormalizedEventCoords(evt, pageOffset, clientRect) {
        if (!evt) {
            return { x: 0, y: 0 };
        }
        var x = pageOffset.x, y = pageOffset.y;
        var documentX = x + clientRect.left;
        var documentY = y + clientRect.top;
        var normalizedX;
        var normalizedY;
        // Determine touch point relative to the ripple container.
        if (evt.type === 'touchstart') {
            var touchEvent = evt;
            normalizedX = touchEvent.changedTouches[0].pageX - documentX;
            normalizedY = touchEvent.changedTouches[0].pageY - documentY;
        }
        else {
            var mouseEvent = evt;
            normalizedX = mouseEvent.pageX - documentX;
            normalizedY = mouseEvent.pageY - documentY;
        }
        return { x: normalizedX, y: normalizedY };
    }
    //# sourceMappingURL=util.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    // Activation events registered on the root element of each instance for activation
    var ACTIVATION_EVENT_TYPES = [
        'touchstart', 'pointerdown', 'mousedown', 'keydown',
    ];
    // Deactivation events registered on documentElement when a pointer-related down event occurs
    var POINTER_DEACTIVATION_EVENT_TYPES = [
        'touchend', 'pointerup', 'mouseup', 'contextmenu',
    ];
    // simultaneous nested activations
    var activatedTargets = [];
    var MDCRippleFoundation = /** @class */ (function (_super) {
        __extends(MDCRippleFoundation, _super);
        function MDCRippleFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCRippleFoundation.defaultAdapter, adapter)) || this;
            _this.activationAnimationHasEnded_ = false;
            _this.activationTimer_ = 0;
            _this.fgDeactivationRemovalTimer_ = 0;
            _this.fgScale_ = '0';
            _this.frame_ = { width: 0, height: 0 };
            _this.initialSize_ = 0;
            _this.layoutFrame_ = 0;
            _this.maxRadius_ = 0;
            _this.unboundedCoords_ = { left: 0, top: 0 };
            _this.activationState_ = _this.defaultActivationState_();
            _this.activationTimerCallback_ = function () {
                _this.activationAnimationHasEnded_ = true;
                _this.runDeactivationUXLogicIfReady_();
            };
            _this.activateHandler_ = function (e) { return _this.activate_(e); };
            _this.deactivateHandler_ = function () { return _this.deactivate_(); };
            _this.focusHandler_ = function () { return _this.handleFocus(); };
            _this.blurHandler_ = function () { return _this.handleBlur(); };
            _this.resizeHandler_ = function () { return _this.layout(); };
            return _this;
        }
        Object.defineProperty(MDCRippleFoundation, "cssClasses", {
            get: function () {
                return cssClasses;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "strings", {
            get: function () {
                return strings;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "numbers", {
            get: function () {
                return numbers;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    browserSupportsCssVars: function () { return true; },
                    computeBoundingRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    containsEventTarget: function () { return true; },
                    deregisterDocumentInteractionHandler: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    deregisterResizeHandler: function () { return undefined; },
                    getWindowPageOffset: function () { return ({ x: 0, y: 0 }); },
                    isSurfaceActive: function () { return true; },
                    isSurfaceDisabled: function () { return true; },
                    isUnbounded: function () { return true; },
                    registerDocumentInteractionHandler: function () { return undefined; },
                    registerInteractionHandler: function () { return undefined; },
                    registerResizeHandler: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    updateCssVariable: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCRippleFoundation.prototype.init = function () {
            var _this = this;
            var supportsPressRipple = this.supportsPressRipple_();
            this.registerRootHandlers_(supportsPressRipple);
            if (supportsPressRipple) {
                var _a = MDCRippleFoundation.cssClasses, ROOT_1 = _a.ROOT, UNBOUNDED_1 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.addClass(ROOT_1);
                    if (_this.adapter_.isUnbounded()) {
                        _this.adapter_.addClass(UNBOUNDED_1);
                        // Unbounded ripples need layout logic applied immediately to set coordinates for both shade and ripple
                        _this.layoutInternal_();
                    }
                });
            }
        };
        MDCRippleFoundation.prototype.destroy = function () {
            var _this = this;
            if (this.supportsPressRipple_()) {
                if (this.activationTimer_) {
                    clearTimeout(this.activationTimer_);
                    this.activationTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_ACTIVATION);
                }
                if (this.fgDeactivationRemovalTimer_) {
                    clearTimeout(this.fgDeactivationRemovalTimer_);
                    this.fgDeactivationRemovalTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_DEACTIVATION);
                }
                var _a = MDCRippleFoundation.cssClasses, ROOT_2 = _a.ROOT, UNBOUNDED_2 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.removeClass(ROOT_2);
                    _this.adapter_.removeClass(UNBOUNDED_2);
                    _this.removeCssVars_();
                });
            }
            this.deregisterRootHandlers_();
            this.deregisterDeactivationHandlers_();
        };
        /**
         * @param evt Optional event containing position information.
         */
        MDCRippleFoundation.prototype.activate = function (evt) {
            this.activate_(evt);
        };
        MDCRippleFoundation.prototype.deactivate = function () {
            this.deactivate_();
        };
        MDCRippleFoundation.prototype.layout = function () {
            var _this = this;
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
            }
            this.layoutFrame_ = requestAnimationFrame(function () {
                _this.layoutInternal_();
                _this.layoutFrame_ = 0;
            });
        };
        MDCRippleFoundation.prototype.setUnbounded = function (unbounded) {
            var UNBOUNDED = MDCRippleFoundation.cssClasses.UNBOUNDED;
            if (unbounded) {
                this.adapter_.addClass(UNBOUNDED);
            }
            else {
                this.adapter_.removeClass(UNBOUNDED);
            }
        };
        MDCRippleFoundation.prototype.handleFocus = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.addClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        MDCRippleFoundation.prototype.handleBlur = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.removeClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        /**
         * We compute this property so that we are not querying information about the client
         * until the point in time where the foundation requests it. This prevents scenarios where
         * client-side feature-detection may happen too early, such as when components are rendered on the server
         * and then initialized at mount time on the client.
         */
        MDCRippleFoundation.prototype.supportsPressRipple_ = function () {
            return this.adapter_.browserSupportsCssVars();
        };
        MDCRippleFoundation.prototype.defaultActivationState_ = function () {
            return {
                activationEvent: undefined,
                hasDeactivationUXRun: false,
                isActivated: false,
                isProgrammatic: false,
                wasActivatedByPointer: false,
                wasElementMadeActive: false,
            };
        };
        /**
         * supportsPressRipple Passed from init to save a redundant function call
         */
        MDCRippleFoundation.prototype.registerRootHandlers_ = function (supportsPressRipple) {
            var _this = this;
            if (supportsPressRipple) {
                ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerInteractionHandler(evtType, _this.activateHandler_);
                });
                if (this.adapter_.isUnbounded()) {
                    this.adapter_.registerResizeHandler(this.resizeHandler_);
                }
            }
            this.adapter_.registerInteractionHandler('focus', this.focusHandler_);
            this.adapter_.registerInteractionHandler('blur', this.blurHandler_);
        };
        MDCRippleFoundation.prototype.registerDeactivationHandlers_ = function (evt) {
            var _this = this;
            if (evt.type === 'keydown') {
                this.adapter_.registerInteractionHandler('keyup', this.deactivateHandler_);
            }
            else {
                POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerDocumentInteractionHandler(evtType, _this.deactivateHandler_);
                });
            }
        };
        MDCRippleFoundation.prototype.deregisterRootHandlers_ = function () {
            var _this = this;
            ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterInteractionHandler(evtType, _this.activateHandler_);
            });
            this.adapter_.deregisterInteractionHandler('focus', this.focusHandler_);
            this.adapter_.deregisterInteractionHandler('blur', this.blurHandler_);
            if (this.adapter_.isUnbounded()) {
                this.adapter_.deregisterResizeHandler(this.resizeHandler_);
            }
        };
        MDCRippleFoundation.prototype.deregisterDeactivationHandlers_ = function () {
            var _this = this;
            this.adapter_.deregisterInteractionHandler('keyup', this.deactivateHandler_);
            POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterDocumentInteractionHandler(evtType, _this.deactivateHandler_);
            });
        };
        MDCRippleFoundation.prototype.removeCssVars_ = function () {
            var _this = this;
            var rippleStrings = MDCRippleFoundation.strings;
            var keys = Object.keys(rippleStrings);
            keys.forEach(function (key) {
                if (key.indexOf('VAR_') === 0) {
                    _this.adapter_.updateCssVariable(rippleStrings[key], null);
                }
            });
        };
        MDCRippleFoundation.prototype.activate_ = function (evt) {
            var _this = this;
            if (this.adapter_.isSurfaceDisabled()) {
                return;
            }
            var activationState = this.activationState_;
            if (activationState.isActivated) {
                return;
            }
            // Avoid reacting to follow-on events fired by touch device after an already-processed user interaction
            var previousActivationEvent = this.previousActivationEvent_;
            var isSameInteraction = previousActivationEvent && evt !== undefined && previousActivationEvent.type !== evt.type;
            if (isSameInteraction) {
                return;
            }
            activationState.isActivated = true;
            activationState.isProgrammatic = evt === undefined;
            activationState.activationEvent = evt;
            activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : evt !== undefined && (evt.type === 'mousedown' || evt.type === 'touchstart' || evt.type === 'pointerdown');
            var hasActivatedChild = evt !== undefined && activatedTargets.length > 0 && activatedTargets.some(function (target) { return _this.adapter_.containsEventTarget(target); });
            if (hasActivatedChild) {
                // Immediately reset activation state, while preserving logic that prevents touch follow-on events
                this.resetActivationState_();
                return;
            }
            if (evt !== undefined) {
                activatedTargets.push(evt.target);
                this.registerDeactivationHandlers_(evt);
            }
            activationState.wasElementMadeActive = this.checkElementMadeActive_(evt);
            if (activationState.wasElementMadeActive) {
                this.animateActivation_();
            }
            requestAnimationFrame(function () {
                // Reset array on next frame after the current event has had a chance to bubble to prevent ancestor ripples
                activatedTargets = [];
                if (!activationState.wasElementMadeActive
                    && evt !== undefined
                    && (evt.key === ' ' || evt.keyCode === 32)) {
                    // If space was pressed, try again within an rAF call to detect :active, because different UAs report
                    // active states inconsistently when they're called within event handling code:
                    // - https://bugs.chromium.org/p/chromium/issues/detail?id=635971
                    // - https://bugzilla.mozilla.org/show_bug.cgi?id=1293741
                    // We try first outside rAF to support Edge, which does not exhibit this problem, but will crash if a CSS
                    // variable is set within a rAF callback for a submit button interaction (#2241).
                    activationState.wasElementMadeActive = _this.checkElementMadeActive_(evt);
                    if (activationState.wasElementMadeActive) {
                        _this.animateActivation_();
                    }
                }
                if (!activationState.wasElementMadeActive) {
                    // Reset activation state immediately if element was not made active.
                    _this.activationState_ = _this.defaultActivationState_();
                }
            });
        };
        MDCRippleFoundation.prototype.checkElementMadeActive_ = function (evt) {
            return (evt !== undefined && evt.type === 'keydown') ? this.adapter_.isSurfaceActive() : true;
        };
        MDCRippleFoundation.prototype.animateActivation_ = function () {
            var _this = this;
            var _a = MDCRippleFoundation.strings, VAR_FG_TRANSLATE_START = _a.VAR_FG_TRANSLATE_START, VAR_FG_TRANSLATE_END = _a.VAR_FG_TRANSLATE_END;
            var _b = MDCRippleFoundation.cssClasses, FG_DEACTIVATION = _b.FG_DEACTIVATION, FG_ACTIVATION = _b.FG_ACTIVATION;
            var DEACTIVATION_TIMEOUT_MS = MDCRippleFoundation.numbers.DEACTIVATION_TIMEOUT_MS;
            this.layoutInternal_();
            var translateStart = '';
            var translateEnd = '';
            if (!this.adapter_.isUnbounded()) {
                var _c = this.getFgTranslationCoordinates_(), startPoint = _c.startPoint, endPoint = _c.endPoint;
                translateStart = startPoint.x + "px, " + startPoint.y + "px";
                translateEnd = endPoint.x + "px, " + endPoint.y + "px";
            }
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
            // Cancel any ongoing activation/deactivation animations
            clearTimeout(this.activationTimer_);
            clearTimeout(this.fgDeactivationRemovalTimer_);
            this.rmBoundedActivationClasses_();
            this.adapter_.removeClass(FG_DEACTIVATION);
            // Force layout in order to re-trigger the animation.
            this.adapter_.computeBoundingRect();
            this.adapter_.addClass(FG_ACTIVATION);
            this.activationTimer_ = setTimeout(function () { return _this.activationTimerCallback_(); }, DEACTIVATION_TIMEOUT_MS);
        };
        MDCRippleFoundation.prototype.getFgTranslationCoordinates_ = function () {
            var _a = this.activationState_, activationEvent = _a.activationEvent, wasActivatedByPointer = _a.wasActivatedByPointer;
            var startPoint;
            if (wasActivatedByPointer) {
                startPoint = getNormalizedEventCoords(activationEvent, this.adapter_.getWindowPageOffset(), this.adapter_.computeBoundingRect());
            }
            else {
                startPoint = {
                    x: this.frame_.width / 2,
                    y: this.frame_.height / 2,
                };
            }
            // Center the element around the start point.
            startPoint = {
                x: startPoint.x - (this.initialSize_ / 2),
                y: startPoint.y - (this.initialSize_ / 2),
            };
            var endPoint = {
                x: (this.frame_.width / 2) - (this.initialSize_ / 2),
                y: (this.frame_.height / 2) - (this.initialSize_ / 2),
            };
            return { startPoint: startPoint, endPoint: endPoint };
        };
        MDCRippleFoundation.prototype.runDeactivationUXLogicIfReady_ = function () {
            var _this = this;
            // This method is called both when a pointing device is released, and when the activation animation ends.
            // The deactivation animation should only run after both of those occur.
            var FG_DEACTIVATION = MDCRippleFoundation.cssClasses.FG_DEACTIVATION;
            var _a = this.activationState_, hasDeactivationUXRun = _a.hasDeactivationUXRun, isActivated = _a.isActivated;
            var activationHasEnded = hasDeactivationUXRun || !isActivated;
            if (activationHasEnded && this.activationAnimationHasEnded_) {
                this.rmBoundedActivationClasses_();
                this.adapter_.addClass(FG_DEACTIVATION);
                this.fgDeactivationRemovalTimer_ = setTimeout(function () {
                    _this.adapter_.removeClass(FG_DEACTIVATION);
                }, numbers.FG_DEACTIVATION_MS);
            }
        };
        MDCRippleFoundation.prototype.rmBoundedActivationClasses_ = function () {
            var FG_ACTIVATION = MDCRippleFoundation.cssClasses.FG_ACTIVATION;
            this.adapter_.removeClass(FG_ACTIVATION);
            this.activationAnimationHasEnded_ = false;
            this.adapter_.computeBoundingRect();
        };
        MDCRippleFoundation.prototype.resetActivationState_ = function () {
            var _this = this;
            this.previousActivationEvent_ = this.activationState_.activationEvent;
            this.activationState_ = this.defaultActivationState_();
            // Touch devices may fire additional events for the same interaction within a short time.
            // Store the previous event until it's safe to assume that subsequent events are for new interactions.
            setTimeout(function () { return _this.previousActivationEvent_ = undefined; }, MDCRippleFoundation.numbers.TAP_DELAY_MS);
        };
        MDCRippleFoundation.prototype.deactivate_ = function () {
            var _this = this;
            var activationState = this.activationState_;
            // This can happen in scenarios such as when you have a keyup event that blurs the element.
            if (!activationState.isActivated) {
                return;
            }
            var state = __assign({}, activationState);
            if (activationState.isProgrammatic) {
                requestAnimationFrame(function () { return _this.animateDeactivation_(state); });
                this.resetActivationState_();
            }
            else {
                this.deregisterDeactivationHandlers_();
                requestAnimationFrame(function () {
                    _this.activationState_.hasDeactivationUXRun = true;
                    _this.animateDeactivation_(state);
                    _this.resetActivationState_();
                });
            }
        };
        MDCRippleFoundation.prototype.animateDeactivation_ = function (_a) {
            var wasActivatedByPointer = _a.wasActivatedByPointer, wasElementMadeActive = _a.wasElementMadeActive;
            if (wasActivatedByPointer || wasElementMadeActive) {
                this.runDeactivationUXLogicIfReady_();
            }
        };
        MDCRippleFoundation.prototype.layoutInternal_ = function () {
            var _this = this;
            this.frame_ = this.adapter_.computeBoundingRect();
            var maxDim = Math.max(this.frame_.height, this.frame_.width);
            // Surface diameter is treated differently for unbounded vs. bounded ripples.
            // Unbounded ripple diameter is calculated smaller since the surface is expected to already be padded appropriately
            // to extend the hitbox, and the ripple is expected to meet the edges of the padded hitbox (which is typically
            // square). Bounded ripples, on the other hand, are fully expected to expand beyond the surface's longest diameter
            // (calculated based on the diagonal plus a constant padding), and are clipped at the surface's border via
            // `overflow: hidden`.
            var getBoundedRadius = function () {
                var hypotenuse = Math.sqrt(Math.pow(_this.frame_.width, 2) + Math.pow(_this.frame_.height, 2));
                return hypotenuse + MDCRippleFoundation.numbers.PADDING;
            };
            this.maxRadius_ = this.adapter_.isUnbounded() ? maxDim : getBoundedRadius();
            // Ripple is sized as a fraction of the largest dimension of the surface, then scales up using a CSS scale transform
            this.initialSize_ = Math.floor(maxDim * MDCRippleFoundation.numbers.INITIAL_ORIGIN_SCALE);
            this.fgScale_ = "" + this.maxRadius_ / this.initialSize_;
            this.updateLayoutCssVars_();
        };
        MDCRippleFoundation.prototype.updateLayoutCssVars_ = function () {
            var _a = MDCRippleFoundation.strings, VAR_FG_SIZE = _a.VAR_FG_SIZE, VAR_LEFT = _a.VAR_LEFT, VAR_TOP = _a.VAR_TOP, VAR_FG_SCALE = _a.VAR_FG_SCALE;
            this.adapter_.updateCssVariable(VAR_FG_SIZE, this.initialSize_ + "px");
            this.adapter_.updateCssVariable(VAR_FG_SCALE, this.fgScale_);
            if (this.adapter_.isUnbounded()) {
                this.unboundedCoords_ = {
                    left: Math.round((this.frame_.width / 2) - (this.initialSize_ / 2)),
                    top: Math.round((this.frame_.height / 2) - (this.initialSize_ / 2)),
                };
                this.adapter_.updateCssVariable(VAR_LEFT, this.unboundedCoords_.left + "px");
                this.adapter_.updateCssVariable(VAR_TOP, this.unboundedCoords_.top + "px");
            }
        };
        return MDCRippleFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCRipple = /** @class */ (function (_super) {
        __extends(MDCRipple, _super);
        function MDCRipple() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.disabled = false;
            return _this;
        }
        MDCRipple.attachTo = function (root, opts) {
            if (opts === void 0) { opts = { isUnbounded: undefined }; }
            var ripple = new MDCRipple(root);
            // Only override unbounded behavior if option is explicitly specified
            if (opts.isUnbounded !== undefined) {
                ripple.unbounded = opts.isUnbounded;
            }
            return ripple;
        };
        MDCRipple.createAdapter = function (instance) {
            return {
                addClass: function (className) { return instance.root_.classList.add(className); },
                browserSupportsCssVars: function () { return supportsCssVariables(window); },
                computeBoundingRect: function () { return instance.root_.getBoundingClientRect(); },
                containsEventTarget: function (target) { return instance.root_.contains(target); },
                deregisterDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterInteractionHandler: function (evtType, handler) {
                    return instance.root_.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterResizeHandler: function (handler) { return window.removeEventListener('resize', handler); },
                getWindowPageOffset: function () { return ({ x: window.pageXOffset, y: window.pageYOffset }); },
                isSurfaceActive: function () { return matches$1(instance.root_, ':active'); },
                isSurfaceDisabled: function () { return Boolean(instance.disabled); },
                isUnbounded: function () { return Boolean(instance.unbounded); },
                registerDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.addEventListener(evtType, handler, applyPassive());
                },
                registerInteractionHandler: function (evtType, handler) {
                    return instance.root_.addEventListener(evtType, handler, applyPassive());
                },
                registerResizeHandler: function (handler) { return window.addEventListener('resize', handler); },
                removeClass: function (className) { return instance.root_.classList.remove(className); },
                updateCssVariable: function (varName, value) { return instance.root_.style.setProperty(varName, value); },
            };
        };
        Object.defineProperty(MDCRipple.prototype, "unbounded", {
            get: function () {
                return Boolean(this.unbounded_);
            },
            set: function (unbounded) {
                this.unbounded_ = Boolean(unbounded);
                this.setUnbounded_();
            },
            enumerable: true,
            configurable: true
        });
        MDCRipple.prototype.activate = function () {
            this.foundation_.activate();
        };
        MDCRipple.prototype.deactivate = function () {
            this.foundation_.deactivate();
        };
        MDCRipple.prototype.layout = function () {
            this.foundation_.layout();
        };
        MDCRipple.prototype.getDefaultFoundation = function () {
            return new MDCRippleFoundation(MDCRipple.createAdapter(this));
        };
        MDCRipple.prototype.initialSyncWithDOM = function () {
            var root = this.root_;
            this.unbounded = 'mdcRippleIsUnbounded' in root.dataset;
        };
        /**
         * Closure Compiler throws an access control error when directly accessing a
         * protected or private property inside a getter/setter, like unbounded above.
         * By accessing the protected property inside a method, we solve that problem.
         * That's why this function exists.
         */
        MDCRipple.prototype.setUnbounded_ = function () {
            this.foundation_.setUnbounded(Boolean(this.unbounded_));
        };
        return MDCRipple;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$1 = {
        CLOSING: 'mdc-dialog--closing',
        OPEN: 'mdc-dialog--open',
        OPENING: 'mdc-dialog--opening',
        SCROLLABLE: 'mdc-dialog--scrollable',
        SCROLL_LOCK: 'mdc-dialog-scroll-lock',
        STACKED: 'mdc-dialog--stacked',
    };
    var strings$1 = {
        ACTION_ATTRIBUTE: 'data-mdc-dialog-action',
        BUTTON_DEFAULT_ATTRIBUTE: 'data-mdc-dialog-button-default',
        BUTTON_SELECTOR: '.mdc-dialog__button',
        CLOSED_EVENT: 'MDCDialog:closed',
        CLOSE_ACTION: 'close',
        CLOSING_EVENT: 'MDCDialog:closing',
        CONTAINER_SELECTOR: '.mdc-dialog__container',
        CONTENT_SELECTOR: '.mdc-dialog__content',
        DESTROY_ACTION: 'destroy',
        INITIAL_FOCUS_ATTRIBUTE: 'data-mdc-dialog-initial-focus',
        OPENED_EVENT: 'MDCDialog:opened',
        OPENING_EVENT: 'MDCDialog:opening',
        SCRIM_SELECTOR: '.mdc-dialog__scrim',
        SUPPRESS_DEFAULT_PRESS_SELECTOR: [
            'textarea',
            '.mdc-menu .mdc-list-item',
        ].join(', '),
        SURFACE_SELECTOR: '.mdc-dialog__surface',
    };
    var numbers$1 = {
        DIALOG_ANIMATION_CLOSE_TIME_MS: 75,
        DIALOG_ANIMATION_OPEN_TIME_MS: 150,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCDialogFoundation = /** @class */ (function (_super) {
        __extends(MDCDialogFoundation, _super);
        function MDCDialogFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCDialogFoundation.defaultAdapter, adapter)) || this;
            _this.isOpen_ = false;
            _this.animationFrame_ = 0;
            _this.animationTimer_ = 0;
            _this.layoutFrame_ = 0;
            _this.escapeKeyAction_ = strings$1.CLOSE_ACTION;
            _this.scrimClickAction_ = strings$1.CLOSE_ACTION;
            _this.autoStackButtons_ = true;
            _this.areButtonsStacked_ = false;
            return _this;
        }
        Object.defineProperty(MDCDialogFoundation, "cssClasses", {
            get: function () {
                return cssClasses$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialogFoundation, "strings", {
            get: function () {
                return strings$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialogFoundation, "numbers", {
            get: function () {
                return numbers$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialogFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addBodyClass: function () { return undefined; },
                    addClass: function () { return undefined; },
                    areButtonsStacked: function () { return false; },
                    clickDefaultButton: function () { return undefined; },
                    eventTargetMatches: function () { return false; },
                    getActionFromEvent: function () { return ''; },
                    getInitialFocusEl: function () { return null; },
                    hasClass: function () { return false; },
                    isContentScrollable: function () { return false; },
                    notifyClosed: function () { return undefined; },
                    notifyClosing: function () { return undefined; },
                    notifyOpened: function () { return undefined; },
                    notifyOpening: function () { return undefined; },
                    releaseFocus: function () { return undefined; },
                    removeBodyClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    reverseButtons: function () { return undefined; },
                    trapFocus: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCDialogFoundation.prototype.init = function () {
            if (this.adapter_.hasClass(cssClasses$1.STACKED)) {
                this.setAutoStackButtons(false);
            }
        };
        MDCDialogFoundation.prototype.destroy = function () {
            if (this.isOpen_) {
                this.close(strings$1.DESTROY_ACTION);
            }
            if (this.animationTimer_) {
                clearTimeout(this.animationTimer_);
                this.handleAnimationTimerEnd_();
            }
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
                this.layoutFrame_ = 0;
            }
        };
        MDCDialogFoundation.prototype.open = function () {
            var _this = this;
            this.isOpen_ = true;
            this.adapter_.notifyOpening();
            this.adapter_.addClass(cssClasses$1.OPENING);
            // Wait a frame once display is no longer "none", to establish basis for animation
            this.runNextAnimationFrame_(function () {
                _this.adapter_.addClass(cssClasses$1.OPEN);
                _this.adapter_.addBodyClass(cssClasses$1.SCROLL_LOCK);
                _this.layout();
                _this.animationTimer_ = setTimeout(function () {
                    _this.handleAnimationTimerEnd_();
                    _this.adapter_.trapFocus(_this.adapter_.getInitialFocusEl());
                    _this.adapter_.notifyOpened();
                }, numbers$1.DIALOG_ANIMATION_OPEN_TIME_MS);
            });
        };
        MDCDialogFoundation.prototype.close = function (action) {
            var _this = this;
            if (action === void 0) { action = ''; }
            if (!this.isOpen_) {
                // Avoid redundant close calls (and events), e.g. from keydown on elements that inherently emit click
                return;
            }
            this.isOpen_ = false;
            this.adapter_.notifyClosing(action);
            this.adapter_.addClass(cssClasses$1.CLOSING);
            this.adapter_.removeClass(cssClasses$1.OPEN);
            this.adapter_.removeBodyClass(cssClasses$1.SCROLL_LOCK);
            cancelAnimationFrame(this.animationFrame_);
            this.animationFrame_ = 0;
            clearTimeout(this.animationTimer_);
            this.animationTimer_ = setTimeout(function () {
                _this.adapter_.releaseFocus();
                _this.handleAnimationTimerEnd_();
                _this.adapter_.notifyClosed(action);
            }, numbers$1.DIALOG_ANIMATION_CLOSE_TIME_MS);
        };
        MDCDialogFoundation.prototype.isOpen = function () {
            return this.isOpen_;
        };
        MDCDialogFoundation.prototype.getEscapeKeyAction = function () {
            return this.escapeKeyAction_;
        };
        MDCDialogFoundation.prototype.setEscapeKeyAction = function (action) {
            this.escapeKeyAction_ = action;
        };
        MDCDialogFoundation.prototype.getScrimClickAction = function () {
            return this.scrimClickAction_;
        };
        MDCDialogFoundation.prototype.setScrimClickAction = function (action) {
            this.scrimClickAction_ = action;
        };
        MDCDialogFoundation.prototype.getAutoStackButtons = function () {
            return this.autoStackButtons_;
        };
        MDCDialogFoundation.prototype.setAutoStackButtons = function (autoStack) {
            this.autoStackButtons_ = autoStack;
        };
        MDCDialogFoundation.prototype.layout = function () {
            var _this = this;
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
            }
            this.layoutFrame_ = requestAnimationFrame(function () {
                _this.layoutInternal_();
                _this.layoutFrame_ = 0;
            });
        };
        /** Handles click on the dialog root element. */
        MDCDialogFoundation.prototype.handleClick = function (evt) {
            var isScrim = this.adapter_.eventTargetMatches(evt.target, strings$1.SCRIM_SELECTOR);
            // Check for scrim click first since it doesn't require querying ancestors.
            if (isScrim && this.scrimClickAction_ !== '') {
                this.close(this.scrimClickAction_);
            }
            else {
                var action = this.adapter_.getActionFromEvent(evt);
                if (action) {
                    this.close(action);
                }
            }
        };
        /** Handles keydown on the dialog root element. */
        MDCDialogFoundation.prototype.handleKeydown = function (evt) {
            var isEnter = evt.key === 'Enter' || evt.keyCode === 13;
            if (!isEnter) {
                return;
            }
            var action = this.adapter_.getActionFromEvent(evt);
            if (action) {
                // Action button callback is handled in `handleClick`,
                // since space/enter keydowns on buttons trigger click events.
                return;
            }
            var isDefault = !this.adapter_.eventTargetMatches(evt.target, strings$1.SUPPRESS_DEFAULT_PRESS_SELECTOR);
            if (isEnter && isDefault) {
                this.adapter_.clickDefaultButton();
            }
        };
        /** Handles keydown on the document. */
        MDCDialogFoundation.prototype.handleDocumentKeydown = function (evt) {
            var isEscape = evt.key === 'Escape' || evt.keyCode === 27;
            if (isEscape && this.escapeKeyAction_ !== '') {
                this.close(this.escapeKeyAction_);
            }
        };
        MDCDialogFoundation.prototype.layoutInternal_ = function () {
            if (this.autoStackButtons_) {
                this.detectStackedButtons_();
            }
            this.detectScrollableContent_();
        };
        MDCDialogFoundation.prototype.handleAnimationTimerEnd_ = function () {
            this.animationTimer_ = 0;
            this.adapter_.removeClass(cssClasses$1.OPENING);
            this.adapter_.removeClass(cssClasses$1.CLOSING);
        };
        /**
         * Runs the given logic on the next animation frame, using setTimeout to factor in Firefox reflow behavior.
         */
        MDCDialogFoundation.prototype.runNextAnimationFrame_ = function (callback) {
            var _this = this;
            cancelAnimationFrame(this.animationFrame_);
            this.animationFrame_ = requestAnimationFrame(function () {
                _this.animationFrame_ = 0;
                clearTimeout(_this.animationTimer_);
                _this.animationTimer_ = setTimeout(callback, 0);
            });
        };
        MDCDialogFoundation.prototype.detectStackedButtons_ = function () {
            // Remove the class first to let us measure the buttons' natural positions.
            this.adapter_.removeClass(cssClasses$1.STACKED);
            var areButtonsStacked = this.adapter_.areButtonsStacked();
            if (areButtonsStacked) {
                this.adapter_.addClass(cssClasses$1.STACKED);
            }
            if (areButtonsStacked !== this.areButtonsStacked_) {
                this.adapter_.reverseButtons();
                this.areButtonsStacked_ = areButtonsStacked;
            }
        };
        MDCDialogFoundation.prototype.detectScrollableContent_ = function () {
            // Remove the class first to let us measure the natural height of the content.
            this.adapter_.removeClass(cssClasses$1.SCROLLABLE);
            if (this.adapter_.isContentScrollable()) {
                this.adapter_.addClass(cssClasses$1.SCROLLABLE);
            }
        };
        return MDCDialogFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$2 = MDCDialogFoundation.strings;
    var MDCDialog = /** @class */ (function (_super) {
        __extends(MDCDialog, _super);
        function MDCDialog() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(MDCDialog.prototype, "isOpen", {
            get: function () {
                return this.foundation_.isOpen();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialog.prototype, "escapeKeyAction", {
            get: function () {
                return this.foundation_.getEscapeKeyAction();
            },
            set: function (action) {
                this.foundation_.setEscapeKeyAction(action);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialog.prototype, "scrimClickAction", {
            get: function () {
                return this.foundation_.getScrimClickAction();
            },
            set: function (action) {
                this.foundation_.setScrimClickAction(action);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialog.prototype, "autoStackButtons", {
            get: function () {
                return this.foundation_.getAutoStackButtons();
            },
            set: function (autoStack) {
                this.foundation_.setAutoStackButtons(autoStack);
            },
            enumerable: true,
            configurable: true
        });
        MDCDialog.attachTo = function (root) {
            return new MDCDialog(root);
        };
        MDCDialog.prototype.initialize = function (focusTrapFactory) {
            var e_1, _a;
            var container = this.root_.querySelector(strings$2.CONTAINER_SELECTOR);
            if (!container) {
                throw new Error("Dialog component requires a " + strings$2.CONTAINER_SELECTOR + " container element");
            }
            this.container_ = container;
            this.content_ = this.root_.querySelector(strings$2.CONTENT_SELECTOR);
            this.buttons_ = [].slice.call(this.root_.querySelectorAll(strings$2.BUTTON_SELECTOR));
            this.defaultButton_ = this.root_.querySelector("[" + strings$2.BUTTON_DEFAULT_ATTRIBUTE + "]");
            this.focusTrapFactory_ = focusTrapFactory;
            this.buttonRipples_ = [];
            try {
                for (var _b = __values(this.buttons_), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var buttonEl = _c.value;
                    this.buttonRipples_.push(new MDCRipple(buttonEl));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        MDCDialog.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.focusTrap_ = createFocusTrapInstance(this.container_, this.focusTrapFactory_, this.getInitialFocusEl_() || undefined);
            this.handleClick_ = this.foundation_.handleClick.bind(this.foundation_);
            this.handleKeydown_ = this.foundation_.handleKeydown.bind(this.foundation_);
            this.handleDocumentKeydown_ = this.foundation_.handleDocumentKeydown.bind(this.foundation_);
            this.handleLayout_ = this.layout.bind(this);
            var LAYOUT_EVENTS = ['resize', 'orientationchange'];
            this.handleOpening_ = function () {
                LAYOUT_EVENTS.forEach(function (evtType) { return window.addEventListener(evtType, _this.handleLayout_); });
                document.addEventListener('keydown', _this.handleDocumentKeydown_);
            };
            this.handleClosing_ = function () {
                LAYOUT_EVENTS.forEach(function (evtType) { return window.removeEventListener(evtType, _this.handleLayout_); });
                document.removeEventListener('keydown', _this.handleDocumentKeydown_);
            };
            this.listen('click', this.handleClick_);
            this.listen('keydown', this.handleKeydown_);
            this.listen(strings$2.OPENING_EVENT, this.handleOpening_);
            this.listen(strings$2.CLOSING_EVENT, this.handleClosing_);
        };
        MDCDialog.prototype.destroy = function () {
            this.unlisten('click', this.handleClick_);
            this.unlisten('keydown', this.handleKeydown_);
            this.unlisten(strings$2.OPENING_EVENT, this.handleOpening_);
            this.unlisten(strings$2.CLOSING_EVENT, this.handleClosing_);
            this.handleClosing_();
            this.buttonRipples_.forEach(function (ripple) { return ripple.destroy(); });
            _super.prototype.destroy.call(this);
        };
        MDCDialog.prototype.layout = function () {
            this.foundation_.layout();
        };
        MDCDialog.prototype.open = function () {
            this.foundation_.open();
        };
        MDCDialog.prototype.close = function (action) {
            if (action === void 0) { action = ''; }
            this.foundation_.close(action);
        };
        MDCDialog.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addBodyClass: function (className) { return document.body.classList.add(className); },
                addClass: function (className) { return _this.root_.classList.add(className); },
                areButtonsStacked: function () { return areTopsMisaligned(_this.buttons_); },
                clickDefaultButton: function () { return _this.defaultButton_ && _this.defaultButton_.click(); },
                eventTargetMatches: function (target, selector) { return target ? matches$1(target, selector) : false; },
                getActionFromEvent: function (evt) {
                    if (!evt.target) {
                        return '';
                    }
                    var element = closest(evt.target, "[" + strings$2.ACTION_ATTRIBUTE + "]");
                    return element && element.getAttribute(strings$2.ACTION_ATTRIBUTE);
                },
                getInitialFocusEl: function () { return _this.getInitialFocusEl_(); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                isContentScrollable: function () { return isScrollable(_this.content_); },
                notifyClosed: function (action) { return _this.emit(strings$2.CLOSED_EVENT, action ? { action: action } : {}); },
                notifyClosing: function (action) { return _this.emit(strings$2.CLOSING_EVENT, action ? { action: action } : {}); },
                notifyOpened: function () { return _this.emit(strings$2.OPENED_EVENT, {}); },
                notifyOpening: function () { return _this.emit(strings$2.OPENING_EVENT, {}); },
                releaseFocus: function () { return _this.focusTrap_.deactivate(); },
                removeBodyClass: function (className) { return document.body.classList.remove(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                reverseButtons: function () {
                    _this.buttons_.reverse();
                    _this.buttons_.forEach(function (button) {
                        button.parentElement.appendChild(button);
                    });
                },
                trapFocus: function () { return _this.focusTrap_.activate(); },
            };
            return new MDCDialogFoundation(adapter);
        };
        MDCDialog.prototype.getInitialFocusEl_ = function () {
            return document.querySelector("[" + strings$2.INITIAL_FOCUS_ATTRIBUTE + "]");
        };
        return MDCDialog;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    function forwardEventsBuilder(component, additionalEvents = []) {
      const events = [
        'focus', 'blur',
        'fullscreenchange', 'fullscreenerror', 'scroll',
        'cut', 'copy', 'paste',
        'keydown', 'keypress', 'keyup',
        'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel',
        'drag', 'dragend', 'dragenter', 'dragstart', 'dragleave', 'dragover', 'drop',
        'touchcancel', 'touchend', 'touchmove', 'touchstart',
        'pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerleave', 'gotpointercapture', 'lostpointercapture',
        ...additionalEvents
      ];

      function forward(e) {
        bubble(component, e);
      }

      return node => {
        const destructors = [];

        for (let i = 0; i < events.length; i++) {
          destructors.push(listen(node, events[i], forward));
        }

        return {
          destroy: () => {
            for (let i = 0; i < destructors.length; i++) {
              destructors[i]();
            }
          }
        }
      };
    }

    function exclude(obj, keys) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const cashIndex = name.indexOf('$');
        if (cashIndex !== -1 && keys.indexOf(name.substring(0, cashIndex + 1)) !== -1) {
          continue;
        }
        if (keys.indexOf(name) !== -1) {
          continue;
        }
        newObj[name] = obj[name];
      }

      return newObj;
    }

    function useActions(node, actions) {
      let objects = [];

      if (actions) {
        for (let i = 0; i < actions.length; i++) {
          const isArray = Array.isArray(actions[i]);
          const action = isArray ? actions[i][0] : actions[i];
          if (isArray && actions[i].length > 1) {
            objects.push(action(node, actions[i][1]));
          } else {
            objects.push(action(node));
          }
        }
      }

      return {
        update(actions) {
          if ((actions && actions.length || 0) != objects.length) {
            throw new Error('You must not change the length of an actions array.');
          }

          if (actions) {
            for (let i = 0; i < actions.length; i++) {
              if (objects[i] && 'update' in objects[i]) {
                const isArray = Array.isArray(actions[i]);
                if (isArray && actions[i].length > 1) {
                  objects[i].update(actions[i][1]);
                } else {
                  objects[i].update();
                }
              }
            }
          }
        },

        destroy() {
          for (let i = 0; i < objects.length; i++) {
            if (objects[i] && 'destroy' in objects[i]) {
              objects[i].destroy();
            }
          }
        }
      }
    }

    /* node_modules\@smui\dialog\Dialog.svelte generated by Svelte v3.20.1 */
    const file = "node_modules\\@smui\\dialog\\Dialog.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let t;
    	let div2;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);

    	let div3_levels = [
    		{
    			class: "mdc-dialog " + /*className*/ ctx[1]
    		},
    		{ role: "alertdialog" },
    		{ "aria-modal": "true" },
    		exclude(/*$$props*/ ctx[5], ["use", "class"])
    	];

    	let div3_data = {};

    	for (let i = 0; i < div3_levels.length; i += 1) {
    		div3_data = assign(div3_data, div3_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "mdc-dialog__surface");
    			add_location(div0, file, 11, 4, 273);
    			attr_dev(div1, "class", "mdc-dialog__container");
    			add_location(div1, file, 10, 2, 233);
    			attr_dev(div2, "class", "mdc-dialog__scrim");
    			add_location(div2, file, 15, 2, 349);
    			set_attributes(div3, div3_data);
    			add_location(div3, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			append_dev(div3, t);
    			append_dev(div3, div2);
    			/*div3_binding*/ ctx[20](div3);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div3, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[3].call(null, div3)),
    				listen_dev(div3, "MDCDialog:opened", /*handleDialogOpened*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 262144) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[18], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null));
    				}
    			}

    			set_attributes(div3, get_spread_update(div3_levels, [
    				dirty & /*className*/ 2 && {
    					class: "mdc-dialog " + /*className*/ ctx[1]
    				},
    				{ role: "alertdialog" },
    				{ "aria-modal": "true" },
    				dirty & /*exclude, $$props*/ 32 && exclude(/*$$props*/ ctx[5], ["use", "class"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (default_slot) default_slot.d(detaching);
    			/*div3_binding*/ ctx[20](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, [
    		"MDCDialog:opening",
    		"MDCDialog:opened",
    		"MDCDialog:closing",
    		"MDCDialog:closed"
    	]);

    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { escapeKeyAction = "close" } = $$props;
    	let { scrimClickAction = "close" } = $$props;
    	let { autoStackButtons = true } = $$props;
    	let element;
    	let dialog;
    	let addLayoutListener = getContext("SMUI:addLayoutListener");
    	let removeLayoutListener;
    	let layoutListeners = [];

    	let addLayoutListenerFn = listener => {
    		layoutListeners.push(listener);

    		return () => {
    			const idx = layoutListeners.indexOf(listener);

    			if (idx >= 0) {
    				layoutListeners.splice(idx, 1);
    			}
    		};
    	};

    	setContext("SMUI:addLayoutListener", addLayoutListenerFn);

    	if (addLayoutListener) {
    		removeLayoutListener = addLayoutListener(layout);
    	}

    	onMount(() => {
    		$$invalidate(13, dialog = new MDCDialog(element));
    	});

    	onDestroy(() => {
    		dialog && dialog.destroy();

    		if (removeLayoutListener) {
    			removeLayoutListener();
    		}
    	});

    	function handleDialogOpened() {
    		layoutListeners.forEach(listener => listener());
    	}

    	function open(...args) {
    		return dialog.open(...args);
    	}

    	function close(...args) {
    		return dialog.close(...args);
    	}

    	function isOpen() {
    		return dialog.isOpen;
    	}

    	function layout(...args) {
    		return dialog.layout(...args);
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dialog", $$slots, ['default']);

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("escapeKeyAction" in $$new_props) $$invalidate(6, escapeKeyAction = $$new_props.escapeKeyAction);
    		if ("scrimClickAction" in $$new_props) $$invalidate(7, scrimClickAction = $$new_props.scrimClickAction);
    		if ("autoStackButtons" in $$new_props) $$invalidate(8, autoStackButtons = $$new_props.autoStackButtons);
    		if ("$$scope" in $$new_props) $$invalidate(18, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		MDCDialog,
    		onMount,
    		onDestroy,
    		getContext,
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		escapeKeyAction,
    		scrimClickAction,
    		autoStackButtons,
    		element,
    		dialog,
    		addLayoutListener,
    		removeLayoutListener,
    		layoutListeners,
    		addLayoutListenerFn,
    		handleDialogOpened,
    		open,
    		close,
    		isOpen,
    		layout
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("escapeKeyAction" in $$props) $$invalidate(6, escapeKeyAction = $$new_props.escapeKeyAction);
    		if ("scrimClickAction" in $$props) $$invalidate(7, scrimClickAction = $$new_props.scrimClickAction);
    		if ("autoStackButtons" in $$props) $$invalidate(8, autoStackButtons = $$new_props.autoStackButtons);
    		if ("element" in $$props) $$invalidate(2, element = $$new_props.element);
    		if ("dialog" in $$props) $$invalidate(13, dialog = $$new_props.dialog);
    		if ("addLayoutListener" in $$props) addLayoutListener = $$new_props.addLayoutListener;
    		if ("removeLayoutListener" in $$props) removeLayoutListener = $$new_props.removeLayoutListener;
    		if ("layoutListeners" in $$props) layoutListeners = $$new_props.layoutListeners;
    		if ("addLayoutListenerFn" in $$props) addLayoutListenerFn = $$new_props.addLayoutListenerFn;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*dialog, escapeKeyAction*/ 8256) {
    			 dialog && $$invalidate(13, dialog.escapeKeyAction = escapeKeyAction, dialog);
    		}

    		if ($$self.$$.dirty & /*dialog, scrimClickAction*/ 8320) {
    			 dialog && $$invalidate(13, dialog.scrimClickAction = scrimClickAction, dialog);
    		}

    		if ($$self.$$.dirty & /*dialog, autoStackButtons*/ 8448) {
    			 dialog && $$invalidate(13, dialog.autoStackButtons = autoStackButtons, dialog);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		element,
    		forwardEvents,
    		handleDialogOpened,
    		$$props,
    		escapeKeyAction,
    		scrimClickAction,
    		autoStackButtons,
    		open,
    		close,
    		isOpen,
    		layout,
    		dialog,
    		removeLayoutListener,
    		addLayoutListener,
    		layoutListeners,
    		addLayoutListenerFn,
    		$$scope,
    		$$slots,
    		div3_binding
    	];
    }

    class Dialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			use: 0,
    			class: 1,
    			escapeKeyAction: 6,
    			scrimClickAction: 7,
    			autoStackButtons: 8,
    			open: 9,
    			close: 10,
    			isOpen: 11,
    			layout: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dialog",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get use() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get escapeKeyAction() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set escapeKeyAction(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrimClickAction() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrimClickAction(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoStackButtons() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoStackButtons(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		return this.$$.ctx[9];
    	}

    	set open(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[10];
    	}

    	set close(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpen() {
    		return this.$$.ctx[11];
    	}

    	set isOpen(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		return this.$$.ctx[12];
    	}

    	set layout(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\ClassAdder.svelte generated by Svelte v3.20.1 */

    // (1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class="{smuiClass} {className}"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >
    function create_default_slot(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[9], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class=\\\"{smuiClass} {className}\\\"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{
    			use: [/*forwardEvents*/ ctx[4], .../*use*/ ctx[0]]
    		},
    		{
    			class: "" + (/*smuiClass*/ ctx[3] + " " + /*className*/ ctx[1])
    		},
    		exclude(/*$$props*/ ctx[5], ["use", "class", "component", "forwardEvents"])
    	];

    	var switch_value = /*component*/ ctx[2];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot] },
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = (dirty & /*forwardEvents, use, smuiClass, className, exclude, $$props*/ 59)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*forwardEvents, use*/ 17 && {
    						use: [/*forwardEvents*/ ctx[4], .../*use*/ ctx[0]]
    					},
    					dirty & /*smuiClass, className*/ 10 && {
    						class: "" + (/*smuiClass*/ ctx[3] + " " + /*className*/ ctx[1])
    					},
    					dirty & /*exclude, $$props*/ 32 && get_spread_object(exclude(/*$$props*/ ctx[5], ["use", "class", "component", "forwardEvents"]))
    				])
    			: {};

    			if (dirty & /*$$scope*/ 512) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*component*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const internals = {
    	component: null,
    	smuiClass: null,
    	contexts: {}
    };

    function instance$1($$self, $$props, $$invalidate) {
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { component = internals.component } = $$props;
    	let { forwardEvents: smuiForwardEvents = [] } = $$props;
    	const smuiClass = internals.class;
    	const contexts = internals.contexts;
    	const forwardEvents = forwardEventsBuilder(current_component, smuiForwardEvents);

    	for (let context in contexts) {
    		if (contexts.hasOwnProperty(context)) {
    			setContext(context, contexts[context]);
    		}
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ClassAdder", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("component" in $$new_props) $$invalidate(2, component = $$new_props.component);
    		if ("forwardEvents" in $$new_props) $$invalidate(6, smuiForwardEvents = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		internals,
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		use,
    		className,
    		component,
    		smuiForwardEvents,
    		smuiClass,
    		contexts,
    		forwardEvents
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("component" in $$props) $$invalidate(2, component = $$new_props.component);
    		if ("smuiForwardEvents" in $$props) $$invalidate(6, smuiForwardEvents = $$new_props.smuiForwardEvents);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		component,
    		smuiClass,
    		forwardEvents,
    		$$props,
    		smuiForwardEvents,
    		contexts,
    		$$slots,
    		$$scope
    	];
    }

    class ClassAdder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			use: 0,
    			class: 1,
    			component: 2,
    			forwardEvents: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClassAdder",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get use() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function classAdderBuilder(props) {
      function Component(...args) {
        Object.assign(internals, props);
        return new ClassAdder(...args);
      }

      Component.prototype = ClassAdder;

      // SSR support
      if (ClassAdder.$$render) {
        Component.$$render = (...args) => Object.assign(internals, props) && ClassAdder.$$render(...args);
      }
      if (ClassAdder.render) {
        Component.render = (...args) => Object.assign(internals, props) && ClassAdder.render(...args);
      }

      return Component;
    }

    /* node_modules\@smui\common\H2.svelte generated by Svelte v3.20.1 */
    const file$1 = "node_modules\\@smui\\common\\H2.svelte";

    function create_fragment$2(ctx) {
    	let h2;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let h2_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let h2_data = {};

    	for (let i = 0; i < h2_levels.length; i += 1) {
    		h2_data = assign(h2_data, h2_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			if (default_slot) default_slot.c();
    			set_attributes(h2, h2_data);
    			add_location(h2, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, h2, anchor);

    			if (default_slot) {
    				default_slot.m(h2, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, h2, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, h2))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    				}
    			}

    			set_attributes(h2, get_spread_update(h2_levels, [dirty & /*exclude, $$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("H2", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, $$slots];
    }

    class H2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "H2",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get use() {
    		throw new Error("<H2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<H2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Title = classAdderBuilder({
      class: 'mdc-dialog__title',
      component: H2,
      contexts: {}
    });

    /* node_modules\@smui\common\Div.svelte generated by Svelte v3.20.1 */
    const file$2 = "node_modules\\@smui\\common\\Div.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let div_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, div))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    				}
    			}

    			set_attributes(div, get_spread_update(div_levels, [dirty & /*exclude, $$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Div", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, $$slots];
    }

    class Div extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Div",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get use() {
    		throw new Error("<Div>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Div>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Content = classAdderBuilder({
      class: 'mdc-dialog__content',
      component: Div,
      contexts: {}
    });

    /* node_modules\@smui\common\Footer.svelte generated by Svelte v3.20.1 */
    const file$3 = "node_modules\\@smui\\common\\Footer.svelte";

    function create_fragment$4(ctx) {
    	let footer;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let footer_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let footer_data = {};

    	for (let i = 0; i < footer_levels.length; i += 1) {
    		footer_data = assign(footer_data, footer_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			if (default_slot) default_slot.c();
    			set_attributes(footer, footer_data);
    			add_location(footer, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, footer, anchor);

    			if (default_slot) {
    				default_slot.m(footer, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, footer, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, footer))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    				}
    			}

    			set_attributes(footer, get_spread_update(footer_levels, [dirty & /*exclude, $$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, $$slots];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get use() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Actions = classAdderBuilder({
      class: 'mdc-dialog__actions',
      component: Footer,
      contexts: {
        'SMUI:button:context': 'dialog:action'
      }
    });

    function InitialFocus(node) {
      node.setAttribute('data-mdc-dialog-initial-focus', '');

      return {
        destroy() {
          node.removeAttribute('data-mdc-dialog-initial-focus');
        }
      }
    }

    const notificationStore = writable("");
    const questionStore = writable("");

    function notify(msg) {
      notificationStore.set({ msg, time: +new Date() });
    }

    function ask(msg) {
      return new Promise((resolve, reject) => {
        questionStore.set({ msg, time: +new Date(), resolve, reject });
      });
    }

    function getDisplayTime(insertTime) {
      var diff = new Date().getTime() - insertTime;
      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor(diff / (1000 * 60 * 60));
      var formatter = new Intl.RelativeTimeFormat(navigator.language, {
        style: "narrow"
      });
      if (days < 3) {
        return formatter.format(-hours, "hours");
      } else if (days < 30) {
        return formatter.format(-days, "days");
      } else {
        const options = {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        };
        return new Date(insertTime).toLocaleDateString("de-DE", options);
      }
    }

    /* node_modules\@smui\Card\Card.svelte generated by Svelte v3.20.1 */
    const file$4 = "node_modules\\@smui\\Card\\Card.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	let div_levels = [
    		{
    			class: "\n    mdc-card\n    " + /*className*/ ctx[1] + "\n    " + (/*variant*/ ctx[2] === "outlined"
    			? "mdc-card--outlined"
    			: "") + "\n    " + (/*padded*/ ctx[3] ? "smui-card--padded" : "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[5], ["use", "class", "variant", "padded"])
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[4].call(null, div))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    				}
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				dirty & /*className, variant, padded*/ 14 && {
    					class: "\n    mdc-card\n    " + /*className*/ ctx[1] + "\n    " + (/*variant*/ ctx[2] === "outlined"
    					? "mdc-card--outlined"
    					: "") + "\n    " + (/*padded*/ ctx[3] ? "smui-card--padded" : "") + "\n  "
    				},
    				dirty & /*exclude, $$props*/ 32 && exclude(/*$$props*/ ctx[5], ["use", "class", "variant", "padded"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { variant = "raised" } = $$props;
    	let { padded = false } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("variant" in $$new_props) $$invalidate(2, variant = $$new_props.variant);
    		if ("padded" in $$new_props) $$invalidate(3, padded = $$new_props.padded);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		variant,
    		padded
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("variant" in $$props) $$invalidate(2, variant = $$new_props.variant);
    		if ("padded" in $$props) $$invalidate(3, padded = $$new_props.padded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, className, variant, padded, forwardEvents, $$props, $$scope, $$slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { use: 0, class: 1, variant: 2, padded: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get use() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padded() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padded(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    classAdderBuilder({
      class: 'smui-card__content',
      component: Div,
      contexts: {}
    });

    function Ripple(node, props = {ripple: false, unbounded: false, color: null, classForward: () => {}}) {
      let instance = null;
      let addLayoutListener = getContext('SMUI:addLayoutListener');
      let removeLayoutListener;
      let classList = [];

      function addClass(className) {
        const idx = classList.indexOf(className);
        if (idx === -1) {
          node.classList.add(className);
          classList.push(className);
          if (props.classForward) {
            props.classForward(classList);
            console.log('addClass', className, classList);
          }
        }
      }

      function removeClass(className) {
        const idx = classList.indexOf(className);
        if (idx !== -1) {
          node.classList.remove(className);
          classList.splice(idx, 1);
          if (props.classForward) {
            props.classForward(classList);
            console.log('removeClass', className, classList);
          }
        }
      }

      function handleProps() {
        if (props.ripple && !instance) {
          // Override the Ripple component's adapter, so that we can forward classes
          // to Svelte components that overwrite Ripple's classes.
          const _createAdapter = MDCRipple.createAdapter;
          MDCRipple.createAdapter = function(...args) {
            const adapter = _createAdapter.apply(this, args);
            adapter.addClass = function(className) {
              return addClass(className);
            };
            adapter.removeClass = function(className) {
              return removeClass(className);
            };
            return adapter;
          };
          instance = new MDCRipple(node);
          MDCRipple.createAdapter = _createAdapter;
        } else if (instance && !props.ripple) {
          instance.destroy();
          instance = null;
        }
        if (props.ripple) {
          instance.unbounded = !!props.unbounded;
          switch (props.color) {
            case 'surface':
              addClass('mdc-ripple-surface');
              removeClass('mdc-ripple-surface--primary');
              removeClass('mdc-ripple-surface--accent');
              return;
            case 'primary':
              addClass('mdc-ripple-surface');
              addClass('mdc-ripple-surface--primary');
              removeClass('mdc-ripple-surface--accent');
              return;
            case 'secondary':
              addClass('mdc-ripple-surface');
              removeClass('mdc-ripple-surface--primary');
              addClass('mdc-ripple-surface--accent');
              return;
          }
        }
        removeClass('mdc-ripple-surface');
        removeClass('mdc-ripple-surface--primary');
        removeClass('mdc-ripple-surface--accent');
      }

      handleProps();

      if (addLayoutListener) {
        removeLayoutListener = addLayoutListener(layout);
      }

      function layout() {
        if (instance) {
          instance.layout();
        }
      }

      return {
        update(newProps = {ripple: false, unbounded: false, color: null, classForward: []}) {
          props = newProps;
          handleProps();
        },

        destroy() {
          if (instance) {
            instance.destroy();
            instance = null;
            removeClass('mdc-ripple-surface');
            removeClass('mdc-ripple-surface--primary');
            removeClass('mdc-ripple-surface--accent');
          }

          if (removeLayoutListener) {
            removeLayoutListener();
          }
        }
      }
    }

    classAdderBuilder({
      class: 'mdc-card__media-content',
      component: Div,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-card__action-buttons',
      component: Div,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-card__action-icons',
      component: Div,
      contexts: {}
    });

    /* node_modules\@smui\common\A.svelte generated by Svelte v3.20.1 */
    const file$5 = "node_modules\\@smui\\common\\A.svelte";

    function create_fragment$6(ctx) {
    	let a;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let a_levels = [{ href: /*href*/ ctx[1] }, exclude(/*$$props*/ ctx[3], ["use", "href"])];
    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, a, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[2].call(null, a))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[4], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null));
    				}
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*href*/ 2 && { href: /*href*/ ctx[1] },
    				dirty & /*exclude, $$props*/ 8 && exclude(/*$$props*/ ctx[3], ["use", "href"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { href = "javascript:void(0);" } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("A", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("href" in $$new_props) $$invalidate(1, href = $$new_props.href);
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		href
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("href" in $$props) $$invalidate(1, href = $$new_props.href);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, href, forwardEvents, $$props, $$scope, $$slots];
    }

    class A extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { use: 0, href: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "A",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get use() {
    		throw new Error("<A>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<A>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<A>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<A>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\Button.svelte generated by Svelte v3.20.1 */
    const file$6 = "node_modules\\@smui\\common\\Button.svelte";

    function create_fragment$7(ctx) {
    	let button;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let button_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			set_attributes(button, button_data);
    			add_location(button, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, button, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, button))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    				}
    			}

    			set_attributes(button, get_spread_update(button_levels, [dirty & /*exclude, $$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, $$slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get use() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\button\Button.svelte generated by Svelte v3.20.1 */

    // (1:0) <svelte:component   this={component}   use={[[Ripple, {ripple, unbounded: false, classForward: classes => rippleClasses = classes}], forwardEvents, ...use]}   class="     mdc-button     {className}     {rippleClasses.join(' ')}     {variant === 'raised' ? 'mdc-button--raised' : ''}     {variant === 'unelevated' ? 'mdc-button--unelevated' : ''}     {variant === 'outlined' ? 'mdc-button--outlined' : ''}     {dense ? 'mdc-button--dense' : ''}     {color === 'secondary' ? 'smui-button--color-secondary' : ''}     {context === 'card:action' ? 'mdc-card__action' : ''}     {context === 'card:action' ? 'mdc-card__action--button' : ''}     {context === 'dialog:action' ? 'mdc-dialog__button' : ''}     {context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : ''}     {context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : ''}     {context === 'snackbar' ? 'mdc-snackbar__action' : ''}   "   {...actionProp}   {...defaultProp}   {...exclude($$props, ['use', 'class', 'ripple', 'color', 'variant', 'dense', ...dialogExcludes])} >
    function create_default_slot$1(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 524288) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[19], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[19], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(1:0) <svelte:component   this={component}   use={[[Ripple, {ripple, unbounded: false, classForward: classes => rippleClasses = classes}], forwardEvents, ...use]}   class=\\\"     mdc-button     {className}     {rippleClasses.join(' ')}     {variant === 'raised' ? 'mdc-button--raised' : ''}     {variant === 'unelevated' ? 'mdc-button--unelevated' : ''}     {variant === 'outlined' ? 'mdc-button--outlined' : ''}     {dense ? 'mdc-button--dense' : ''}     {color === 'secondary' ? 'smui-button--color-secondary' : ''}     {context === 'card:action' ? 'mdc-card__action' : ''}     {context === 'card:action' ? 'mdc-card__action--button' : ''}     {context === 'dialog:action' ? 'mdc-dialog__button' : ''}     {context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : ''}     {context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : ''}     {context === 'snackbar' ? 'mdc-snackbar__action' : ''}   \\\"   {...actionProp}   {...defaultProp}   {...exclude($$props, ['use', 'class', 'ripple', 'color', 'variant', 'dense', ...dialogExcludes])} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{
    			use: [
    				[
    					Ripple,
    					{
    						ripple: /*ripple*/ ctx[2],
    						unbounded: false,
    						classForward: /*func*/ ctx[18]
    					}
    				],
    				/*forwardEvents*/ ctx[11],
    				.../*use*/ ctx[0]
    			]
    		},
    		{
    			class: "\n    mdc-button\n    " + /*className*/ ctx[1] + "\n    " + /*rippleClasses*/ ctx[7].join(" ") + "\n    " + (/*variant*/ ctx[4] === "raised"
    			? "mdc-button--raised"
    			: "") + "\n    " + (/*variant*/ ctx[4] === "unelevated"
    			? "mdc-button--unelevated"
    			: "") + "\n    " + (/*variant*/ ctx[4] === "outlined"
    			? "mdc-button--outlined"
    			: "") + "\n    " + (/*dense*/ ctx[5] ? "mdc-button--dense" : "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    			? "smui-button--color-secondary"
    			: "") + "\n    " + (/*context*/ ctx[12] === "card:action"
    			? "mdc-card__action"
    			: "") + "\n    " + (/*context*/ ctx[12] === "card:action"
    			? "mdc-card__action--button"
    			: "") + "\n    " + (/*context*/ ctx[12] === "dialog:action"
    			? "mdc-dialog__button"
    			: "") + "\n    " + (/*context*/ ctx[12] === "top-app-bar:navigation"
    			? "mdc-top-app-bar__navigation-icon"
    			: "") + "\n    " + (/*context*/ ctx[12] === "top-app-bar:action"
    			? "mdc-top-app-bar__action-item"
    			: "") + "\n    " + (/*context*/ ctx[12] === "snackbar"
    			? "mdc-snackbar__action"
    			: "") + "\n  "
    		},
    		/*actionProp*/ ctx[9],
    		/*defaultProp*/ ctx[10],
    		exclude(/*$$props*/ ctx[13], [
    			"use",
    			"class",
    			"ripple",
    			"color",
    			"variant",
    			"dense",
    			.../*dialogExcludes*/ ctx[8]
    		])
    	];

    	var switch_value = /*component*/ ctx[6];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot$1] },
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = (dirty & /*Ripple, ripple, rippleClasses, forwardEvents, use, className, variant, dense, color, context, actionProp, defaultProp, exclude, $$props, dialogExcludes*/ 16319)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*Ripple, ripple, rippleClasses, forwardEvents, use*/ 2181 && {
    						use: [
    							[
    								Ripple,
    								{
    									ripple: /*ripple*/ ctx[2],
    									unbounded: false,
    									classForward: /*func*/ ctx[18]
    								}
    							],
    							/*forwardEvents*/ ctx[11],
    							.../*use*/ ctx[0]
    						]
    					},
    					dirty & /*className, rippleClasses, variant, dense, color, context*/ 4282 && {
    						class: "\n    mdc-button\n    " + /*className*/ ctx[1] + "\n    " + /*rippleClasses*/ ctx[7].join(" ") + "\n    " + (/*variant*/ ctx[4] === "raised"
    						? "mdc-button--raised"
    						: "") + "\n    " + (/*variant*/ ctx[4] === "unelevated"
    						? "mdc-button--unelevated"
    						: "") + "\n    " + (/*variant*/ ctx[4] === "outlined"
    						? "mdc-button--outlined"
    						: "") + "\n    " + (/*dense*/ ctx[5] ? "mdc-button--dense" : "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    						? "smui-button--color-secondary"
    						: "") + "\n    " + (/*context*/ ctx[12] === "card:action"
    						? "mdc-card__action"
    						: "") + "\n    " + (/*context*/ ctx[12] === "card:action"
    						? "mdc-card__action--button"
    						: "") + "\n    " + (/*context*/ ctx[12] === "dialog:action"
    						? "mdc-dialog__button"
    						: "") + "\n    " + (/*context*/ ctx[12] === "top-app-bar:navigation"
    						? "mdc-top-app-bar__navigation-icon"
    						: "") + "\n    " + (/*context*/ ctx[12] === "top-app-bar:action"
    						? "mdc-top-app-bar__action-item"
    						: "") + "\n    " + (/*context*/ ctx[12] === "snackbar"
    						? "mdc-snackbar__action"
    						: "") + "\n  "
    					},
    					dirty & /*actionProp*/ 512 && get_spread_object(/*actionProp*/ ctx[9]),
    					dirty & /*defaultProp*/ 1024 && get_spread_object(/*defaultProp*/ ctx[10]),
    					dirty & /*exclude, $$props, dialogExcludes*/ 8448 && get_spread_object(exclude(/*$$props*/ ctx[13], [
    						"use",
    						"class",
    						"ripple",
    						"color",
    						"variant",
    						"dense",
    						.../*dialogExcludes*/ ctx[8]
    					]))
    				])
    			: {};

    			if (dirty & /*$$scope*/ 524288) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*component*/ ctx[6])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { ripple = true } = $$props;
    	let { color = "primary" } = $$props;
    	let { variant = "text" } = $$props;
    	let { dense = false } = $$props;
    	let { href = null } = $$props;
    	let { action = "close" } = $$props;
    	let { default: defaultAction = false } = $$props;
    	let { component = href == null ? Button : A } = $$props;
    	let context = getContext("SMUI:button:context");
    	let rippleClasses = [];
    	setContext("SMUI:label:context", "button");
    	setContext("SMUI:icon:context", "button");
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, ['default']);
    	const func = classes => $$invalidate(7, rippleClasses = classes);

    	$$self.$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("ripple" in $$new_props) $$invalidate(2, ripple = $$new_props.ripple);
    		if ("color" in $$new_props) $$invalidate(3, color = $$new_props.color);
    		if ("variant" in $$new_props) $$invalidate(4, variant = $$new_props.variant);
    		if ("dense" in $$new_props) $$invalidate(5, dense = $$new_props.dense);
    		if ("href" in $$new_props) $$invalidate(14, href = $$new_props.href);
    		if ("action" in $$new_props) $$invalidate(15, action = $$new_props.action);
    		if ("default" in $$new_props) $$invalidate(16, defaultAction = $$new_props.default);
    		if ("component" in $$new_props) $$invalidate(6, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(19, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		getContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		A,
    		Button,
    		Ripple,
    		forwardEvents,
    		use,
    		className,
    		ripple,
    		color,
    		variant,
    		dense,
    		href,
    		action,
    		defaultAction,
    		component,
    		context,
    		rippleClasses,
    		dialogExcludes,
    		actionProp,
    		defaultProp
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("ripple" in $$props) $$invalidate(2, ripple = $$new_props.ripple);
    		if ("color" in $$props) $$invalidate(3, color = $$new_props.color);
    		if ("variant" in $$props) $$invalidate(4, variant = $$new_props.variant);
    		if ("dense" in $$props) $$invalidate(5, dense = $$new_props.dense);
    		if ("href" in $$props) $$invalidate(14, href = $$new_props.href);
    		if ("action" in $$props) $$invalidate(15, action = $$new_props.action);
    		if ("defaultAction" in $$props) $$invalidate(16, defaultAction = $$new_props.defaultAction);
    		if ("component" in $$props) $$invalidate(6, component = $$new_props.component);
    		if ("context" in $$props) $$invalidate(12, context = $$new_props.context);
    		if ("rippleClasses" in $$props) $$invalidate(7, rippleClasses = $$new_props.rippleClasses);
    		if ("dialogExcludes" in $$props) $$invalidate(8, dialogExcludes = $$new_props.dialogExcludes);
    		if ("actionProp" in $$props) $$invalidate(9, actionProp = $$new_props.actionProp);
    		if ("defaultProp" in $$props) $$invalidate(10, defaultProp = $$new_props.defaultProp);
    	};

    	let dialogExcludes;
    	let actionProp;
    	let defaultProp;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*action*/ 32768) {
    			 $$invalidate(9, actionProp = context === "dialog:action" && action !== null
    			? { "data-mdc-dialog-action": action }
    			: {});
    		}

    		if ($$self.$$.dirty & /*defaultAction*/ 65536) {
    			 $$invalidate(10, defaultProp = context === "dialog:action" && defaultAction
    			? { "data-mdc-dialog-button-default": "" }
    			: {});
    		}
    	};

    	 $$invalidate(8, dialogExcludes = context === "dialog:action" ? ["action", "default"] : []);
    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		ripple,
    		color,
    		variant,
    		dense,
    		component,
    		rippleClasses,
    		dialogExcludes,
    		actionProp,
    		defaultProp,
    		forwardEvents,
    		context,
    		$$props,
    		href,
    		action,
    		defaultAction,
    		$$slots,
    		func,
    		$$scope
    	];
    }

    class Button_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			use: 0,
    			class: 1,
    			ripple: 2,
    			color: 3,
    			variant: 4,
    			dense: 5,
    			href: 14,
    			action: 15,
    			default: 16,
    			component: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button_1",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get use() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get action() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get default() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set default(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\Label.svelte generated by Svelte v3.20.1 */
    const file$7 = "node_modules\\@smui\\common\\Label.svelte";

    function create_fragment$9(ctx) {
    	let span;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	let span_levels = [
    		{
    			class: "\n    " + /*className*/ ctx[1] + "\n    " + (/*context*/ ctx[3] === "button"
    			? "mdc-button__label"
    			: "") + "\n    " + (/*context*/ ctx[3] === "fab" ? "mdc-fab__label" : "") + "\n    " + (/*context*/ ctx[3] === "chip" ? "mdc-chip__text" : "") + "\n    " + (/*context*/ ctx[3] === "tab"
    			? "mdc-tab__text-label"
    			: "") + "\n    " + (/*context*/ ctx[3] === "image-list"
    			? "mdc-image-list__label"
    			: "") + "\n    " + (/*context*/ ctx[3] === "snackbar"
    			? "mdc-snackbar__label"
    			: "") + "\n  "
    		},
    		/*context*/ ctx[3] === "snackbar"
    		? { role: "status", "aria-live": "polite" }
    		: {},
    		exclude(/*$$props*/ ctx[4], ["use", "class"])
    	];

    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span, span_data);
    			add_location(span, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, span, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[2].call(null, span))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    				}
    			}

    			set_attributes(span, get_spread_update(span_levels, [
    				dirty & /*className, context*/ 10 && {
    					class: "\n    " + /*className*/ ctx[1] + "\n    " + (/*context*/ ctx[3] === "button"
    					? "mdc-button__label"
    					: "") + "\n    " + (/*context*/ ctx[3] === "fab" ? "mdc-fab__label" : "") + "\n    " + (/*context*/ ctx[3] === "chip" ? "mdc-chip__text" : "") + "\n    " + (/*context*/ ctx[3] === "tab"
    					? "mdc-tab__text-label"
    					: "") + "\n    " + (/*context*/ ctx[3] === "image-list"
    					? "mdc-image-list__label"
    					: "") + "\n    " + (/*context*/ ctx[3] === "snackbar"
    					? "mdc-snackbar__label"
    					: "") + "\n  "
    				},
    				dirty & /*context*/ 8 && (/*context*/ ctx[3] === "snackbar"
    				? { role: "status", "aria-live": "polite" }
    				: {}),
    				dirty & /*exclude, $$props*/ 16 && exclude(/*$$props*/ ctx[4], ["use", "class"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	const context = getContext("SMUI:label:context");
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Label", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		context
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, className, forwardEvents, context, $$props, $$scope, $$slots];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { use: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get use() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\Icon.svelte generated by Svelte v3.20.1 */
    const file$8 = "node_modules\\@smui\\common\\Icon.svelte";

    function create_fragment$a(ctx) {
    	let i;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	let i_levels = [
    		{
    			class: "\n    " + /*className*/ ctx[1] + "\n    " + (/*context*/ ctx[7] === "button"
    			? "mdc-button__icon"
    			: "") + "\n    " + (/*context*/ ctx[7] === "fab" ? "mdc-fab__icon" : "") + "\n    " + (/*context*/ ctx[7] === "icon-button"
    			? "mdc-icon-button__icon"
    			: "") + "\n    " + (/*context*/ ctx[7] === "icon-button" && /*on*/ ctx[2]
    			? "mdc-icon-button__icon--on"
    			: "") + "\n    " + (/*context*/ ctx[7] === "chip" ? "mdc-chip__icon" : "") + "\n    " + (/*context*/ ctx[7] === "chip" && /*leading*/ ctx[3]
    			? "mdc-chip__icon--leading"
    			: "") + "\n    " + (/*context*/ ctx[7] === "chip" && /*leadingHidden*/ ctx[4]
    			? "mdc-chip__icon--leading-hidden"
    			: "") + "\n    " + (/*context*/ ctx[7] === "chip" && /*trailing*/ ctx[5]
    			? "mdc-chip__icon--trailing"
    			: "") + "\n    " + (/*context*/ ctx[7] === "tab" ? "mdc-tab__icon" : "") + "\n  "
    		},
    		{ "aria-hidden": "true" },
    		exclude(/*$$props*/ ctx[8], ["use", "class", "on", "leading", "leadingHidden", "trailing"])
    	];

    	let i_data = {};

    	for (let i = 0; i < i_levels.length; i += 1) {
    		i_data = assign(i_data, i_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			i = element("i");
    			if (default_slot) default_slot.c();
    			set_attributes(i, i_data);
    			add_location(i, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, i, anchor);

    			if (default_slot) {
    				default_slot.m(i, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, i, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[6].call(null, i))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[9], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null));
    				}
    			}

    			set_attributes(i, get_spread_update(i_levels, [
    				dirty & /*className, context, on, leading, leadingHidden, trailing*/ 190 && {
    					class: "\n    " + /*className*/ ctx[1] + "\n    " + (/*context*/ ctx[7] === "button"
    					? "mdc-button__icon"
    					: "") + "\n    " + (/*context*/ ctx[7] === "fab" ? "mdc-fab__icon" : "") + "\n    " + (/*context*/ ctx[7] === "icon-button"
    					? "mdc-icon-button__icon"
    					: "") + "\n    " + (/*context*/ ctx[7] === "icon-button" && /*on*/ ctx[2]
    					? "mdc-icon-button__icon--on"
    					: "") + "\n    " + (/*context*/ ctx[7] === "chip" ? "mdc-chip__icon" : "") + "\n    " + (/*context*/ ctx[7] === "chip" && /*leading*/ ctx[3]
    					? "mdc-chip__icon--leading"
    					: "") + "\n    " + (/*context*/ ctx[7] === "chip" && /*leadingHidden*/ ctx[4]
    					? "mdc-chip__icon--leading-hidden"
    					: "") + "\n    " + (/*context*/ ctx[7] === "chip" && /*trailing*/ ctx[5]
    					? "mdc-chip__icon--trailing"
    					: "") + "\n    " + (/*context*/ ctx[7] === "tab" ? "mdc-tab__icon" : "") + "\n  "
    				},
    				{ "aria-hidden": "true" },
    				dirty & /*exclude, $$props*/ 256 && exclude(/*$$props*/ ctx[8], ["use", "class", "on", "leading", "leadingHidden", "trailing"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { on = false } = $$props;
    	let { leading = false } = $$props;
    	let { leadingHidden = false } = $$props;
    	let { trailing = false } = $$props;
    	const context = getContext("SMUI:icon:context");
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Icon", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(8, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("on" in $$new_props) $$invalidate(2, on = $$new_props.on);
    		if ("leading" in $$new_props) $$invalidate(3, leading = $$new_props.leading);
    		if ("leadingHidden" in $$new_props) $$invalidate(4, leadingHidden = $$new_props.leadingHidden);
    		if ("trailing" in $$new_props) $$invalidate(5, trailing = $$new_props.trailing);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		on,
    		leading,
    		leadingHidden,
    		trailing,
    		context
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(8, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("on" in $$props) $$invalidate(2, on = $$new_props.on);
    		if ("leading" in $$props) $$invalidate(3, leading = $$new_props.leading);
    		if ("leadingHidden" in $$props) $$invalidate(4, leadingHidden = $$new_props.leadingHidden);
    		if ("trailing" in $$props) $$invalidate(5, trailing = $$new_props.trailing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		on,
    		leading,
    		leadingHidden,
    		trailing,
    		forwardEvents,
    		context,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			use: 0,
    			class: 1,
    			on: 2,
    			leading: 3,
    			leadingHidden: 4,
    			trailing: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get use() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get on() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set on(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get leading() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leading(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get leadingHidden() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leadingHidden(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get trailing() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trailing(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Fact.svelte generated by Svelte v3.20.1 */
    const file$9 = "src\\components\\Fact.svelte";

    // (28:4) <Card style="background-color: #ffff65;" padded>
    function create_default_slot_4(ctx) {
    	let t0_value = /*fact*/ ctx[0].fact + "";
    	let t0;
    	let t1;
    	let div;
    	let t2_value = getDisplayTime(/*fact*/ ctx[0].insertTime) + "";
    	let t2;
    	let t3;
    	let t4_value = /*fact*/ ctx[0].contributor + "";
    	let t4;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");
    			t2 = text(t2_value);
    			t3 = text(" | by ");
    			t4 = text(t4_value);
    			attr_dev(div, "class", "factSubtitle svelte-qdp5rg");
    			add_location(div, file$9, 29, 6, 975);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*fact*/ 1 && t0_value !== (t0_value = /*fact*/ ctx[0].fact + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*fact*/ 1 && t2_value !== (t2_value = getDisplayTime(/*fact*/ ctx[0].insertTime) + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*fact*/ 1 && t4_value !== (t4_value = /*fact*/ ctx[0].contributor + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(28:4) <Card style=\\\"background-color: #ffff65;\\\" padded>",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#if hasDeleteButton}
    function create_if_block_1(ctx) {
    	let current;

    	const button = new Button_1({
    			props: {
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*deleteFact*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(34:4) {#if hasDeleteButton}",
    		ctx
    	});

    	return block;
    }

    // (36:8) <Label>
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete fact");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(36:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (35:6) <Button on:click={deleteFact} variant="raised" class="formButton">
    function create_default_slot_2(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(35:6) <Button on:click={deleteFact} variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (39:4) {#if hasAcceptButton}
    function create_if_block(ctx) {
    	let current;

    	const button = new Button_1({
    			props: {
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*acceptFact*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(39:4) {#if hasAcceptButton}",
    		ctx
    	});

    	return block;
    }

    // (41:8) <Label>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Accept fact");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(41:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (40:6) <Button on:click={acceptFact} variant="raised" class="formButton">
    function create_default_slot$2(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(40:6) <Button on:click={acceptFact} variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let current;

    	const card = new Card({
    			props: {
    				style: "background-color: #ffff65;",
    				padded: true,
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block0 = /*hasDeleteButton*/ ctx[1] && create_if_block_1(ctx);
    	let if_block1 = /*hasAcceptButton*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(card.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "card-container short factContainer svelte-qdp5rg");
    			add_location(div0, file$9, 26, 2, 849);
    			set_style(div1, "display", "flex");
    			set_style(div1, "flex-wrap", "wrap");
    			set_style(div1, "width", "100%");
    			add_location(div1, file$9, 25, 0, 791);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(card, div0, null);
    			append_dev(div0, t0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block1) if_block1.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, fact*/ 65) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);

    			if (/*hasDeleteButton*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*hasAcceptButton*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(card);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { fact } = $$props;
    	let { hasDeleteButton } = $$props;
    	let { hasAcceptButton } = $$props;
    	const dispatch = createEventDispatcher();

    	function deleteFact() {
    		e.stopPropagation();
    		dispatch("delete", { fact });
    	}

    	function acceptFact() {
    		e.stopPropagation();
    		dispatch("accept", { fact });
    	}

    	const writable_props = ["fact", "hasDeleteButton", "hasAcceptButton"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fact> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Fact", $$slots, []);

    	$$self.$set = $$props => {
    		if ("fact" in $$props) $$invalidate(0, fact = $$props.fact);
    		if ("hasDeleteButton" in $$props) $$invalidate(1, hasDeleteButton = $$props.hasDeleteButton);
    		if ("hasAcceptButton" in $$props) $$invalidate(2, hasAcceptButton = $$props.hasAcceptButton);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getDisplayTime,
    		Card,
    		Button: Button_1,
    		Label,
    		fact,
    		hasDeleteButton,
    		hasAcceptButton,
    		dispatch,
    		deleteFact,
    		acceptFact
    	});

    	$$self.$inject_state = $$props => {
    		if ("fact" in $$props) $$invalidate(0, fact = $$props.fact);
    		if ("hasDeleteButton" in $$props) $$invalidate(1, hasDeleteButton = $$props.hasDeleteButton);
    		if ("hasAcceptButton" in $$props) $$invalidate(2, hasAcceptButton = $$props.hasAcceptButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fact, hasDeleteButton, hasAcceptButton, deleteFact, acceptFact];
    }

    class Fact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			fact: 0,
    			hasDeleteButton: 1,
    			hasAcceptButton: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fact",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*fact*/ ctx[0] === undefined && !("fact" in props)) {
    			console.warn("<Fact> was created without expected prop 'fact'");
    		}

    		if (/*hasDeleteButton*/ ctx[1] === undefined && !("hasDeleteButton" in props)) {
    			console.warn("<Fact> was created without expected prop 'hasDeleteButton'");
    		}

    		if (/*hasAcceptButton*/ ctx[2] === undefined && !("hasAcceptButton" in props)) {
    			console.warn("<Fact> was created without expected prop 'hasAcceptButton'");
    		}
    	}

    	get fact() {
    		throw new Error("<Fact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fact(value) {
    		throw new Error("<Fact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasDeleteButton() {
    		throw new Error("<Fact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasDeleteButton(value) {
    		throw new Error("<Fact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasAcceptButton() {
    		throw new Error("<Fact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasAcceptButton(value) {
    		throw new Error("<Fact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const worker$1 = new Worker("worker.js");
    const userStore = writable({
      email: "",
      loggedIn: false,
      event: "initial",
    });

    userStore.subscribe((user) => {
      if (user && user.event == "initial") {
        return;
      }
      if (user.loggedIn) {
        notify("you are logged in! Add some nice content.");
      } else {
        notify("your logged out, lurin kicked you out.");
      }
    });

    let dataInterface$1 = wrap(worker$1);

    function login(...p) {
      return dataInterface$1.login(...p);
    }

    function resetPasswordRequest(...p) {
      return dataInterface$1.resetPasswordRequest(...p);
    }

    function logout() {
      return dataInterface$1.logout();
    }

    async function getLoginState() {
      function callback(f) {
        userStore.set(f);
      }
      dataInterface$1.subscribeToLoginState(proxy(callback));
    }

    getLoginState();

    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */

      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          loc.port === url.port;
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    /* src\components\Facts.svelte generated by Svelte v3.20.1 */
    const file$a = "src\\components\\Facts.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (69:6) <Label>
    function create_default_slot_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Contribute your own fact");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(69:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (68:4) <Button href="/contribute" variant="raised" class="formButton">
    function create_default_slot_6(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(68:4) <Button href=\\\"/contribute\\\" variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (74:6) {#each facts as fact}
    function create_each_block(ctx) {
    	let li;
    	let t;
    	let current;
    	let dispose;

    	const fact = new Fact({
    			props: {
    				fact: /*fact*/ ctx[8],
    				hasDeleteButton: /*loggedIn*/ ctx[3],
    				hasAcceptButton: false
    			},
    			$$inline: true
    		});

    	fact.$on("delete", onDeleteFact);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*fact*/ ctx[8], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(fact.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "list-item svelte-g3g3uo");
    			add_location(li, file$a, 74, 8, 2174);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, li, anchor);
    			mount_component(fact, li, null);
    			append_dev(li, t);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(li, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const fact_changes = {};
    			if (dirty & /*facts*/ 1) fact_changes.fact = /*fact*/ ctx[8];
    			if (dirty & /*loggedIn*/ 8) fact_changes.hasDeleteButton = /*loggedIn*/ ctx[3];
    			fact.$set(fact_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(fact);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(74:6) {#each facts as fact}",
    		ctx
    	});

    	return block;
    }

    // (91:2) <Title id="list-title">
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Fact");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(91:2) <Title id=\\\"list-title\\\">",
    		ctx
    	});

    	return block;
    }

    // (93:4) {#if selectedFact}
    function create_if_block$1(ctx) {
    	let current;

    	const fact = new Fact({
    			props: {
    				fact: /*selectedFact*/ ctx[2],
    				hasDeleteButton: false,
    				hasAcceptButton: false
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(fact.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fact, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fact_changes = {};
    			if (dirty & /*selectedFact*/ 4) fact_changes.fact = /*selectedFact*/ ctx[2];
    			fact.$set(fact_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fact, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(93:4) {#if selectedFact}",
    		ctx
    	});

    	return block;
    }

    // (92:2) <Content>
    function create_default_slot_4$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*selectedFact*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*selectedFact*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(92:2) <Content>",
    		ctx
    	});

    	return block;
    }

    // (102:6) <Label>
    function create_default_slot_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Got it!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(102:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (101:4) <Button action="accept" variant="raised" class="formButton">
    function create_default_slot_2$1(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(101:4) <Button action=\\\"accept\\\" variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (100:2) <Actions>
    function create_default_slot_1$1(ctx) {
    	let current;

    	const button = new Button_1({
    			props: {
    				action: "accept",
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(100:2) <Actions>",
    		ctx
    	});

    	return block;
    }

    // (87:0) <Dialog    bind:this={selectedFactDialog}    aria-labelledby="list-title"    aria-describedby="list-content">
    function create_default_slot$3(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const title = new Title({
    			props: {
    				id: "list-title",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const content = new Content({
    			props: {
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const actions = new Actions({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(content.$$.fragment);
    			t1 = space();
    			create_component(actions.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(content, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(actions, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const content_changes = {};

    			if (dirty & /*$$scope, selectedFact*/ 2052) {
    				content_changes.$$scope = { dirty, ctx };
    			}

    			content.$set(content_changes);
    			const actions_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				actions_changes.$$scope = { dirty, ctx };
    			}

    			actions.$set(actions_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			transition_in(actions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			transition_out(actions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(content, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(actions, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(87:0) <Dialog    bind:this={selectedFactDialog}    aria-labelledby=\\\"list-title\\\"    aria-describedby=\\\"list-content\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let ul;
    	let t1;
    	let current;

    	const button = new Button_1({
    			props: {
    				href: "/contribute",
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*facts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let dialog_props = {
    		"aria-labelledby": "list-title",
    		"aria-describedby": "list-content",
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	};

    	const dialog = new Dialog({ props: dialog_props, $$inline: true });
    	/*dialog_binding*/ ctx[7](dialog);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(button.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			create_component(dialog.$$.fragment);
    			set_style(div0, "height", "60px");
    			add_location(div0, file$a, 66, 2, 1935);
    			attr_dev(ul, "class", "list svelte-g3g3uo");
    			add_location(ul, file$a, 72, 4, 2118);
    			add_location(div1, file$a, 71, 2, 2107);
    			attr_dev(div2, "class", "contentpadding");
    			add_location(div2, file$a, 65, 0, 1903);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(button, div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t1, anchor);
    			mount_component(dialog, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty & /*selectFact, facts, loggedIn, onDeleteFact*/ 25) {
    				each_value = /*facts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const dialog_changes = {};

    			if (dirty & /*$$scope, selectedFact*/ 2052) {
    				dialog_changes.$$scope = { dirty, ctx };
    			}

    			dialog.$set(dialog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(dialog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(dialog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(button);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			/*dialog_binding*/ ctx[7](null);
    			destroy_component(dialog, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function onDeleteFact(event) {
    	let ok = await ask("Do you really want to delete this fact?");

    	if (ok) {
    		deleteFactSerious(event.detail);
    	}
    }

    function deleteFactSerious(fact) {
    	deleteFact(fact).then(success => {
    		if (success) {
    			notify("fact was deleted");
    		} else {
    			notify("something went wrong while deleting the fact");
    		}
    	});
    }

    function instance$c($$self, $$props, $$invalidate) {
    	onMount(async function () {
    		var s = await subscribeToFacts();

    		s.subscribe(x => {
    			$$invalidate(0, facts = x);
    		});
    	});

    	let facts = [];
    	let { params } = $$props;
    	let selectedFactDialog;
    	let selectedFact = null;
    	let loggedIn = false;

    	userStore.subscribe(user => {
    		$$invalidate(3, loggedIn = user.loggedIn);
    	});

    	if (params.factKey) {
    		svelteFactStore.subscribe(facts => {
    			$$invalidate(2, selectedFact = facts.filter(x => x.key = params.factKey)[0]);

    			if (selectedFact) {
    				selectFact(selectedFact);
    			}
    		});
    	}

    	function selectFact(fact) {
    		$$invalidate(2, selectedFact = fact);
    		selectedFactDialog.open();
    		page_js("/facts?key=" + selectedFact.key);
    	}

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Facts> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Facts", $$slots, []);
    	const click_handler = fact => selectFact(fact);

    	function dialog_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, selectedFactDialog = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		deleteFact,
    		subscribeToFacts,
    		Dialog,
    		Title,
    		Content,
    		Actions,
    		InitialFocus,
    		notify,
    		ask,
    		Fact,
    		Button: Button_1,
    		Label,
    		userStore,
    		page: page_js,
    		onMount,
    		facts,
    		params,
    		selectedFactDialog,
    		selectedFact,
    		loggedIn,
    		onDeleteFact,
    		deleteFactSerious,
    		selectFact
    	});

    	$$self.$inject_state = $$props => {
    		if ("facts" in $$props) $$invalidate(0, facts = $$props.facts);
    		if ("params" in $$props) $$invalidate(5, params = $$props.params);
    		if ("selectedFactDialog" in $$props) $$invalidate(1, selectedFactDialog = $$props.selectedFactDialog);
    		if ("selectedFact" in $$props) $$invalidate(2, selectedFact = $$props.selectedFact);
    		if ("loggedIn" in $$props) $$invalidate(3, loggedIn = $$props.loggedIn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		facts,
    		selectedFactDialog,
    		selectedFact,
    		loggedIn,
    		selectFact,
    		params,
    		click_handler,
    		dialog_binding
    	];
    }

    class Facts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { params: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Facts",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[5] === undefined && !("params" in props)) {
    			console.warn("<Facts> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Facts>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Facts>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const worker$2 = new Worker("worker.js");

    let images = writable([]);
    let newestImages = writable([]);
    let imageAdapter = writable([]);

    let dataInterface$2 = wrap(worker$2);

    async function subscribeToImages() {
      return images;
    }

    async function subscribeToNewestImages() {
      return newestImages;
    }

    async function loadImages() {
      var storedImages = localStorage.getItem("images") || "[]";
      const imagesArray = JSON.parse(storedImages);

      images.set(imagesArray);
      newestImages.set(getNewest$1(imagesArray));

      function callback(f) {
        imageAdapter.set(f);
      }
      dataInterface$2.subscribeToImages(proxy(callback));

      imageAdapter.subscribe((f) => {
        // console.log("got call back from comlink", f);
        var valToAdd = Array.isArray(f) ? f : [f];

        var notYetStoredImages = valToAdd.filter(
          (x) => !imagesArray.some((a) => a.key == x.key)
        );

        if (notYetStoredImages.length == 0) {
          return;
        }

        imagesArray.push(...notYetStoredImages);

        imagesArray.sort((x, y) => y.insertTime - x.insertTime);

        let imagesForLocalStore = imagesArray.filter((x, idx) => idx < 10);
        localStorage.setItem("images", JSON.stringify(imagesForLocalStore));

        images.set(imagesArray);
        newestImages.set(getNewest$1(imagesArray));
      });
    }

    function getNewest$1(imagesArray) {
      return imagesArray.filter((x, idx) => idx < 1);
    }

    async function deleteImageAndMetadata(...p) {
      return dataInterface$2.deleteImageAndMetadata(...p);
    }

    async function saveImageAndMetadata(...p) {
      return dataInterface$2.saveImageAndMetadata(...p);
    }

    async function loadFullSizeImage(image) {
      if (image.fullImageSizeUrl) {
        return Promise.resolve(image.fullImageSizeUrl);
      }
      const p1 = new Promise(async function (resolve, reject) {
        function callback(url) {
          resolve(url);
        }
        await dataInterface$2.preloadImageByKey(
          image.imageKey,
          proxy(callback)
        );
      });
      return p1;
    }

    loadImages();

    /* src\components\Image.svelte generated by Svelte v3.20.1 */
    const file$b = "src\\components\\Image.svelte";

    // (46:4) {#if hasDeleteButton}
    function create_if_block$2(ctx) {
    	let current;

    	const button = new Button_1({
    			props: {
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*deleteLocation*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(46:4) {#if hasDeleteButton}",
    		ctx
    	});

    	return block;
    }

    // (48:8) <Label>
    function create_default_slot_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete location");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(48:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (47:6) <Button on:click={deleteLocation} variant="raised" class="formButton">
    function create_default_slot$4(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(47:6) <Button on:click={deleteLocation} variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t0_value = /*image*/ ctx[0].imageTitle + "";
    	let t0;
    	let t1;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_class_value;
    	let img_alt_value;
    	let t2;
    	let div2;
    	let t3_value = /*image*/ ctx[0].funFact + "";
    	let t3;
    	let t4;
    	let div3;
    	let t5_value = getDisplayTime(/*image*/ ctx[0].insertTime) + "";
    	let t5;
    	let t6;
    	let current;
    	let dispose;
    	let if_block = /*hasDeleteButton*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			img = element("img");
    			t2 = space();
    			div2 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div3 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "imageText svelte-1aqw8xf");
    			add_location(div0, file$b, 35, 4, 1486);
    			if (img.src !== (img_src_value = /*image*/ ctx[0].thumbnail)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", img_class_value = "" + (null_to_empty(/*landscapeClass*/ ctx[3]) + " svelte-1aqw8xf"));
    			attr_dev(img, "alt", img_alt_value = /*image*/ ctx[0].funFact);
    			add_location(img, file$b, 37, 6, 1565);
    			attr_dev(div1, "class", "square svelte-1aqw8xf");
    			add_location(div1, file$b, 36, 4, 1538);
    			attr_dev(div2, "class", "imageText svelte-1aqw8xf");
    			add_location(div2, file$b, 43, 4, 1707);
    			attr_dev(div3, "class", "imageSubtitle svelte-1aqw8xf");
    			add_location(div3, file$b, 44, 4, 1756);
    			attr_dev(div4, "class", "svelte-1aqw8xf");
    			add_location(div4, file$b, 34, 2, 1476);
    			attr_dev(div5, "class", "imageContainer mdc-card svelte-1aqw8xf");
    			add_location(div5, file$b, 31, 0, 1354);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, img);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div2, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, t5);
    			append_dev(div4, t6);
    			if (if_block) if_block.m(div4, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(img, "load", /*imageLoaded*/ ctx[5], false, false, false),
    				listen_dev(div5, "click", /*click_handler*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*image*/ 1) && t0_value !== (t0_value = /*image*/ ctx[0].imageTitle + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*image*/ 1 && img.src !== (img_src_value = /*image*/ ctx[0].thumbnail)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*landscapeClass*/ 8 && img_class_value !== (img_class_value = "" + (null_to_empty(/*landscapeClass*/ ctx[3]) + " svelte-1aqw8xf"))) {
    				attr_dev(img, "class", img_class_value);
    			}

    			if (!current || dirty & /*image*/ 1 && img_alt_value !== (img_alt_value = /*image*/ ctx[0].funFact)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if ((!current || dirty & /*image*/ 1) && t3_value !== (t3_value = /*image*/ ctx[0].funFact + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*image*/ 1) && t5_value !== (t5_value = getDisplayTime(/*image*/ ctx[0].insertTime) + "")) set_data_dev(t5, t5_value);

    			if (/*hasDeleteButton*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div4, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { image } = $$props;
    	let { hasDeleteButton } = $$props;
    	let pathName = location.pathname || "home";

    	pathName = pathName.indexOf("/") == 0
    	? pathName.substring(1)
    	: PathName;

    	let landscapeClass = "portrait";
    	const dispatch = createEventDispatcher();

    	function deleteLocation(e) {
    		e.stopPropagation();
    		dispatch("delete", image);
    	}

    	function imageLoaded(e) {
    		if (e.target.width > e.target.height) {
    			$$invalidate(3, landscapeClass = "landscape");
    		}
    	}

    	const writable_props = ["image", "hasDeleteButton"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Image> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Image", $$slots, []);
    	const click_handler = () => page_js("/slideShow?key=" + image.key + "&backUrl=" + pathName);

    	$$self.$set = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("hasDeleteButton" in $$props) $$invalidate(1, hasDeleteButton = $$props.hasDeleteButton);
    	};

    	$$self.$capture_state = () => ({
    		getDisplayTime,
    		createEventDispatcher,
    		Button: Button_1,
    		Label,
    		page: page_js,
    		image,
    		hasDeleteButton,
    		pathName,
    		landscapeClass,
    		dispatch,
    		deleteLocation,
    		imageLoaded
    	});

    	$$self.$inject_state = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("hasDeleteButton" in $$props) $$invalidate(1, hasDeleteButton = $$props.hasDeleteButton);
    		if ("pathName" in $$props) $$invalidate(2, pathName = $$props.pathName);
    		if ("landscapeClass" in $$props) $$invalidate(3, landscapeClass = $$props.landscapeClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		image,
    		hasDeleteButton,
    		pathName,
    		landscapeClass,
    		deleteLocation,
    		imageLoaded,
    		dispatch,
    		click_handler
    	];
    }

    class Image$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { image: 0, hasDeleteButton: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Image",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[0] === undefined && !("image" in props)) {
    			console.warn("<Image> was created without expected prop 'image'");
    		}

    		if (/*hasDeleteButton*/ ctx[1] === undefined && !("hasDeleteButton" in props)) {
    			console.warn("<Image> was created without expected prop 'hasDeleteButton'");
    		}
    	}

    	get image() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasDeleteButton() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasDeleteButton(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Images.svelte generated by Svelte v3.20.1 */

    const { console: console_1 } = globals;
    const file$c = "src\\components\\Images.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (53:4) {#each images as image}
    function create_each_block$1(ctx) {
    	let li;
    	let t;
    	let current;

    	const image = new Image$1({
    			props: {
    				image: /*image*/ ctx[3],
    				hasDeleteButton: /*loggedIn*/ ctx[1]
    			},
    			$$inline: true
    		});

    	image.$on("delete", onDeleteLocation);

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(image.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "list-item svelte-1yqupue");
    			add_location(li, file$c, 53, 6, 1443);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(image, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const image_changes = {};
    			if (dirty & /*images*/ 1) image_changes.image = /*image*/ ctx[3];
    			if (dirty & /*loggedIn*/ 2) image_changes.hasDeleteButton = /*loggedIn*/ ctx[1];
    			image.$set(image_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(image);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(53:4) {#each images as image}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div;
    	let ul;
    	let current;
    	let each_value = /*images*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "list svelte-1yqupue");
    			add_location(ul, file$c, 51, 2, 1389);
    			add_location(div, file$c, 50, 0, 1380);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*images, loggedIn, onDeleteLocation*/ 3) {
    				each_value = /*images*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function onDeleteLocation(event) {
    	let ok = await ask("Do you really want to delete this location?");

    	if (ok) {
    		deleteLocationSerious(event.detail);
    	}
    }

    function deleteLocationSerious(location) {
    	deleteImageAndMetadata(location).then(
    		() => {
    			notify("location was deleted");
    		},
    		() => {
    			notify("something went wrong while deleting the location");
    		}
    	);
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { params } = $$props;
    	let images = [];

    	onMount(async function () {
    		console.log("images mounted");
    		let imageObservable = await subscribeToImages();

    		imageObservable.subscribe(x => {
    			$$invalidate(0, images = x);
    		});
    	});

    	let loggedIn = false;

    	userStore.subscribe(user => {
    		$$invalidate(1, loggedIn = user.loggedIn);
    	});

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Images> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Images", $$slots, []);

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		subscribeToImages,
    		deleteImageAndMetadata,
    		Image: Image$1,
    		userStore,
    		notify,
    		ask,
    		onMount,
    		params,
    		images,
    		loggedIn,
    		onDeleteLocation,
    		deleteLocationSerious
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    		if ("loggedIn" in $$props) $$invalidate(1, loggedIn = $$props.loggedIn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [images, loggedIn, params];
    }

    class Images extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { params: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Images",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[2] === undefined && !("params" in props)) {
    			console_1.warn("<Images> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Images>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Images>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$2 = {
        ICON_BUTTON_ON: 'mdc-icon-button--on',
        ROOT: 'mdc-icon-button',
    };
    var strings$3 = {
        ARIA_PRESSED: 'aria-pressed',
        CHANGE_EVENT: 'MDCIconButtonToggle:change',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCIconButtonToggleFoundation = /** @class */ (function (_super) {
        __extends(MDCIconButtonToggleFoundation, _super);
        function MDCIconButtonToggleFoundation(adapter) {
            return _super.call(this, __assign({}, MDCIconButtonToggleFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCIconButtonToggleFoundation, "cssClasses", {
            get: function () {
                return cssClasses$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCIconButtonToggleFoundation, "strings", {
            get: function () {
                return strings$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCIconButtonToggleFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    hasClass: function () { return false; },
                    notifyChange: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    setAttr: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCIconButtonToggleFoundation.prototype.init = function () {
            this.adapter_.setAttr(strings$3.ARIA_PRESSED, "" + this.isOn());
        };
        MDCIconButtonToggleFoundation.prototype.handleClick = function () {
            this.toggle();
            this.adapter_.notifyChange({ isOn: this.isOn() });
        };
        MDCIconButtonToggleFoundation.prototype.isOn = function () {
            return this.adapter_.hasClass(cssClasses$2.ICON_BUTTON_ON);
        };
        MDCIconButtonToggleFoundation.prototype.toggle = function (isOn) {
            if (isOn === void 0) { isOn = !this.isOn(); }
            if (isOn) {
                this.adapter_.addClass(cssClasses$2.ICON_BUTTON_ON);
            }
            else {
                this.adapter_.removeClass(cssClasses$2.ICON_BUTTON_ON);
            }
            this.adapter_.setAttr(strings$3.ARIA_PRESSED, "" + isOn);
        };
        return MDCIconButtonToggleFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$4 = MDCIconButtonToggleFoundation.strings;
    var MDCIconButtonToggle = /** @class */ (function (_super) {
        __extends(MDCIconButtonToggle, _super);
        function MDCIconButtonToggle() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.ripple_ = _this.createRipple_();
            return _this;
        }
        MDCIconButtonToggle.attachTo = function (root) {
            return new MDCIconButtonToggle(root);
        };
        MDCIconButtonToggle.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.handleClick_ = function () { return _this.foundation_.handleClick(); };
            this.listen('click', this.handleClick_);
        };
        MDCIconButtonToggle.prototype.destroy = function () {
            this.unlisten('click', this.handleClick_);
            this.ripple_.destroy();
            _super.prototype.destroy.call(this);
        };
        MDCIconButtonToggle.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                notifyChange: function (evtData) { return _this.emit(strings$4.CHANGE_EVENT, evtData); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                setAttr: function (attrName, attrValue) { return _this.root_.setAttribute(attrName, attrValue); },
            };
            return new MDCIconButtonToggleFoundation(adapter);
        };
        Object.defineProperty(MDCIconButtonToggle.prototype, "ripple", {
            get: function () {
                return this.ripple_;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCIconButtonToggle.prototype, "on", {
            get: function () {
                return this.foundation_.isOn();
            },
            set: function (isOn) {
                this.foundation_.toggle(isOn);
            },
            enumerable: true,
            configurable: true
        });
        MDCIconButtonToggle.prototype.createRipple_ = function () {
            var ripple = new MDCRipple(this.root_);
            ripple.unbounded = true;
            return ripple;
        };
        return MDCIconButtonToggle;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules\@smui\icon-button\IconButton.svelte generated by Svelte v3.20.1 */
    const file$d = "node_modules\\@smui\\icon-button\\IconButton.svelte";

    // (23:0) {:else}
    function create_else_block(ctx) {
    	let button;
    	let useActions_action;
    	let forwardEvents_action;
    	let Ripple_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	let button_levels = [
    		{
    			class: "\n      mdc-icon-button\n      " + /*className*/ ctx[2] + "\n      " + (/*pressed*/ ctx[0] ? "mdc-icon-button--on" : "") + "\n      " + (/*context*/ ctx[10] === "card:action"
    			? "mdc-card__action"
    			: "") + "\n      " + (/*context*/ ctx[10] === "card:action"
    			? "mdc-card__action--icon"
    			: "") + "\n      " + (/*context*/ ctx[10] === "top-app-bar:navigation"
    			? "mdc-top-app-bar__navigation-icon"
    			: "") + "\n      " + (/*context*/ ctx[10] === "top-app-bar:action"
    			? "mdc-top-app-bar__action-item"
    			: "") + "\n      " + (/*context*/ ctx[10] === "snackbar"
    			? "mdc-snackbar__dismiss"
    			: "") + "\n    "
    		},
    		{ "aria-hidden": "true" },
    		{ "aria-pressed": /*pressed*/ ctx[0] },
    		/*props*/ ctx[8]
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			set_attributes(button, button_data);
    			add_location(button, file$d, 23, 2, 769);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			/*button_binding*/ ctx[18](button);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, button, /*use*/ ctx[1])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[9].call(null, button)),
    				action_destroyer(Ripple_action = Ripple.call(null, button, {
    					ripple: /*ripple*/ ctx[3] && !/*toggle*/ ctx[5],
    					unbounded: true,
    					color: /*color*/ ctx[4]
    				})),
    				listen_dev(button, "MDCIconButtonToggle:change", /*handleChange*/ ctx[11], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32768) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    				}
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				dirty & /*className, pressed, context*/ 1029 && {
    					class: "\n      mdc-icon-button\n      " + /*className*/ ctx[2] + "\n      " + (/*pressed*/ ctx[0] ? "mdc-icon-button--on" : "") + "\n      " + (/*context*/ ctx[10] === "card:action"
    					? "mdc-card__action"
    					: "") + "\n      " + (/*context*/ ctx[10] === "card:action"
    					? "mdc-card__action--icon"
    					: "") + "\n      " + (/*context*/ ctx[10] === "top-app-bar:navigation"
    					? "mdc-top-app-bar__navigation-icon"
    					: "") + "\n      " + (/*context*/ ctx[10] === "top-app-bar:action"
    					? "mdc-top-app-bar__action-item"
    					: "") + "\n      " + (/*context*/ ctx[10] === "snackbar"
    					? "mdc-snackbar__dismiss"
    					: "") + "\n    "
    				},
    				{ "aria-hidden": "true" },
    				dirty & /*pressed*/ 1 && { "aria-pressed": /*pressed*/ ctx[0] },
    				dirty & /*props*/ 256 && /*props*/ ctx[8]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);

    			if (Ripple_action && is_function(Ripple_action.update) && dirty & /*ripple, toggle, color*/ 56) Ripple_action.update.call(null, {
    				ripple: /*ripple*/ ctx[3] && !/*toggle*/ ctx[5],
    				unbounded: true,
    				color: /*color*/ ctx[4]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			/*button_binding*/ ctx[18](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(23:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (1:0) {#if href}
    function create_if_block$3(ctx) {
    	let a;
    	let useActions_action;
    	let forwardEvents_action;
    	let Ripple_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	let a_levels = [
    		{
    			class: "\n      mdc-icon-button\n      " + /*className*/ ctx[2] + "\n      " + (/*pressed*/ ctx[0] ? "mdc-icon-button--on" : "") + "\n      " + (/*context*/ ctx[10] === "card:action"
    			? "mdc-card__action"
    			: "") + "\n      " + (/*context*/ ctx[10] === "card:action"
    			? "mdc-card__action--icon"
    			: "") + "\n      " + (/*context*/ ctx[10] === "top-app-bar:navigation"
    			? "mdc-top-app-bar__navigation-icon"
    			: "") + "\n      " + (/*context*/ ctx[10] === "top-app-bar:action"
    			? "mdc-top-app-bar__action-item"
    			: "") + "\n      " + (/*context*/ ctx[10] === "snackbar"
    			? "mdc-snackbar__dismiss"
    			: "") + "\n    "
    		},
    		{ "aria-hidden": "true" },
    		{ "aria-pressed": /*pressed*/ ctx[0] },
    		{ href: /*href*/ ctx[6] },
    		/*props*/ ctx[8]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$d, 1, 2, 13);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			/*a_binding*/ ctx[17](a);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, a, /*use*/ ctx[1])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[9].call(null, a)),
    				action_destroyer(Ripple_action = Ripple.call(null, a, {
    					ripple: /*ripple*/ ctx[3] && !/*toggle*/ ctx[5],
    					unbounded: true,
    					color: /*color*/ ctx[4]
    				})),
    				listen_dev(a, "MDCIconButtonToggle:change", /*handleChange*/ ctx[11], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32768) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    				}
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*className, pressed, context*/ 1029 && {
    					class: "\n      mdc-icon-button\n      " + /*className*/ ctx[2] + "\n      " + (/*pressed*/ ctx[0] ? "mdc-icon-button--on" : "") + "\n      " + (/*context*/ ctx[10] === "card:action"
    					? "mdc-card__action"
    					: "") + "\n      " + (/*context*/ ctx[10] === "card:action"
    					? "mdc-card__action--icon"
    					: "") + "\n      " + (/*context*/ ctx[10] === "top-app-bar:navigation"
    					? "mdc-top-app-bar__navigation-icon"
    					: "") + "\n      " + (/*context*/ ctx[10] === "top-app-bar:action"
    					? "mdc-top-app-bar__action-item"
    					: "") + "\n      " + (/*context*/ ctx[10] === "snackbar"
    					? "mdc-snackbar__dismiss"
    					: "") + "\n    "
    				},
    				{ "aria-hidden": "true" },
    				dirty & /*pressed*/ 1 && { "aria-pressed": /*pressed*/ ctx[0] },
    				dirty & /*href*/ 64 && { href: /*href*/ ctx[6] },
    				dirty & /*props*/ 256 && /*props*/ ctx[8]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);

    			if (Ripple_action && is_function(Ripple_action.update) && dirty & /*ripple, toggle, color*/ 56) Ripple_action.update.call(null, {
    				ripple: /*ripple*/ ctx[3] && !/*toggle*/ ctx[5],
    				unbounded: true,
    				color: /*color*/ ctx[4]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			/*a_binding*/ ctx[17](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(1:0) {#if href}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[6]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCIconButtonToggle:change"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { ripple = true } = $$props;
    	let { color = null } = $$props;
    	let { toggle = false } = $$props;
    	let { pressed = false } = $$props;
    	let { href = null } = $$props;
    	let element;
    	let toggleButton;
    	let context = getContext("SMUI:icon-button:context");
    	setContext("SMUI:icon:context", "icon-button");
    	let oldToggle = null;

    	onDestroy(() => {
    		toggleButton && toggleButton.destroy();
    	});

    	function handleChange(e) {
    		$$invalidate(0, pressed = e.detail.isOn);
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("IconButton", $$slots, ['default']);

    	function a_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	function button_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(14, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("ripple" in $$new_props) $$invalidate(3, ripple = $$new_props.ripple);
    		if ("color" in $$new_props) $$invalidate(4, color = $$new_props.color);
    		if ("toggle" in $$new_props) $$invalidate(5, toggle = $$new_props.toggle);
    		if ("pressed" in $$new_props) $$invalidate(0, pressed = $$new_props.pressed);
    		if ("href" in $$new_props) $$invalidate(6, href = $$new_props.href);
    		if ("$$scope" in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		MDCIconButtonToggle,
    		onDestroy,
    		getContext,
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		Ripple,
    		forwardEvents,
    		use,
    		className,
    		ripple,
    		color,
    		toggle,
    		pressed,
    		href,
    		element,
    		toggleButton,
    		context,
    		oldToggle,
    		handleChange,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(14, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("ripple" in $$props) $$invalidate(3, ripple = $$new_props.ripple);
    		if ("color" in $$props) $$invalidate(4, color = $$new_props.color);
    		if ("toggle" in $$props) $$invalidate(5, toggle = $$new_props.toggle);
    		if ("pressed" in $$props) $$invalidate(0, pressed = $$new_props.pressed);
    		if ("href" in $$props) $$invalidate(6, href = $$new_props.href);
    		if ("element" in $$props) $$invalidate(7, element = $$new_props.element);
    		if ("toggleButton" in $$props) $$invalidate(12, toggleButton = $$new_props.toggleButton);
    		if ("context" in $$props) $$invalidate(10, context = $$new_props.context);
    		if ("oldToggle" in $$props) $$invalidate(13, oldToggle = $$new_props.oldToggle);
    		if ("props" in $$props) $$invalidate(8, props = $$new_props.props);
    	};

    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(8, props = exclude($$props, ["use", "class", "ripple", "color", "toggle", "pressed", "href"]));

    		if ($$self.$$.dirty & /*element, toggle, oldToggle, ripple, toggleButton, pressed*/ 12457) {
    			 if (element && toggle !== oldToggle) {
    				if (toggle) {
    					$$invalidate(12, toggleButton = new MDCIconButtonToggle(element));

    					if (!ripple) {
    						toggleButton.ripple.destroy();
    					}

    					$$invalidate(12, toggleButton.on = pressed, toggleButton);
    				} else if (oldToggle) {
    					toggleButton && toggleButton.destroy();
    					$$invalidate(12, toggleButton = null);
    				}

    				$$invalidate(13, oldToggle = toggle);
    			}
    		}

    		if ($$self.$$.dirty & /*toggleButton, pressed*/ 4097) {
    			 if (toggleButton && toggleButton.on !== pressed) {
    				$$invalidate(12, toggleButton.on = pressed, toggleButton);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		pressed,
    		use,
    		className,
    		ripple,
    		color,
    		toggle,
    		href,
    		element,
    		props,
    		forwardEvents,
    		context,
    		handleChange,
    		toggleButton,
    		oldToggle,
    		$$props,
    		$$scope,
    		$$slots,
    		a_binding,
    		button_binding
    	];
    }

    class IconButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
    			use: 1,
    			class: 2,
    			ripple: 3,
    			color: 4,
    			toggle: 5,
    			pressed: 0,
    			href: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IconButton",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get use() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pressed() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pressed(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const isLoaded = writable(false);
    let scriptInjected = false;

    window.mapsLoaded = function () {
      window.googleMapsLoaded = true;
      console.log("maps loaded");
    };

    function loadMapScript() {
      if (!scriptInjected) {
        var script = document.createElement("script");
        script.src =
          "https://maps.googleapis.com/maps/api/js?key=AIzaSyCkg9lEDwpI3a_YteembM0t_iOmR3jdOD8&callback=mapsLoaded";
        document.head.appendChild(script);
        scriptInjected = true;
        setTimeout(checkIfMapsIsLoaded, 300);
      }
      return isLoaded;
    }

    function checkIfMapsIsLoaded() {
      if (window.googleMapsLoaded) {
        isLoaded.set(true);
      } else {
        setTimeout(checkIfMapsIsLoaded, 300);
      }
    }

    /* src\components\Map.svelte generated by Svelte v3.20.1 */

    const { console: console_1$1 } = globals;
    const file$e = "src\\components\\Map.svelte";

    // (120:33) 
    function create_if_block_1$1(ctx) {
    	let h1;
    	let t1;
    	let a;
    	let t3;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Sorry, Google Maps only work when online!";
    			t1 = text("\n  Go to\n  ");
    			a = element("a");
    			a.textContent = "Images";
    			t3 = text("\n  instead.");
    			add_location(h1, file$e, 120, 2, 3660);
    			attr_dev(a, "href", "/images");
    			add_location(a, file$e, 122, 2, 3721);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    			insert_dev(target, t3, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(120:33) ",
    		ctx
    	});

    	return block;
    }

    // (118:0) {#if loadState == 'loading'}
    function create_if_block$4(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Waiting for google maps to load....";
    			add_location(h1, file$e, 118, 2, 3579);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(118:0) {#if loadState == 'loading'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let t;
    	let div1;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*loadState*/ ctx[1] == "loading") return create_if_block$4;
    		if (/*loadState*/ ctx[1] == "offline") return create_if_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "map");
    			attr_dev(div0, "class", "svelte-pmurkr");
    			add_location(div0, file$e, 127, 2, 3797);
    			attr_dev(div1, "class", "mapContainer svelte-pmurkr");
    			add_location(div1, file$e, 126, 0, 3768);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[14](div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			/*div0_binding*/ ctx[14](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getTemplate(image) {
    	return `<div id="content" class="markerPopUp">
    <h2>${image.imageTitle}</h2>
    <div>
    <img src="${image.thumbnail}" alt="${image.imageTitle}" />
    <p>${image.funFact}</p>
    </div></div>`;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { params } = $$props;
    	let map;
    	let mapElement;
    	let markers = [];
    	let online = window.navigator.onLine;
    	var loadState = "";
    	let addedImagesKeys = [];

    	function initMap() {
    		let initialCoords = { lat: 46.65, lng: 7.709 };
    		map = new google.maps.Map(mapElement, { center: initialCoords, zoom: 3 });
    	}

    	function addImageToMap(image) {
    		if (markers.some(x => x.key == image.key)) {
    			return;
    		}

    		var marker = new google.maps.Marker({
    				position: {
    					lat: image.location.latitude,
    					lng: image.location.longitude
    				},
    				title: image.imageTitle,
    				map,
    				animation: google.maps.Animation.DROP
    			});

    		marker.key = image.key;

    		marker.addListener("click", function () {
    			createInfoWindow(image, marker);
    		});

    		marker.addListener("mouseover", function () {
    			createInfoWindow(image, marker);
    		});

    		markers.push(marker);

    		if (params.key == image.key) {
    			createInfoWindow(image, marker);
    		}
    	}

    	async function addImagesToMap(images) {
    		while (images.length > 0) {
    			let i = 0;

    			while (images.length > 0 && i++ < 10) {
    				var img = images.pop();

    				if (!addedImagesKeys.find(x => x.key == img.key)) {
    					delayedAdd(img);
    					addedImagesKeys.push(img.key);
    				}
    			}
    		}
    	}

    	function delayedAdd(img) {
    		window.setTimeout(
    			function () {
    				addImageToMap(img);
    			},
    			1000 + Math.random() * 7000
    		);
    	}

    	onMount(async () => {
    		if (!online) {
    			$$invalidate(1, loadState = "offline");
    			return;
    		}

    		$$invalidate(1, loadState = "loading");
    		waitForMapToLoaded();
    	});

    	async function waitForMapToLoaded() {
    		var observer = loadMapScript();

    		observer.subscribe(async loaded => {
    			if (loaded) {
    				$$invalidate(1, loadState = "loaded");
    				initMap();
    				(await subscribeToImages()).subscribe(addImagesToMap);
    			}
    		});
    	}

    	let infowindow = null;

    	function createInfoWindow(image, marker) {
    		if (infowindow) {
    			infowindow.close();
    		}

    		infowindow = new google.maps.InfoWindow({ content: getTemplate(image) });
    		infowindow.open(map, marker);
    		page_js("/map?key=" + marker.key);
    	}

    	window.mapsLoaded = function () {
    		window.googleMapsLoaded = true;
    		console.log("maps loaded");
    	};

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Map", $$slots, []);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, mapElement = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Icon,
    		tick,
    		subscribeToImages,
    		loadMapScript,
    		page: page_js,
    		params,
    		map,
    		mapElement,
    		markers,
    		online,
    		loadState,
    		addedImagesKeys,
    		initMap,
    		addImageToMap,
    		addImagesToMap,
    		delayedAdd,
    		waitForMapToLoaded,
    		getTemplate,
    		infowindow,
    		createInfoWindow
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(2, params = $$props.params);
    		if ("map" in $$props) map = $$props.map;
    		if ("mapElement" in $$props) $$invalidate(0, mapElement = $$props.mapElement);
    		if ("markers" in $$props) markers = $$props.markers;
    		if ("online" in $$props) online = $$props.online;
    		if ("loadState" in $$props) $$invalidate(1, loadState = $$props.loadState);
    		if ("addedImagesKeys" in $$props) addedImagesKeys = $$props.addedImagesKeys;
    		if ("infowindow" in $$props) infowindow = $$props.infowindow;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		mapElement,
    		loadState,
    		params,
    		map,
    		infowindow,
    		markers,
    		online,
    		addedImagesKeys,
    		initMap,
    		addImageToMap,
    		addImagesToMap,
    		delayedAdd,
    		waitForMapToLoaded,
    		createInfoWindow,
    		div0_binding
    	];
    }

    class Map$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { params: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[2] === undefined && !("params" in props)) {
    			console_1$1.warn("<Map> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Home.svelte generated by Svelte v3.20.1 */
    const file$f = "src\\components\\Home.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (33:6) {#each facts as fact}
    function create_each_block_1(ctx) {
    	let div;
    	let current;

    	const fact = new Fact({
    			props: {
    				fact: /*fact*/ ctx[5],
    				hasDeleteButton: false,
    				hasAcceptButton: false
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(fact.$$.fragment);
    			attr_dev(div, "class", "fact svelte-13llbbo");
    			add_location(div, file$f, 33, 8, 1328);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(fact, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fact_changes = {};
    			if (dirty & /*facts*/ 1) fact_changes.fact = /*fact*/ ctx[5];
    			fact.$set(fact_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(fact);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(33:6) {#each facts as fact}",
    		ctx
    	});

    	return block;
    }

    // (39:8) <Label>
    function create_default_slot_3$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Show me all facts");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(39:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (38:6) <Button href="/facts" variant="raised" class="formButton">
    function create_default_slot_2$2(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(38:6) <Button href=\\\"/facts\\\" variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (44:6) {#each images as image}
    function create_each_block$2(ctx) {
    	let current;

    	const image = new Image$1({
    			props: {
    				image: /*image*/ ctx[2],
    				hasDeleteButton: false
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(image.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(image, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const image_changes = {};
    			if (dirty & /*images*/ 2) image_changes.image = /*image*/ ctx[2];
    			image.$set(image_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(image, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(44:6) {#each images as image}",
    		ctx
    	});

    	return block;
    }

    // (48:8) <Label>
    function create_default_slot_1$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Show me all images");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(48:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (47:6) <Button href="/images" variant="raised" class="formButton">
    function create_default_slot$5(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(47:6) <Button href=\\\"/images\\\" variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let div3;
    	let div1;
    	let h10;
    	let t2;
    	let t3;
    	let t4;
    	let div2;
    	let h11;
    	let t6;
    	let t7;
    	let current;
    	let each_value_1 = /*facts*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	const button0 = new Button_1({
    			props: {
    				href: "/facts",
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*images*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const button1 = new Button_1({
    			props: {
    				href: "/images",
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Newest facts";
    			t2 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			create_component(button0.$$.fragment);
    			t4 = space();
    			div2 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Newest image";
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			create_component(button1.$$.fragment);
    			attr_dev(div0, "id", "maskedLogo");
    			attr_dev(div0, "class", "svelte-13llbbo");
    			add_location(div0, file$f, 28, 2, 1186);
    			add_location(h10, file$f, 31, 6, 1268);
    			attr_dev(div1, "class", "list-item svelte-13llbbo");
    			add_location(div1, file$f, 30, 4, 1237);
    			add_location(h11, file$f, 42, 6, 1626);
    			attr_dev(div2, "class", "list-item svelte-13llbbo");
    			add_location(div2, file$f, 41, 4, 1595);
    			attr_dev(div3, "class", "list svelte-13llbbo");
    			add_location(div3, file$f, 29, 2, 1213);
    			attr_dev(div4, "class", "contentpadding");
    			add_location(div4, file$f, 26, 0, 1152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h10);
    			append_dev(div1, t2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div1, t3);
    			mount_component(button0, div1, null);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, h11);
    			append_dev(div2, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t7);
    			mount_component(button1, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*facts*/ 1) {
    				each_value_1 = /*facts*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div1, t3);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);

    			if (dirty & /*images*/ 2) {
    				each_value = /*images*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, t7);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			transition_in(button0.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(button0.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks_1, detaching);
    			destroy_component(button0);
    			destroy_each(each_blocks, detaching);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let facts = [];
    	let images = [];

    	onMount(async function () {
    		let factsObservable = await subscribeToNewestFacts();

    		factsObservable.subscribe(x => {
    			$$invalidate(0, facts = x);
    		});

    		let imageObservable = await subscribeToNewestImages();

    		imageObservable.subscribe(x => {
    			$$invalidate(1, images = x);
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);

    	$$self.$capture_state = () => ({
    		subscribeToNewestFacts,
    		subscribeToNewestImages,
    		Fact,
    		Image: Image$1,
    		Button: Button_1,
    		Label,
    		onMount,
    		facts,
    		images
    	});

    	$$self.$inject_state = $$props => {
    		if ("facts" in $$props) $$invalidate(0, facts = $$props.facts);
    		if ("images" in $$props) $$invalidate(1, images = $$props.images);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [facts, images];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    function makeRequest(url, method, body) {
      var request = new XMLHttpRequest();
      return new Promise(function (resolve, reject) {
        request.onreadystatechange = function () {
          if (request.readyState !== 4) return
          if (request.status >= 200 && request.status < 300) {
            resolve(request);
          } else {
            reject({
              status: request.status,
              statusText: request.statusText || request.responseText,
            });
          }
        };
        request.open(method || 'GET', url, true);
        body ? request.send(body) : request.send();
      })
    }
    function makeJsonRequest(url, method, jsonObj) {
      var request = new XMLHttpRequest();
      return new Promise(function (resolve, reject) {
        request.onreadystatechange = function () {
          if (request.readyState !== 4) return
          if (request.status >= 200 && request.status < 300) {
            resolve({ request, content: JSON.parse(request.responseText) });
          } else {
            reject({
              status: request.status,
              statusText: request.statusText || request.responseText,
            });
          }
        };
        request.open(method || 'GET', url, true);
        request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        jsonObj ? request.send(JSON.stringify(jsonObj)) : request.send();
      })
    }

    let registerPushUrl =
      'https://us-central1-burning-inferno-892.cloudfunctions.net/registerPush';
    let unregisterPushUrl =
      'https://us-central1-burning-inferno-892.cloudfunctions.net/unregisterPush';

    async function disablePush() {
      try {
        var subscription = await getCurrentSubscription();
        if (subscription == null) {
          return { sucess: true, msg: 'Push notifications disabled!' }
        }
        await deleteSubscriptionAtBackEnd(subscription);
        return { sucess: true, msg: 'Push notifications disabled!' }
      } catch (err) {
        console.log('Error on Push notifications disable', err);
        return { sucess: false, msg: 'Error on Push notifications disable' }
      }
    }

    async function enablePush() {
      try {
        let permissionResult = await askPushPermission();
        if (permissionResult !== 'granted') {
          return {
            success: false,
            msg: "Nope! Didn't work, ask Lurin how to solve this problem",
          }
        }
        let subscribeResult = await subscribeUserToPush();
        let parsedResult = JSON.parse(JSON.stringify(subscribeResult));

        await sendSubscriptionToBackEnd(parsedResult);
        return { success: true, msg: 'Push notifications enabled!' }
      } catch (err) {
        console.log('Error on Push notifications enable', err);
        return {
          sucess: true,
          msg:
            'Error on Push notifications enable, ask Lurin about the problem detail',
        }
      }
    }

    function getCurrentSubscription() {
      return registerServiceWorker().then(function (registration) {
        return registration.pushManager.getSubscription()
      })
    }

    function askPushPermission() {
      return new Promise(function (resolve, reject) {
        var permissionResult = Notification.requestPermission(function (result) {
          resolve(result);
        });
        if (permissionResult) {
          permissionResult.then(resolve, reject);
        }
      })
    }

    function subscribeUserToPush() {
      return registerServiceWorker()
        .then(function (registration) {
          var subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              'BM-ZWcNVEPPo8II2W2QCLBccS9jY0_VtKVlRu0vy9jj2vljPgPdQ6tgeVOS9E2OXoJn8Gf5HvySYBX8508rwyBg'
            ),
          };
          return registration.pushManager.subscribe(subscribeOptions)
        })
        .then(function (pushSubscription) {
          console.log(
            'Received PushSubscription: ',
            JSON.stringify(pushSubscription)
          );
          return pushSubscription
        })
    }

    function registerServiceWorker() {
      return navigator.serviceWorker
        .register('service-worker.js')
        .then(function (registration) {
          console.log('Service worker successfully registered.');
          return registration
        })
        .catch(function (err) {
          console.error('Unable to register service worker.', err);
        })
    }

    function sendSubscriptionToBackEnd(subscription) {
      subscription.info = 'lurinfacts.ch';

      return makeJsonRequest(registerPushUrl, 'POST', subscription).then(function (
        response
      ) {
        if (!(response.content.data && response.content.data.success)) {
          throw new Error('Bad response from server.', data)
        }
        return response.data
      })
    }

    function deleteSubscriptionAtBackEnd(subscription) {
      return makeJsonRequest(unregisterPushUrl, 'POST', subscription).then(
        function (response) {
          if (!(response.content.data && response.content.data.success)) {
            throw new Error('Bad response from server.', data)
          }
          return response.data
        }
      )
    }

    function urlBase64ToUint8Array(base64String) {
      let padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      let base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

      let rawData = window.atob(base64);
      let outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray
    }

    /* src\components\Settings.svelte generated by Svelte v3.20.1 */
    const file$g = "src\\components\\Settings.svelte";

    // (49:2) {:else}
    function create_else_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Sorry, your browser doesn't feature push notification. Ask lurin how to\r\n      download a real browser";
    			add_location(p, file$g, 49, 4, 1276);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(49:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:2) {#if isPushFeatured}
    function create_if_block$5(ctx) {
    	let t;
    	let current;

    	const button0 = new Button_1({
    			props: {
    				disabled: /*isWorking*/ ctx[0],
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[3]);

    	const button1 = new Button_1({
    			props: {
    				disabled: /*isWorking*/ ctx[0],
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};
    			if (dirty & /*isWorking*/ 1) button0_changes.disabled = /*isWorking*/ ctx[0];

    			if (dirty & /*$$scope*/ 32) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};
    			if (dirty & /*isWorking*/ 1) button1_changes.disabled = /*isWorking*/ ctx[0];

    			if (dirty & /*$$scope*/ 32) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(34:2) {#if isPushFeatured}",
    		ctx
    	});

    	return block;
    }

    // (40:6) <Label>
    function create_default_slot_3$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Disable");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$3.name,
    		type: "slot",
    		source: "(40:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (35:4) <Button        on:click={() => togglePush(true)}        disabled={isWorking}        variant="raised"        class="formButton">
    function create_default_slot_2$3(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_3$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(35:4) <Button        on:click={() => togglePush(true)}        disabled={isWorking}        variant=\\\"raised\\\"        class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (47:6) <Label>
    function create_default_slot_1$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Enable");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(47:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (42:4) <Button        on:click={() => togglePush(false)}        disabled={isWorking}        variant="raised"        class="formButton">
    function create_default_slot$6(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(42:4) <Button        on:click={() => togglePush(false)}        disabled={isWorking}        variant=\\\"raised\\\"        class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let p;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isPushFeatured*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Settings";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Push Notifications";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Get the latest and greatest news about lurins trips and wisdom.";
    			t5 = space();
    			if_block.c();
    			add_location(h1, file$g, 29, 2, 755);
    			add_location(h2, file$g, 31, 2, 778);
    			add_location(p, file$g, 32, 2, 809);
    			attr_dev(div, "class", "contentpadding");
    			add_location(div, file$g, 28, 0, 723);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(div, t3);
    			append_dev(div, p);
    			append_dev(div, t5);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let isWorking = false;
    	let isPushFeatured = "serviceWorker" in navigator && "PushManager" in window;

    	async function togglePush(disable) {
    		$$invalidate(0, isWorking = true);
    		var result = "";

    		if (disable) {
    			result = await disablePush();
    		} else {
    			result = await enablePush();
    		}

    		notify(result.msg);
    		$$invalidate(0, isWorking = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Settings", $$slots, []);
    	const click_handler = () => togglePush(true);
    	const click_handler_1 = () => togglePush(false);

    	$$self.$capture_state = () => ({
    		disablePush,
    		enablePush,
    		getCurrentSubscription,
    		notify,
    		Button: Button_1,
    		Label,
    		isWorking,
    		isPushFeatured,
    		togglePush
    	});

    	$$self.$inject_state = $$props => {
    		if ("isWorking" in $$props) $$invalidate(0, isWorking = $$props.isWorking);
    		if ("isPushFeatured" in $$props) $$invalidate(1, isPushFeatured = $$props.isPushFeatured);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isWorking, isPushFeatured, togglePush, click_handler, click_handler_1];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    function resizeImage(src, size) {
      return loadImage(src).then((img) => {
        return resizeLoadedImage(img, size);
      });
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function onload() {
          resolve(img);
        };
        img.onerror = function onerror(e) {
          reject(e);
        };
        img.src = src;
      });
    }

    var resizeLoadedImage = function (image, size) {
      var mainCanvas = document.createElement("canvas");
      //portrait or landscape image?
      mainCanvas.width = image.width;
      mainCanvas.height = image.height;
      var ctx = mainCanvas.getContext("2d");
      ctx.drawImage(image, 0, 0, mainCanvas.width, mainCanvas.height);
      //size = parseInt($('#size').get(0).value, 10);
      while (mainCanvas.width > size || mainCanvas.height > size) {
        mainCanvas = halfSize(mainCanvas);
      }
      return mainCanvas.toDataURL("image/jpeg");
    };

    /*
     * Draw initial canvas on new canvas and half it's size
     */
    var halfSize = function (i) {
      var canvas = document.createElement("canvas");
      canvas.width = i.width / 2;
      canvas.height = i.height / 2;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(i, 0, 0, canvas.width, canvas.height);
      return canvas;
    };

    function getOrientationFromArrayBuffer(arrayBuffer) {
      const view = new DataView(arrayBuffer);
      if (view.getUint16(0, false) !== 0xffd8) {
        return -2;
      }
      const length = view.byteLength;
      let offset = 2;
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) return -1;
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xffe1) {
          offset += 2;
          if (view.getUint32(offset, false) !== 0x45786966) {
            return -1;
          }

          const little = view.getUint16((offset += 6), false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;
          for (let i = 0; i < tags; i += 1) {
            if (view.getUint16(offset + i * 12, little) === 0x0112) {
              return view.getUint16(offset + i * 12 + 8, little);
            }
          }
          // eslint-disable-next-line no-bitwise
        } else if ((marker & 0xff00) !== 0xff00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      return -1;
    }

    function getOrientationNumber(fileBlob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function loaded(e) {
          resolve(getOrientationFromArrayBuffer(e.target.result));
        };
        reader.onerror = function error(e) {
          reject(e);
        };
        reader.readAsArrayBuffer(fileBlob);
      });
    }

    function getOrientation(fileBlob) {
      return getOrientationNumber(fileBlob).then((orientation) => {
        let degree = 0;
        switch (orientation) {
          case 1:
          case 2:
            degree = 0;
            break;
          case 3:
          case 4:
            degree = 180;
            break;
          case 5:
          case 6:
            degree = 90;
            break;
          case 7:
          case 8:
            degree = 270;
            break;
          default:
            degree = 0;
            break;
        }
        return { degree, orientation };
      });
    }

    function rotatePhoto(file, degree) {
      return loadImage(file).then((image) => {
        const canvas = document.createElement("canvas");
        const canvasContext = canvas.getContext("2d");

        switch (degree) {
          default:
          case 0:
            canvas.setAttribute("width", image.width);
            canvas.setAttribute("height", image.height);
            canvasContext.rotate((degree * Math.PI) / 180);
            canvasContext.drawImage(image, 0, 0);
            break;
          case 90:
            canvas.setAttribute("width", image.height);
            canvas.setAttribute("height", image.width);
            canvasContext.rotate((degree * Math.PI) / 180);
            canvasContext.drawImage(image, 0, -image.height);
            break;
          case 180:
            canvas.setAttribute("width", image.width);
            canvas.setAttribute("height", image.height);
            canvasContext.rotate((degree * Math.PI) / 180);
            canvasContext.drawImage(image, -image.width, -image.height);
            break;
          case 270:
          case -90:
            canvas.setAttribute("width", image.height);
            canvas.setAttribute("height", image.width);
            canvasContext.rotate((degree * Math.PI) / 180);
            canvasContext.drawImage(image, -image.width, 0);
            break;
        }
        return canvas.toDataURL("image/jpeg");
      });
    }

    function min(val, args) {
      const minValue = parseFloat(args[0]);
      const value = isNaN(val) ? val.length : parseFloat(val);

      return value >= minValue;
    }

    function max(val, args) {
      const maxValue = parseFloat(args[0]);
      const value = isNaN(val) ? val.length : parseFloat(val);

      return isNaN(value) ? true : value <= maxValue;
    }

    function between(val, args) {
      return min(val, [args[0]]) && max(val, [args[1]]);
    }

    function email(val, args) {
      const regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      return val && regex.test(val);
    }

    function required(val, args) {
      if (val === undefined || val === null) return false;

      if (typeof val === 'string') {
        const tmp = val.replace(/\s/g, "");

        return tmp.length > 0;
      }

      return true;
    }

    function url(val, args) {
      const regex = /(https?|ftp|git|svn):\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,63}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
      return regex.test(val);
    }

    function equal(val, args) {
      return val === args[0];
    }

    var rules = /*#__PURE__*/Object.freeze({
        __proto__: null,
        between: between,
        email: email,
        max: max,
        min: min,
        required: required,
        url: url,
        equal: equal
    });

    function getValue(field) {
      return field.value;
    }

    function isPromise(obj) {
      // Standard promise API always has a `then` method
      return !!obj.then;
    }

    function validate(value, { field, validator, observable, enabled }) {
      let valid = true;
      let pending = false;
      let rule;

      if (enabled === false) {
        return [valid, pending, rule];
      }
      else if (typeof validator === 'function') {
        const resp = validator.call(null, value);

        if (isPromise(resp)) {
          pending = true;
          resp.then(({ name, valid }) => {
            observable.update(n => {
              n[field] = n[field] || { errors: [] };

              n[field].pending = false;
              n[field].valid = valid;

              if (!valid) {
                n[field].errors.push(rule);
              }

              return n;
            });
          });
        } else {
          valid = resp.valid;
          rule = resp.name;
        }
      } else {
        const params = validator.split(/:/g);
        rule = params.shift();
        valid = rules[rule].call(null, value, params);
      }

      return [valid, rule, pending];
    }

    function field(name, config, observable, { stopAtFirstError }) {
        const { value, validators = [], enabled = true } = config;
        let valid = true;
        let pending = false;
        let errors = [];

        if (enabled) {
          for (let i = 0; i < validators.length; i++) {
            const [isValid, rule, isPending] = validate(value, { field: name, validator: validators[i], observable });
      
            if (!pending && isPending) {
              pending = true;
            }
            
            if (!isValid) {
              valid = false;
              errors = [...errors, rule];
      
              if (stopAtFirstError) break;
            }
          }
        }

        return { valid, errors, pending };
    }

    function form(fn, config = {}) {
      const storeValue = writable({ oldValues: {}, dirty: false  });
      const { subscribe, set, update } = storeValue;
      config = Object.assign({ initCheck: true, validateOnChange: true, stopAtFirstError: true}, config);
      
      if (config.validateOnChange) {
        afterUpdate(() => walkThroughFields(fn, storeValue, config));
      }


      if (config.initCheck) {
        walkThroughFields(fn, storeValue, config);
      }

      return {
        subscribe, set, update,

        validate() {
          walkThroughFields(fn, storeValue, config);  
        }
      };
    }

    function walkThroughFields(fn, observable, config) {
      const fields = fn.call();
      const returnedObject = { oldValues: {}, dirty: false };
      const context = get_store_value(observable);

      returnedObject.dirty = context.dirty;

      Object.keys(fields).forEach(key => {
        const value = getValue(fields[key]);
        const enabled = fields[key].enabled;
        const oldValue = context.oldValues[key] || { value: undefined, enabled: true };

        if (enabled !== oldValue.enabled || value !== oldValue.value) {
          returnedObject[key] = field(key, fields[key], observable, config);
        }
        else {
          returnedObject[key] = context[key];
            
          if (!enabled) {
            returnedObject[key].valid = true;
            returnedObject[key].errors = [];
          }
        }

        returnedObject.oldValues[key] = { value, enabled };
        
        if (!context.dirty && oldValue.value !== undefined && value !== oldValue.value) {
          returnedObject.dirty = true;
        }
      });

      returnedObject.valid = !Object.keys(returnedObject).find(f => {
        if (['oldValues', 'dirty'].includes(f)) return false;
        return !returnedObject[f].valid;
      });

      observable.set(returnedObject);
    }

    var key = 'AIzaSyC0P3kNpRrvnXLbNXLx4D033Fz0ttPsgkI';
    var baseUrl = 'https://maps.google.com/maps/api/geocode/json?&key=' + key;

    async function getPositionByCoords(lat, lng) {
      var geoUrl = baseUrl + '&latlng=' + lat + ',' + lng;
      return geoCodeService(geoUrl)
    }

    async function getPositionByAddress(address) {
      var geoUrl = baseUrl + '&address=' + address;
      return geoCodeService(geoUrl)
    }

    async function geoCodeService(geoUrl) {
      let data = await makeRequest(geoUrl);
      let json = JSON.parse(data.responseText);

      console.log(json);
      if (json.results.length > 0) {
        var res0 = json.results[0];
        var location = {
          latitude: res0.geometry.location.lat,
          longitude: res0.geometry.location.lng,
          address: res0.formatted_address,
          country:
            res0.address_components[res0.address_components.length - 2].long_name,
        };
        return location
      }
      return null
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$5 = {
        NATIVE_CONTROL_SELECTOR: '.mdc-radio__native-control',
    };
    var cssClasses$3 = {
        DISABLED: 'mdc-radio--disabled',
        ROOT: 'mdc-radio',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCRadioFoundation = /** @class */ (function (_super) {
        __extends(MDCRadioFoundation, _super);
        function MDCRadioFoundation(adapter) {
            return _super.call(this, __assign({}, MDCRadioFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCRadioFoundation, "cssClasses", {
            get: function () {
                return cssClasses$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRadioFoundation, "strings", {
            get: function () {
                return strings$5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRadioFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    setNativeControlDisabled: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCRadioFoundation.prototype.setDisabled = function (disabled) {
            var DISABLED = MDCRadioFoundation.cssClasses.DISABLED;
            this.adapter_.setNativeControlDisabled(disabled);
            if (disabled) {
                this.adapter_.addClass(DISABLED);
            }
            else {
                this.adapter_.removeClass(DISABLED);
            }
        };
        return MDCRadioFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCRadio = /** @class */ (function (_super) {
        __extends(MDCRadio, _super);
        function MDCRadio() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.ripple_ = _this.createRipple_();
            return _this;
        }
        MDCRadio.attachTo = function (root) {
            return new MDCRadio(root);
        };
        Object.defineProperty(MDCRadio.prototype, "checked", {
            get: function () {
                return this.nativeControl_.checked;
            },
            set: function (checked) {
                this.nativeControl_.checked = checked;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRadio.prototype, "disabled", {
            get: function () {
                return this.nativeControl_.disabled;
            },
            set: function (disabled) {
                this.foundation_.setDisabled(disabled);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRadio.prototype, "value", {
            get: function () {
                return this.nativeControl_.value;
            },
            set: function (value) {
                this.nativeControl_.value = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRadio.prototype, "ripple", {
            get: function () {
                return this.ripple_;
            },
            enumerable: true,
            configurable: true
        });
        MDCRadio.prototype.destroy = function () {
            this.ripple_.destroy();
            _super.prototype.destroy.call(this);
        };
        MDCRadio.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                setNativeControlDisabled: function (disabled) { return _this.nativeControl_.disabled = disabled; },
            };
            return new MDCRadioFoundation(adapter);
        };
        MDCRadio.prototype.createRipple_ = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = __assign({}, MDCRipple.createAdapter(this), { registerInteractionHandler: function (evtType, handler) { return _this.nativeControl_.addEventListener(evtType, handler, applyPassive()); }, deregisterInteractionHandler: function (evtType, handler) { return _this.nativeControl_.removeEventListener(evtType, handler, applyPassive()); }, 
                // Radio buttons technically go "active" whenever there is *any* keyboard interaction.
                // This is not the UI we desire.
                isSurfaceActive: function () { return false; }, isUnbounded: function () { return true; } });
            // tslint:enable:object-literal-sort-keys
            return new MDCRipple(this.root_, new MDCRippleFoundation(adapter));
        };
        Object.defineProperty(MDCRadio.prototype, "nativeControl_", {
            get: function () {
                var NATIVE_CONTROL_SELECTOR = MDCRadioFoundation.strings.NATIVE_CONTROL_SELECTOR;
                var el = this.root_.querySelector(NATIVE_CONTROL_SELECTOR);
                if (!el) {
                    throw new Error("Radio component requires a " + NATIVE_CONTROL_SELECTOR + " element");
                }
                return el;
            },
            enumerable: true,
            configurable: true
        });
        return MDCRadio;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    function prefixFilter(obj, prefix) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (name.substring(0, prefix.length) === prefix) {
          newObj[name.substring(prefix.length)] = obj[name];
        }
      }

      return newObj;
    }

    /* node_modules\@smui\radio\Radio.svelte generated by Svelte v3.20.1 */
    const file$h = "node_modules\\@smui\\radio\\Radio.svelte";

    function create_fragment$j(ctx) {
    	let div3;
    	let input;
    	let useActions_action;
    	let t0;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let useActions_action_1;
    	let forwardEvents_action;
    	let dispose;

    	let input_levels = [
    		{
    			value: /*valueKey*/ ctx[4] === /*uninitializedValue*/ ctx[10]
    			? /*value*/ ctx[3]
    			: /*valueKey*/ ctx[4]
    		},
    		{ type: "radio" },
    		/*inputProps*/ ctx[11],
    		{ disabled: /*disabled*/ ctx[2] },
    		{
    			class: "mdc-radio__native-control " + /*input$class*/ ctx[6]
    		},
    		{ checked: /*checked*/ ctx[8] },
    		exclude(prefixFilter(/*$$props*/ ctx[13], "input$"), ["use", "class"])
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	let div3_levels = [
    		{
    			class: "\n    mdc-radio\n    " + /*className*/ ctx[1] + "\n    " + (/*disabled*/ ctx[2] ? "mdc-radio--disabled" : "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[13], ["use", "class", "disabled", "group", "value", "valueKey", "input$"])
    	];

    	let div3_data = {};

    	for (let i = 0; i < div3_levels.length; i += 1) {
    		div3_data = assign(div3_data, div3_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			input = element("input");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			set_attributes(input, input_data);
    			add_location(input, file$h, 11, 2, 256);
    			attr_dev(div0, "class", "mdc-radio__outer-circle");
    			add_location(div0, file$h, 24, 4, 642);
    			attr_dev(div1, "class", "mdc-radio__inner-circle");
    			add_location(div1, file$h, 25, 4, 690);
    			attr_dev(div2, "class", "mdc-radio__background");
    			add_location(div2, file$h, 23, 2, 602);
    			set_attributes(div3, div3_data);
    			add_location(div3, file$h, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, input);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			/*div3_binding*/ ctx[21](div3);
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, input, /*input$use*/ ctx[5])),
    				listen_dev(input, "change", /*handleChange*/ ctx[12], false, false, false),
    				listen_dev(input, "change", /*change_handler*/ ctx[19], false, false, false),
    				listen_dev(input, "input", /*input_handler*/ ctx[20], false, false, false),
    				action_destroyer(useActions_action_1 = useActions.call(null, div3, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[9].call(null, div3))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			set_attributes(input, get_spread_update(input_levels, [
    				dirty & /*valueKey, uninitializedValue, value*/ 1048 && {
    					value: /*valueKey*/ ctx[4] === /*uninitializedValue*/ ctx[10]
    					? /*value*/ ctx[3]
    					: /*valueKey*/ ctx[4]
    				},
    				{ type: "radio" },
    				dirty & /*inputProps*/ 2048 && /*inputProps*/ ctx[11],
    				dirty & /*disabled*/ 4 && { disabled: /*disabled*/ ctx[2] },
    				dirty & /*input$class*/ 64 && {
    					class: "mdc-radio__native-control " + /*input$class*/ ctx[6]
    				},
    				dirty & /*checked*/ 256 && { checked: /*checked*/ ctx[8] },
    				dirty & /*exclude, prefixFilter, $$props*/ 8192 && exclude(prefixFilter(/*$$props*/ ctx[13], "input$"), ["use", "class"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*input$use*/ 32) useActions_action.update.call(null, /*input$use*/ ctx[5]);

    			set_attributes(div3, get_spread_update(div3_levels, [
    				dirty & /*className, disabled*/ 6 && {
    					class: "\n    mdc-radio\n    " + /*className*/ ctx[1] + "\n    " + (/*disabled*/ ctx[2] ? "mdc-radio--disabled" : "") + "\n  "
    				},
    				dirty & /*exclude, $$props*/ 8192 && exclude(/*$$props*/ ctx[13], ["use", "class", "disabled", "group", "value", "valueKey", "input$"])
    			]));

    			if (useActions_action_1 && is_function(useActions_action_1.update) && dirty & /*use*/ 1) useActions_action_1.update.call(null, /*use*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*div3_binding*/ ctx[21](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);

    	let uninitializedValue = () => {
    		
    	};

    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { group = null } = $$props;
    	let { value = null } = $$props;
    	let { valueKey = uninitializedValue } = $$props;
    	let { input$use = [] } = $$props;
    	let { input$class = "" } = $$props;
    	let element;
    	let radio;
    	let formField = getContext("SMUI:form-field");
    	let inputProps = getContext("SMUI:generic:input:props") || {};
    	let setChecked = getContext("SMUI:generic:input:setChecked");

    	onMount(() => {
    		$$invalidate(16, radio = new MDCRadio(element));

    		if (formField && formField()) {
    			formField().input = radio;
    		}
    	});

    	onDestroy(() => {
    		radio && radio.destroy();
    	});

    	function handleChange(e) {
    		if (radio.checked) {
    			$$invalidate(14, group = value);
    		}
    	}

    	function getId() {
    		return inputProps && inputProps.id;
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Radio", $$slots, []);

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("disabled" in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("group" in $$new_props) $$invalidate(14, group = $$new_props.group);
    		if ("value" in $$new_props) $$invalidate(3, value = $$new_props.value);
    		if ("valueKey" in $$new_props) $$invalidate(4, valueKey = $$new_props.valueKey);
    		if ("input$use" in $$new_props) $$invalidate(5, input$use = $$new_props.input$use);
    		if ("input$class" in $$new_props) $$invalidate(6, input$class = $$new_props.input$class);
    	};

    	$$self.$capture_state = () => ({
    		MDCRadio,
    		onMount,
    		onDestroy,
    		getContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		prefixFilter,
    		useActions,
    		forwardEvents,
    		uninitializedValue,
    		use,
    		className,
    		disabled,
    		group,
    		value,
    		valueKey,
    		input$use,
    		input$class,
    		element,
    		radio,
    		formField,
    		inputProps,
    		setChecked,
    		handleChange,
    		getId,
    		checked
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("uninitializedValue" in $$props) $$invalidate(10, uninitializedValue = $$new_props.uninitializedValue);
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("group" in $$props) $$invalidate(14, group = $$new_props.group);
    		if ("value" in $$props) $$invalidate(3, value = $$new_props.value);
    		if ("valueKey" in $$props) $$invalidate(4, valueKey = $$new_props.valueKey);
    		if ("input$use" in $$props) $$invalidate(5, input$use = $$new_props.input$use);
    		if ("input$class" in $$props) $$invalidate(6, input$class = $$new_props.input$class);
    		if ("element" in $$props) $$invalidate(7, element = $$new_props.element);
    		if ("radio" in $$props) $$invalidate(16, radio = $$new_props.radio);
    		if ("formField" in $$props) formField = $$new_props.formField;
    		if ("inputProps" in $$props) $$invalidate(11, inputProps = $$new_props.inputProps);
    		if ("setChecked" in $$props) $$invalidate(18, setChecked = $$new_props.setChecked);
    		if ("checked" in $$props) $$invalidate(8, checked = $$new_props.checked);
    	};

    	let checked;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*group, value*/ 16392) {
    			 $$invalidate(8, checked = group === value);
    		}

    		if ($$self.$$.dirty & /*checked*/ 256) {
    			 if (setChecked) {
    				setChecked(checked);
    			}
    		}

    		if ($$self.$$.dirty & /*radio, checked*/ 65792) {
    			 if (radio && radio.checked !== checked) {
    				$$invalidate(16, radio.checked = checked, radio);
    			}
    		}

    		if ($$self.$$.dirty & /*radio, disabled*/ 65540) {
    			 if (radio && radio.disabled !== disabled) {
    				$$invalidate(16, radio.disabled = disabled, radio);
    			}
    		}

    		if ($$self.$$.dirty & /*radio, valueKey, value*/ 65560) {
    			 if (radio && valueKey === uninitializedValue && radio.value !== value) {
    				$$invalidate(16, radio.value = value, radio);
    			}
    		}

    		if ($$self.$$.dirty & /*radio, valueKey*/ 65552) {
    			 if (radio && valueKey !== uninitializedValue && radio.value !== valueKey) {
    				$$invalidate(16, radio.value = valueKey, radio);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		disabled,
    		value,
    		valueKey,
    		input$use,
    		input$class,
    		element,
    		checked,
    		forwardEvents,
    		uninitializedValue,
    		inputProps,
    		handleChange,
    		$$props,
    		group,
    		getId,
    		radio,
    		formField,
    		setChecked,
    		change_handler,
    		input_handler,
    		div3_binding
    	];
    }

    class Radio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {
    			use: 0,
    			class: 1,
    			disabled: 2,
    			group: 14,
    			value: 3,
    			valueKey: 4,
    			input$use: 5,
    			input$class: 6,
    			getId: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Radio",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get use() {
    		throw new Error("<Radio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Radio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Radio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get group() {
    		throw new Error("<Radio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set group(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Radio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueKey() {
    		throw new Error("<Radio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueKey(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get input$use() {
    		throw new Error("<Radio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set input$use(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get input$class() {
    		throw new Error("<Radio>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set input$class(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getId() {
    		return this.$$.ctx[15];
    	}

    	set getId(value) {
    		throw new Error("<Radio>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$4 = {
        ROOT: 'mdc-form-field',
    };
    var strings$6 = {
        LABEL_SELECTOR: '.mdc-form-field > label',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFormFieldFoundation = /** @class */ (function (_super) {
        __extends(MDCFormFieldFoundation, _super);
        function MDCFormFieldFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCFormFieldFoundation.defaultAdapter, adapter)) || this;
            _this.clickHandler_ = function () { return _this.handleClick_(); };
            return _this;
        }
        Object.defineProperty(MDCFormFieldFoundation, "cssClasses", {
            get: function () {
                return cssClasses$4;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFormFieldFoundation, "strings", {
            get: function () {
                return strings$6;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFormFieldFoundation, "defaultAdapter", {
            get: function () {
                return {
                    activateInputRipple: function () { return undefined; },
                    deactivateInputRipple: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    registerInteractionHandler: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCFormFieldFoundation.prototype.init = function () {
            this.adapter_.registerInteractionHandler('click', this.clickHandler_);
        };
        MDCFormFieldFoundation.prototype.destroy = function () {
            this.adapter_.deregisterInteractionHandler('click', this.clickHandler_);
        };
        MDCFormFieldFoundation.prototype.handleClick_ = function () {
            var _this = this;
            this.adapter_.activateInputRipple();
            requestAnimationFrame(function () { return _this.adapter_.deactivateInputRipple(); });
        };
        return MDCFormFieldFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFormField = /** @class */ (function (_super) {
        __extends(MDCFormField, _super);
        function MDCFormField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCFormField.attachTo = function (root) {
            return new MDCFormField(root);
        };
        Object.defineProperty(MDCFormField.prototype, "input", {
            get: function () {
                return this.input_;
            },
            set: function (input) {
                this.input_ = input;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFormField.prototype, "label_", {
            get: function () {
                var LABEL_SELECTOR = MDCFormFieldFoundation.strings.LABEL_SELECTOR;
                return this.root_.querySelector(LABEL_SELECTOR);
            },
            enumerable: true,
            configurable: true
        });
        MDCFormField.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                activateInputRipple: function () {
                    if (_this.input_ && _this.input_.ripple) {
                        _this.input_.ripple.activate();
                    }
                },
                deactivateInputRipple: function () {
                    if (_this.input_ && _this.input_.ripple) {
                        _this.input_.ripple.deactivate();
                    }
                },
                deregisterInteractionHandler: function (evtType, handler) {
                    if (_this.label_) {
                        _this.label_.removeEventListener(evtType, handler);
                    }
                },
                registerInteractionHandler: function (evtType, handler) {
                    if (_this.label_) {
                        _this.label_.addEventListener(evtType, handler);
                    }
                },
            };
            return new MDCFormFieldFoundation(adapter);
        };
        return MDCFormField;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules\@smui\form-field\FormField.svelte generated by Svelte v3.20.1 */
    const file$i = "node_modules\\@smui\\form-field\\FormField.svelte";
    const get_label_slot_changes = dirty => ({});
    const get_label_slot_context = ctx => ({});

    function create_fragment$k(ctx) {
    	let div;
    	let t;
    	let label;
    	let useActions_action;
    	let useActions_action_1;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);
    	const label_slot_template = /*$$slots*/ ctx[10].label;
    	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[9], get_label_slot_context);

    	let label_levels = [
    		{ for: /*inputId*/ ctx[3] },
    		exclude(prefixFilter(/*$$props*/ ctx[7], "label$"), ["use"])
    	];

    	let label_data = {};

    	for (let i = 0; i < label_levels.length; i += 1) {
    		label_data = assign(label_data, label_levels[i]);
    	}

    	let div_levels = [
    		{
    			class: "\n    mdc-form-field\n    " + /*className*/ ctx[1] + "\n    " + (/*align*/ ctx[2] === "end"
    			? "mdc-form-field--align-end"
    			: "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[7], ["use", "class", "alignEnd", "inputId", "label$"])
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			label = element("label");
    			if (label_slot) label_slot.c();
    			set_attributes(label, label_data);
    			add_location(label, file$i, 12, 2, 271);
    			set_attributes(div, div_data);
    			add_location(div, file$i, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t);
    			append_dev(div, label);

    			if (label_slot) {
    				label_slot.m(label, null);
    			}

    			/*div_binding*/ ctx[11](div);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, label, /*label$use*/ ctx[4])),
    				action_destroyer(useActions_action_1 = useActions.call(null, div, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[6].call(null, div))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[9], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null));
    				}
    			}

    			if (label_slot) {
    				if (label_slot.p && dirty & /*$$scope*/ 512) {
    					label_slot.p(get_slot_context(label_slot_template, ctx, /*$$scope*/ ctx[9], get_label_slot_context), get_slot_changes(label_slot_template, /*$$scope*/ ctx[9], dirty, get_label_slot_changes));
    				}
    			}

    			set_attributes(label, get_spread_update(label_levels, [
    				dirty & /*inputId*/ 8 && { for: /*inputId*/ ctx[3] },
    				dirty & /*exclude, prefixFilter, $$props*/ 128 && exclude(prefixFilter(/*$$props*/ ctx[7], "label$"), ["use"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*label$use*/ 16) useActions_action.update.call(null, /*label$use*/ ctx[4]);

    			set_attributes(div, get_spread_update(div_levels, [
    				dirty & /*className, align*/ 6 && {
    					class: "\n    mdc-form-field\n    " + /*className*/ ctx[1] + "\n    " + (/*align*/ ctx[2] === "end"
    					? "mdc-form-field--align-end"
    					: "") + "\n  "
    				},
    				dirty & /*exclude, $$props*/ 128 && exclude(/*$$props*/ ctx[7], ["use", "class", "alignEnd", "inputId", "label$"])
    			]));

    			if (useActions_action_1 && is_function(useActions_action_1.update) && dirty & /*use*/ 1) useActions_action_1.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(label_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(label_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (label_slot) label_slot.d(detaching);
    			/*div_binding*/ ctx[11](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let counter = 0;

    function instance$k($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { align = "start" } = $$props;
    	let { inputId = "SMUI-form-field-" + counter++ } = $$props;
    	let { label$use = [] } = $$props;
    	let element;
    	let formField;
    	setContext("SMUI:form-field", () => formField);
    	setContext("SMUI:generic:input:props", { id: inputId });

    	onMount(() => {
    		formField = new MDCFormField(element);
    	});

    	onDestroy(() => {
    		formField && formField.destroy();
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("FormField", $$slots, ['default','label']);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(5, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("align" in $$new_props) $$invalidate(2, align = $$new_props.align);
    		if ("inputId" in $$new_props) $$invalidate(3, inputId = $$new_props.inputId);
    		if ("label$use" in $$new_props) $$invalidate(4, label$use = $$new_props.label$use);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		counter,
    		MDCFormField,
    		onMount,
    		onDestroy,
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		prefixFilter,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		align,
    		inputId,
    		label$use,
    		element,
    		formField
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("align" in $$props) $$invalidate(2, align = $$new_props.align);
    		if ("inputId" in $$props) $$invalidate(3, inputId = $$new_props.inputId);
    		if ("label$use" in $$props) $$invalidate(4, label$use = $$new_props.label$use);
    		if ("element" in $$props) $$invalidate(5, element = $$new_props.element);
    		if ("formField" in $$props) formField = $$new_props.formField;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		align,
    		inputId,
    		label$use,
    		element,
    		forwardEvents,
    		$$props,
    		formField,
    		$$scope,
    		$$slots,
    		div_binding
    	];
    }

    class FormField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {
    			use: 0,
    			class: 1,
    			align: 2,
    			inputId: 3,
    			label$use: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormField",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get use() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputId() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputId(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label$use() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label$use(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\LocationSelector.svelte generated by Svelte v3.20.1 */

    const { console: console_1$2 } = globals;
    const file$j = "src\\components\\LocationSelector.svelte";

    // (132:6) <span slot="label">
    function create_label_slot_2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "By address";
    			attr_dev(span, "slot", "label");
    			add_location(span, file$j, 131, 6, 3732);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_label_slot_2.name,
    		type: "slot",
    		source: "(132:6) <span slot=\\\"label\\\">",
    		ctx
    	});

    	return block;
    }

    // (127:4) <FormField>
    function create_default_slot_5$1(ctx) {
    	let updating_group;
    	let t;
    	let current;

    	function radio_group_binding(value) {
    		/*radio_group_binding*/ ctx[12].call(null, value);
    	}

    	let radio_props = { value: "address" };

    	if (/*selectedOption*/ ctx[2] !== void 0) {
    		radio_props.group = /*selectedOption*/ ctx[2];
    	}

    	const radio = new Radio({ props: radio_props, $$inline: true });
    	binding_callbacks.push(() => bind(radio, "group", radio_group_binding));
    	radio.$on("change", /*optionChanged*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(radio.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(radio, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const radio_changes = {};

    			if (!updating_group && dirty & /*selectedOption*/ 4) {
    				updating_group = true;
    				radio_changes.group = /*selectedOption*/ ctx[2];
    				add_flush_callback(() => updating_group = false);
    			}

    			radio.$set(radio_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(radio.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(radio.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(radio, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(127:4) <FormField>",
    		ctx
    	});

    	return block;
    }

    // (139:6) <span slot="label">
    function create_label_slot_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "By map location";
    			attr_dev(span, "slot", "label");
    			add_location(span, file$j, 138, 6, 3914);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_label_slot_1.name,
    		type: "slot",
    		source: "(139:6) <span slot=\\\"label\\\">",
    		ctx
    	});

    	return block;
    }

    // (134:4) <FormField>
    function create_default_slot_4$2(ctx) {
    	let updating_group;
    	let t;
    	let current;

    	function radio_group_binding_1(value) {
    		/*radio_group_binding_1*/ ctx[13].call(null, value);
    	}

    	let radio_props = { value: "map" };

    	if (/*selectedOption*/ ctx[2] !== void 0) {
    		radio_props.group = /*selectedOption*/ ctx[2];
    	}

    	const radio = new Radio({ props: radio_props, $$inline: true });
    	binding_callbacks.push(() => bind(radio, "group", radio_group_binding_1));
    	radio.$on("change", /*optionChanged*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(radio.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(radio, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const radio_changes = {};

    			if (!updating_group && dirty & /*selectedOption*/ 4) {
    				updating_group = true;
    				radio_changes.group = /*selectedOption*/ ctx[2];
    				add_flush_callback(() => updating_group = false);
    			}

    			radio.$set(radio_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(radio.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(radio.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(radio, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$2.name,
    		type: "slot",
    		source: "(134:4) <FormField>",
    		ctx
    	});

    	return block;
    }

    // (146:6) <span slot="label">
    function create_label_slot(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Device location";
    			attr_dev(span, "slot", "label");
    			add_location(span, file$j, 145, 6, 4104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_label_slot.name,
    		type: "slot",
    		source: "(146:6) <span slot=\\\"label\\\">",
    		ctx
    	});

    	return block;
    }

    // (141:4) <FormField>
    function create_default_slot_3$4(ctx) {
    	let updating_group;
    	let t;
    	let current;

    	function radio_group_binding_2(value) {
    		/*radio_group_binding_2*/ ctx[14].call(null, value);
    	}

    	let radio_props = { value: "device" };

    	if (/*selectedOption*/ ctx[2] !== void 0) {
    		radio_props.group = /*selectedOption*/ ctx[2];
    	}

    	const radio = new Radio({ props: radio_props, $$inline: true });
    	binding_callbacks.push(() => bind(radio, "group", radio_group_binding_2));
    	radio.$on("change", /*optionChanged*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(radio.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(radio, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const radio_changes = {};

    			if (!updating_group && dirty & /*selectedOption*/ 4) {
    				updating_group = true;
    				radio_changes.group = /*selectedOption*/ ctx[2];
    				add_flush_callback(() => updating_group = false);
    			}

    			radio.$set(radio_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(radio.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(radio.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(radio, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$4.name,
    		type: "slot",
    		source: "(141:4) <FormField>",
    		ctx
    	});

    	return block;
    }

    // (172:36) 
    function create_if_block_3(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Choose by map";
    			t1 = space();
    			div0 = element("div");
    			add_location(h3, file$j, 173, 6, 5018);
    			attr_dev(div0, "id", "map");
    			attr_dev(div0, "class", "svelte-1cab58i");
    			add_location(div0, file$j, 174, 6, 5047);
    			add_location(div1, file$j, 172, 4, 5006);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[16](div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*div0_binding*/ ctx[16](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(172:36) ",
    		ctx
    	});

    	return block;
    }

    // (164:39) 
    function create_if_block_2(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let t2;
    	let span;
    	let t3_value = /*locationOfDevice*/ ctx[4].msg + "";
    	let t3;
    	let current;

    	const icon = new Icon({
    			props: {
    				class: "material-icons",
    				style: "vertical-align: text-bottom",
    				$$slots: { default: [create_default_slot_2$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Choose by device";
    			t1 = space();
    			create_component(icon.$$.fragment);
    			t2 = space();
    			span = element("span");
    			t3 = text(t3_value);
    			add_location(h3, file$j, 165, 6, 4768);
    			add_location(span, file$j, 169, 6, 4918);
    			add_location(div, file$j, 164, 4, 4756);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			mount_component(icon, div, null);
    			append_dev(div, t2);
    			append_dev(div, span);
    			append_dev(span, t3);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope, locationOfDevice*/ 131088) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    			if ((!current || dirty & /*locationOfDevice*/ 16) && t3_value !== (t3_value = /*locationOfDevice*/ ctx[4].msg + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(164:39) ",
    		ctx
    	});

    	return block;
    }

    // (150:2) {#if selectedOption == 'address'}
    function create_if_block_1$2(ctx) {
    	let div2;
    	let h3;
    	let t1;
    	let div0;
    	let label;
    	let t3;
    	let input;
    	let t4;
    	let t5;
    	let div1;
    	let current;
    	let dispose;

    	const button = new Button_1({
    			props: {
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*getByAddress*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Choose by address";
    			t1 = space();
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "Address";
    			t3 = space();
    			input = element("input");
    			t4 = text("\n        Where have you been? Enter a address, Lurin will guess the coordinates.");
    			t5 = space();
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			add_location(h3, file$j, 151, 6, 4225);
    			attr_dev(label, "for", "contributor");
    			add_location(label, file$j, 153, 8, 4290);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "contributor");
    			add_location(input, file$j, 154, 8, 4339);
    			attr_dev(div0, "class", "lurinForm");
    			add_location(div0, file$j, 152, 6, 4258);
    			set_style(div1, "width", "100%");
    			set_style(div1, "height", "80px");
    			add_location(div1, file$j, 157, 6, 4506);
    			add_location(div2, file$j, 150, 4, 4213);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h3);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, label);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			set_input_value(input, /*addressSearch*/ ctx[3]);
    			append_dev(div0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			mount_component(button, div1, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[15]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addressSearch*/ 8 && input.value !== /*addressSearch*/ ctx[3]) {
    				set_input_value(input, /*addressSearch*/ ctx[3]);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 131072) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(150:2) {#if selectedOption == 'address'}",
    		ctx
    	});

    	return block;
    }

    // (167:6) <Icon class="material-icons" style="vertical-align: text-bottom">
    function create_default_slot_2$4(ctx) {
    	let t_value = /*locationOfDevice*/ ctx[4].icon + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*locationOfDevice*/ 16 && t_value !== (t_value = /*locationOfDevice*/ ctx[4].icon + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(167:6) <Icon class=\\\"material-icons\\\" style=\\\"vertical-align: text-bottom\\\">",
    		ctx
    	});

    	return block;
    }

    // (160:10) <Label>
    function create_default_slot_1$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Get coords by address");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$5.name,
    		type: "slot",
    		source: "(160:10) <Label>",
    		ctx
    	});

    	return block;
    }

    // (159:8) <Button on:click={getByAddress} variant="raised" class="formButton">
    function create_default_slot$7(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 131072) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(159:8) <Button on:click={getByAddress} variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (179:2) {#if location.address}
    function create_if_block$6(ctx) {
    	let h3;
    	let t1;
    	let t2_value = /*location*/ ctx[0].latitude + "";
    	let t2;
    	let t3;
    	let br0;
    	let t4;
    	let t5_value = /*location*/ ctx[0].longitude + "";
    	let t5;
    	let t6;
    	let br1;
    	let t7;
    	let t8_value = /*location*/ ctx[0].address + "";
    	let t8;
    	let t9;
    	let br2;
    	let t10;
    	let t11_value = /*location*/ ctx[0].country + "";
    	let t11;
    	let t12;
    	let br3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Choosen location";
    			t1 = text("\n    Latitdude: ");
    			t2 = text(t2_value);
    			t3 = space();
    			br0 = element("br");
    			t4 = text("\n    Longitude: ");
    			t5 = text(t5_value);
    			t6 = space();
    			br1 = element("br");
    			t7 = text("\n    Address: ");
    			t8 = text(t8_value);
    			t9 = space();
    			br2 = element("br");
    			t10 = text("\n    Country: ");
    			t11 = text(t11_value);
    			t12 = space();
    			br3 = element("br");
    			add_location(h3, file$j, 179, 4, 5136);
    			add_location(br0, file$j, 181, 4, 5201);
    			add_location(br1, file$j, 183, 4, 5248);
    			add_location(br2, file$j, 185, 4, 5291);
    			add_location(br3, file$j, 187, 4, 5334);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, br3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*location*/ 1 && t2_value !== (t2_value = /*location*/ ctx[0].latitude + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*location*/ 1 && t5_value !== (t5_value = /*location*/ ctx[0].longitude + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*location*/ 1 && t8_value !== (t8_value = /*location*/ ctx[0].address + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*location*/ 1 && t11_value !== (t11_value = /*location*/ ctx[0].country + "")) set_data_dev(t11, t11_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(br3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(179:2) {#if location.address}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let div1;
    	let h2;
    	let t1;
    	let div0;
    	let t2;
    	let t3;
    	let t4;
    	let current_block_type_index;
    	let if_block0;
    	let t5;
    	let current;

    	const formfield0 = new FormField({
    			props: {
    				$$slots: {
    					default: [create_default_slot_5$1],
    					label: [create_label_slot_2]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const formfield1 = new FormField({
    			props: {
    				$$slots: {
    					default: [create_default_slot_4$2],
    					label: [create_label_slot_1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const formfield2 = new FormField({
    			props: {
    				$$slots: {
    					default: [create_default_slot_3$4],
    					label: [create_label_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_1$2, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*selectedOption*/ ctx[2] == "address") return 0;
    		if (/*selectedOption*/ ctx[2] == "device") return 1;
    		if (/*selectedOption*/ ctx[2] == "map") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block1 = /*location*/ ctx[0].address && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Add location";
    			t1 = space();
    			div0 = element("div");
    			create_component(formfield0.$$.fragment);
    			t2 = space();
    			create_component(formfield1.$$.fragment);
    			t3 = space();
    			create_component(formfield2.$$.fragment);
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			if (if_block1) if_block1.c();
    			add_location(h2, file$j, 124, 2, 3570);
    			add_location(div0, file$j, 125, 2, 3594);
    			add_location(div1, file$j, 123, 0, 3562);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			mount_component(formfield0, div0, null);
    			append_dev(div0, t2);
    			mount_component(formfield1, div0, null);
    			append_dev(div0, t3);
    			mount_component(formfield2, div0, null);
    			append_dev(div1, t4);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			append_dev(div1, t5);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const formfield0_changes = {};

    			if (dirty & /*$$scope, selectedOption*/ 131076) {
    				formfield0_changes.$$scope = { dirty, ctx };
    			}

    			formfield0.$set(formfield0_changes);
    			const formfield1_changes = {};

    			if (dirty & /*$$scope, selectedOption*/ 131076) {
    				formfield1_changes.$$scope = { dirty, ctx };
    			}

    			formfield1.$set(formfield1_changes);
    			const formfield2_changes = {};

    			if (dirty & /*$$scope, selectedOption*/ 131076) {
    				formfield2_changes.$$scope = { dirty, ctx };
    			}

    			formfield2.$set(formfield2_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div1, t5);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (/*location*/ ctx[0].address) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formfield0.$$.fragment, local);
    			transition_in(formfield1.$$.fragment, local);
    			transition_in(formfield2.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formfield0.$$.fragment, local);
    			transition_out(formfield1.$$.fragment, local);
    			transition_out(formfield2.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(formfield0);
    			destroy_component(formfield1);
    			destroy_component(formfield2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { location = {} } = $$props;
    	let map;
    	let mapElement;
    	let marker = {};
    	let selectedOption = "map";
    	let addressSearch = "";

    	function initMap() {
    		var observer = loadMapScript();

    		observer.subscribe(loaded => {
    			if (loaded) {
    				let initialCoords = { lat: 46.65, lng: 7.709 };

    				if (location && location.latitude) {
    					initialCoords = {
    						lat: location.latitude,
    						lng: location.longitude
    					};
    				} else {
    					updateLocationByCoords(initialCoords.lat, initialCoords.lng);
    				}

    				map = new google.maps.Map(mapElement, { center: initialCoords, zoom: 8 });

    				marker = new google.maps.Marker({
    						map,
    						draggable: true,
    						animation: google.maps.Animation.DROP,
    						position: initialCoords
    					});

    				marker.addListener("dragend", function () {
    					console.log(marker);
    					updateLocationByCoords(marker.position.lat(), marker.position.lng());
    				});
    			}
    		});
    	}

    	async function updateLocationByCoords(lat, lng) {
    		try {
    			$$invalidate(0, location = await getPositionByCoords(lat, lng));
    			dispatch("locationChoosen", location);
    		} catch(e) {
    			console.log("updateLocationByCoords: error while looking up coords", e);
    		}
    	}

    	async function getByAddress(e) {
    		e.preventDefault();

    		try {
    			$$invalidate(0, location = await getPositionByAddress(addressSearch));
    			dispatch("locationChoosen", location);
    		} catch(e) {
    			console.log("getByAddress: error while looking up coords", e);
    		}

    		return false;
    	}

    	onMount(async () => {
    		optionChanged();
    	});

    	let locationOfDevice = {};

    	function optionChanged() {
    		if (selectedOption == "map") {
    			initMap();
    		} else if (selectedOption == "device") {
    			$$invalidate(4, locationOfDevice = {
    				msg: "Locate your device position.....",
    				icon: "phonelink_ring"
    			});

    			if (!navigator.geolocation) {
    				$$invalidate(4, locationOfDevice = {
    					msg: "Looks like your phone does not support gelocation",
    					icon: "local_phone"
    				});

    				return;
    			}

    			navigator.geolocation.getCurrentPosition(
    				position => {
    					$$invalidate(4, locationOfDevice = { msg: "Location found", icon: "done" });

    					$$invalidate(0, location = {
    						latitude: position.coords.latitude,
    						longitude: position.coords.longitude
    					});

    					updateLocationByCoords(position.coords.latitude, position.coords.longitude);
    				},
    				error => {
    					if (error.code == 1) {
    						$$invalidate(4, locationOfDevice = {
    							msg: "Error on fetching the device's locaction",
    							icon: "phonelink_erase"
    						});
    					} else {
    						$$invalidate(4, locationOfDevice = {
    							msg: "Lurin has no rights to access your device's location 💩",
    							icon: "phonelink_lock"
    						});
    					}
    				}
    			);
    		}
    	}

    	const writable_props = ["location"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<LocationSelector> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("LocationSelector", $$slots, []);

    	function radio_group_binding(value) {
    		selectedOption = value;
    		$$invalidate(2, selectedOption);
    	}

    	function radio_group_binding_1(value) {
    		selectedOption = value;
    		$$invalidate(2, selectedOption);
    	}

    	function radio_group_binding_2(value) {
    		selectedOption = value;
    		$$invalidate(2, selectedOption);
    	}

    	function input_input_handler() {
    		addressSearch = this.value;
    		$$invalidate(3, addressSearch);
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, mapElement = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(0, location = $$props.location);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		getPositionByCoords,
    		getPositionByAddress,
    		loadMapScript,
    		Button: Button_1,
    		Label,
    		Radio,
    		FormField,
    		Icon,
    		createEventDispatcher,
    		dispatch,
    		location,
    		map,
    		mapElement,
    		marker,
    		selectedOption,
    		addressSearch,
    		initMap,
    		updateLocationByCoords,
    		getByAddress,
    		locationOfDevice,
    		optionChanged
    	});

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(0, location = $$props.location);
    		if ("map" in $$props) map = $$props.map;
    		if ("mapElement" in $$props) $$invalidate(1, mapElement = $$props.mapElement);
    		if ("marker" in $$props) marker = $$props.marker;
    		if ("selectedOption" in $$props) $$invalidate(2, selectedOption = $$props.selectedOption);
    		if ("addressSearch" in $$props) $$invalidate(3, addressSearch = $$props.addressSearch);
    		if ("locationOfDevice" in $$props) $$invalidate(4, locationOfDevice = $$props.locationOfDevice);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		location,
    		mapElement,
    		selectedOption,
    		addressSearch,
    		locationOfDevice,
    		getByAddress,
    		optionChanged,
    		map,
    		marker,
    		dispatch,
    		initMap,
    		updateLocationByCoords,
    		radio_group_binding,
    		radio_group_binding_1,
    		radio_group_binding_2,
    		input_input_handler,
    		div0_binding
    	];
    }

    class LocationSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { location: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LocationSelector",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get location() {
    		throw new Error("<LocationSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<LocationSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    async function readFile$1(file) {
      return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = async function (e) {
          let orientation = await getOrientation(file);
          console.log(`orientation of photo is: ${orientation.degree}`);
          var rotatedResult = await rotatePhoto(
            e.target.result,
            orientation.degree
          );
          let promiseThumb = resizeImage(rotatedResult, 256);
          let promise = resizeImage(rotatedResult, 2048);
          Promise.all([promiseThumb, promise])
            .then((r) => {
              resolve(r);
            })
            .catch((e) => {
              console.log(e);
              reject(e);
            });
        };
        reader.readAsDataURL(file);
      });
    }

    async function getImageFormUrl(url) {
      return new Promise(async (resolve, reject) => {
        let response = await fetch(url);
        let data = await response.blob();
        let metadata = {
          type: "image/jpeg",
        };
        let file = new File([data], "test.jpg", metadata);
        let orientation = await getOrientation(file);
        console.log(`orientation of photo is: ${orientation.degree}`);
        var rotatedResult = await rotatePhoto(url, orientation.degree);
        var promiseThumb = resizeImage(rotatedResult, 256);
        var promise = resizeImage(rotatedResult, 2048);
        Promise.all([promiseThumb, promise])
          .then((r) => {
            resolve(r);
          })
          .catch((e) => {
            console.log(e);
            reject(e);
          });
      });
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssPropertyNameMap = {
        animation: {
            prefixed: '-webkit-animation',
            standard: 'animation',
        },
        transform: {
            prefixed: '-webkit-transform',
            standard: 'transform',
        },
        transition: {
            prefixed: '-webkit-transition',
            standard: 'transition',
        },
    };
    function isWindow(windowObj) {
        return Boolean(windowObj.document) && typeof windowObj.document.createElement === 'function';
    }
    function getCorrectPropertyName(windowObj, cssProperty) {
        if (isWindow(windowObj) && cssProperty in cssPropertyNameMap) {
            var el = windowObj.document.createElement('div');
            var _a = cssPropertyNameMap[cssProperty], standard = _a.standard, prefixed = _a.prefixed;
            var isStandard = standard in el.style;
            return isStandard ? standard : prefixed;
        }
        return cssProperty;
    }
    //# sourceMappingURL=util.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$5 = {
        CLOSED_CLASS: 'mdc-linear-progress--closed',
        INDETERMINATE_CLASS: 'mdc-linear-progress--indeterminate',
        REVERSED_CLASS: 'mdc-linear-progress--reversed',
    };
    var strings$7 = {
        BUFFER_SELECTOR: '.mdc-linear-progress__buffer',
        PRIMARY_BAR_SELECTOR: '.mdc-linear-progress__primary-bar',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCLinearProgressFoundation = /** @class */ (function (_super) {
        __extends(MDCLinearProgressFoundation, _super);
        function MDCLinearProgressFoundation(adapter) {
            return _super.call(this, __assign({}, MDCLinearProgressFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCLinearProgressFoundation, "cssClasses", {
            get: function () {
                return cssClasses$5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCLinearProgressFoundation, "strings", {
            get: function () {
                return strings$7;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCLinearProgressFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    getBuffer: function () { return null; },
                    getPrimaryBar: function () { return null; },
                    hasClass: function () { return false; },
                    removeClass: function () { return undefined; },
                    setStyle: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCLinearProgressFoundation.prototype.init = function () {
            this.isDeterminate_ = !this.adapter_.hasClass(cssClasses$5.INDETERMINATE_CLASS);
            this.isReversed_ = this.adapter_.hasClass(cssClasses$5.REVERSED_CLASS);
            this.progress_ = 0;
        };
        MDCLinearProgressFoundation.prototype.setDeterminate = function (isDeterminate) {
            this.isDeterminate_ = isDeterminate;
            if (this.isDeterminate_) {
                this.adapter_.removeClass(cssClasses$5.INDETERMINATE_CLASS);
                this.setScale_(this.adapter_.getPrimaryBar(), this.progress_);
            }
            else {
                this.adapter_.addClass(cssClasses$5.INDETERMINATE_CLASS);
                this.setScale_(this.adapter_.getPrimaryBar(), 1);
                this.setScale_(this.adapter_.getBuffer(), 1);
            }
        };
        MDCLinearProgressFoundation.prototype.setProgress = function (value) {
            this.progress_ = value;
            if (this.isDeterminate_) {
                this.setScale_(this.adapter_.getPrimaryBar(), value);
            }
        };
        MDCLinearProgressFoundation.prototype.setBuffer = function (value) {
            if (this.isDeterminate_) {
                this.setScale_(this.adapter_.getBuffer(), value);
            }
        };
        MDCLinearProgressFoundation.prototype.setReverse = function (isReversed) {
            this.isReversed_ = isReversed;
            if (this.isReversed_) {
                this.adapter_.addClass(cssClasses$5.REVERSED_CLASS);
            }
            else {
                this.adapter_.removeClass(cssClasses$5.REVERSED_CLASS);
            }
        };
        MDCLinearProgressFoundation.prototype.open = function () {
            this.adapter_.removeClass(cssClasses$5.CLOSED_CLASS);
        };
        MDCLinearProgressFoundation.prototype.close = function () {
            this.adapter_.addClass(cssClasses$5.CLOSED_CLASS);
        };
        MDCLinearProgressFoundation.prototype.setScale_ = function (el, scaleValue) {
            if (!el) {
                return;
            }
            var value = "scaleX(" + scaleValue + ")";
            this.adapter_.setStyle(el, getCorrectPropertyName(window, 'transform'), value);
        };
        return MDCLinearProgressFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCLinearProgress = /** @class */ (function (_super) {
        __extends(MDCLinearProgress, _super);
        function MDCLinearProgress() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCLinearProgress.attachTo = function (root) {
            return new MDCLinearProgress(root);
        };
        Object.defineProperty(MDCLinearProgress.prototype, "determinate", {
            set: function (value) {
                this.foundation_.setDeterminate(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCLinearProgress.prototype, "progress", {
            set: function (value) {
                this.foundation_.setProgress(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCLinearProgress.prototype, "buffer", {
            set: function (value) {
                this.foundation_.setBuffer(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCLinearProgress.prototype, "reverse", {
            set: function (value) {
                this.foundation_.setReverse(value);
            },
            enumerable: true,
            configurable: true
        });
        MDCLinearProgress.prototype.open = function () {
            this.foundation_.open();
        };
        MDCLinearProgress.prototype.close = function () {
            this.foundation_.close();
        };
        MDCLinearProgress.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                getBuffer: function () { return _this.root_.querySelector(MDCLinearProgressFoundation.strings.BUFFER_SELECTOR); },
                getPrimaryBar: function () { return _this.root_.querySelector(MDCLinearProgressFoundation.strings.PRIMARY_BAR_SELECTOR); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                setStyle: function (el, styleProperty, value) { return el.style.setProperty(styleProperty, value); },
            };
            return new MDCLinearProgressFoundation(adapter);
        };
        return MDCLinearProgress;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules\@smui\linear-progress\LinearProgress.svelte generated by Svelte v3.20.1 */
    const file$k = "node_modules\\@smui\\linear-progress\\LinearProgress.svelte";

    function create_fragment$m(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let span0;
    	let t2;
    	let div3;
    	let span1;
    	let useActions_action;
    	let forwardEvents_action;
    	let dispose;

    	let div4_levels = [
    		{
    			class: "\n    mdc-linear-progress\n    " + /*className*/ ctx[1] + "\n    " + (/*indeterminate*/ ctx[2]
    			? "mdc-linear-progress--indeterminate"
    			: "") + "\n    " + (/*reversed*/ ctx[3]
    			? "mdc-linear-progress--reversed"
    			: "") + "\n    " + (/*closed*/ ctx[4] ? "mdc-linear-progress--closed" : "") + "\n  "
    		},
    		{ role: "progressbar" },
    		exclude(/*$$props*/ ctx[7], ["use", "class", "indeterminate", "reversed", "closed", "progress"])
    	];

    	let div4_data = {};

    	for (let i = 0; i < div4_levels.length; i += 1) {
    		div4_data = assign(div4_data, div4_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			span0 = element("span");
    			t2 = space();
    			div3 = element("div");
    			span1 = element("span");
    			attr_dev(div0, "class", "mdc-linear-progress__buffering-dots");
    			add_location(div0, file$k, 14, 2, 410);
    			attr_dev(div1, "class", "mdc-linear-progress__buffer");
    			add_location(div1, file$k, 15, 2, 468);
    			attr_dev(span0, "class", "mdc-linear-progress__bar-inner");
    			add_location(span0, file$k, 17, 4, 594);
    			attr_dev(div2, "class", "mdc-linear-progress__bar mdc-linear-progress__primary-bar");
    			add_location(div2, file$k, 16, 2, 518);
    			attr_dev(span1, "class", "mdc-linear-progress__bar-inner");
    			add_location(span1, file$k, 20, 4, 736);
    			attr_dev(div3, "class", "mdc-linear-progress__bar mdc-linear-progress__secondary-bar");
    			add_location(div3, file$k, 19, 2, 658);
    			set_attributes(div4, div4_data);
    			add_location(div4, file$k, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, span0);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, span1);
    			/*div4_binding*/ ctx[11](div4);
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div4, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[6].call(null, div4))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			set_attributes(div4, get_spread_update(div4_levels, [
    				dirty & /*className, indeterminate, reversed, closed*/ 30 && {
    					class: "\n    mdc-linear-progress\n    " + /*className*/ ctx[1] + "\n    " + (/*indeterminate*/ ctx[2]
    					? "mdc-linear-progress--indeterminate"
    					: "") + "\n    " + (/*reversed*/ ctx[3]
    					? "mdc-linear-progress--reversed"
    					: "") + "\n    " + (/*closed*/ ctx[4] ? "mdc-linear-progress--closed" : "") + "\n  "
    				},
    				{ role: "progressbar" },
    				dirty & /*exclude, $$props*/ 128 && exclude(/*$$props*/ ctx[7], ["use", "class", "indeterminate", "reversed", "closed", "progress"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			/*div4_binding*/ ctx[11](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { indeterminate = false } = $$props;
    	let { reversed = false } = $$props;
    	let { closed = false } = $$props;
    	let { progress = 0 } = $$props;
    	let { buffer = null } = $$props;
    	let element;
    	let linearProgress;

    	onMount(() => {
    		$$invalidate(10, linearProgress = new MDCLinearProgress(element));
    	});

    	onDestroy(() => {
    		linearProgress && linearProgress.destroy();
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("LinearProgress", $$slots, []);

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(5, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("indeterminate" in $$new_props) $$invalidate(2, indeterminate = $$new_props.indeterminate);
    		if ("reversed" in $$new_props) $$invalidate(3, reversed = $$new_props.reversed);
    		if ("closed" in $$new_props) $$invalidate(4, closed = $$new_props.closed);
    		if ("progress" in $$new_props) $$invalidate(8, progress = $$new_props.progress);
    		if ("buffer" in $$new_props) $$invalidate(9, buffer = $$new_props.buffer);
    	};

    	$$self.$capture_state = () => ({
    		MDCLinearProgress,
    		onMount,
    		onDestroy,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		indeterminate,
    		reversed,
    		closed,
    		progress,
    		buffer,
    		element,
    		linearProgress
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("indeterminate" in $$props) $$invalidate(2, indeterminate = $$new_props.indeterminate);
    		if ("reversed" in $$props) $$invalidate(3, reversed = $$new_props.reversed);
    		if ("closed" in $$props) $$invalidate(4, closed = $$new_props.closed);
    		if ("progress" in $$props) $$invalidate(8, progress = $$new_props.progress);
    		if ("buffer" in $$props) $$invalidate(9, buffer = $$new_props.buffer);
    		if ("element" in $$props) $$invalidate(5, element = $$new_props.element);
    		if ("linearProgress" in $$props) $$invalidate(10, linearProgress = $$new_props.linearProgress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*linearProgress, indeterminate*/ 1028) {
    			 if (linearProgress) {
    				$$invalidate(10, linearProgress.determinate = !indeterminate, linearProgress);
    			}
    		}

    		if ($$self.$$.dirty & /*linearProgress, progress*/ 1280) {
    			 if (linearProgress) {
    				$$invalidate(10, linearProgress.progress = progress, linearProgress);
    			}
    		}

    		if ($$self.$$.dirty & /*linearProgress, buffer*/ 1536) {
    			 if (linearProgress) {
    				$$invalidate(10, linearProgress.buffer = buffer, linearProgress);
    			}
    		}

    		if ($$self.$$.dirty & /*linearProgress, reversed*/ 1032) {
    			 if (linearProgress) {
    				$$invalidate(10, linearProgress.reverse = reversed, linearProgress);
    			}
    		}

    		if ($$self.$$.dirty & /*linearProgress, closed*/ 1040) {
    			 if (linearProgress) {
    				if (closed) {
    					linearProgress.close();
    				} else {
    					linearProgress.open();
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		indeterminate,
    		reversed,
    		closed,
    		element,
    		forwardEvents,
    		$$props,
    		progress,
    		buffer,
    		linearProgress,
    		div4_binding
    	];
    }

    class LinearProgress extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {
    			use: 0,
    			class: 1,
    			indeterminate: 2,
    			reversed: 3,
    			closed: 4,
    			progress: 8,
    			buffer: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LinearProgress",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get use() {
    		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indeterminate() {
    		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indeterminate(value) {
    		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reversed() {
    		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reversed(value) {
    		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closed() {
    		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closed(value) {
    		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get progress() {
    		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set progress(value) {
    		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get buffer() {
    		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buffer(value) {
    		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let webShareMediaCache = "webShareMediaCache";
    async function getCachedMedia() {
      const cache = await caches.open(webShareMediaCache);
      const requests = await cache.keys();
      return Promise.all(
        requests.reverse().map(async (request) => {
          const response = await cache.match(request);
          return {
            contentType: response.headers.get("content-type"),
            src: request.url,
          };
        })
      );
    }

    async function deleteCachedMediaMetadata(imageSrc) {
      const cache = await caches.open(webShareMediaCache);
      const requests = await cache.keys();
      var request = requests.filter((x) => x.url == imageSrc);
      return await cache.delete(request.length > 0 ? request[0] : null);
    }

    async function getCachedMediaMetadata(contentTypePrefix) {
      const cachedMetadata = await getCachedMedia();
      return cachedMetadata.filter((metadata) =>
        metadata.contentType.startsWith(contentTypePrefix)
      );
    }

    /* src\components\ImageSelector.svelte generated by Svelte v3.20.1 */
    const file$l = "src\\components\\ImageSelector.svelte";

    // (83:28) 
    function create_if_block_4(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let t1;
    	let current;

    	const button0 = new Button_1({
    			props: {
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot_6$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*useCachedImage*/ ctx[5]);

    	const button1 = new Button_1({
    			props: {
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot_4$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*deleteCachedImage*/ ctx[6]);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			create_component(button0.$$.fragment);
    			t1 = space();
    			create_component(button1.$$.fragment);
    			if (img.src !== (img_src_value = /*cachedImage*/ ctx[3].thumbnailImage)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "shared image");
    			set_style(img, "max-height", "100px");
    			set_style(img, "height", "auto");
    			add_location(img, file$l, 84, 6, 2707);
    			attr_dev(div0, "class", "col svelte-aja25b");
    			add_location(div0, file$l, 83, 4, 2683);
    			attr_dev(div1, "class", "col svelte-aja25b");
    			add_location(div1, file$l, 89, 4, 2843);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(button0, div1, null);
    			append_dev(div1, t1);
    			mount_component(button1, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*cachedImage*/ 8 && img.src !== (img_src_value = /*cachedImage*/ ctx[3].thumbnailImage)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(83:28) ",
    		ctx
    	});

    	return block;
    }

    // (81:2) {#if cachedImageLoading}
    function create_if_block_3$1(ctx) {
    	let current;

    	const linearprogress = new LinearProgress({
    			props: { indeterminate: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(linearprogress.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(linearprogress, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(linearprogress.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(linearprogress.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(linearprogress, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(81:2) {#if cachedImageLoading}",
    		ctx
    	});

    	return block;
    }

    // (92:8) <Label>
    function create_default_slot_7$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Use this image");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7$1.name,
    		type: "slot",
    		source: "(92:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (91:6) <Button on:click={useCachedImage} variant="raised" class="formButton">
    function create_default_slot_6$1(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_7$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$1.name,
    		type: "slot",
    		source: "(91:6) <Button on:click={useCachedImage} variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (95:8) <Label>
    function create_default_slot_5$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Choose other image");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$2.name,
    		type: "slot",
    		source: "(95:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (94:6) <Button on:click={deleteCachedImage} variant="raised" class="formButton">
    function create_default_slot_4$3(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_5$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$3.name,
    		type: "slot",
    		source: "(94:6) <Button on:click={deleteCachedImage} variant=\\\"raised\\\" class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (99:2) {#if !cachedImageLoading && !cachedImage.src && !thumbnailImage}
    function create_if_block_2$1(ctx) {
    	let div1;
    	let input;
    	let t0;
    	let div0;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let t3;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			t1 = text("Drag and drop your image\n        ");
    			br0 = element("br");
    			t2 = text("\n        or\n        ");
    			br1 = element("br");
    			t3 = text("\n        Click to add");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "id", "drop_zone");
    			attr_dev(input, "class", "FileUpload svelte-aja25b");
    			attr_dev(input, "accept", ".jpg,.png,.gif");
    			add_location(input, file$l, 100, 6, 3258);
    			add_location(br0, file$l, 109, 8, 3520);
    			add_location(br1, file$l, 111, 8, 3546);
    			attr_dev(div0, "class", "dropZoneOverlay svelte-aja25b");
    			add_location(div0, file$l, 107, 6, 3449);
    			attr_dev(div1, "class", "dropZoneContainer svelte-aja25b");
    			add_location(div1, file$l, 99, 4, 3220);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div0, br0);
    			append_dev(div0, t2);
    			append_dev(div0, br1);
    			append_dev(div0, t3);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "change", /*input_change_handler*/ ctx[11]),
    				listen_dev(input, "change", /*readUploadedFiles*/ ctx[7], false, false, false)
    			];
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(99:2) {#if !cachedImageLoading && !cachedImage.src && !thumbnailImage}",
    		ctx
    	});

    	return block;
    }

    // (117:2) {#if thumbnailImage}
    function create_if_block$7(ctx) {
    	let div3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let t1;
    	let t2;
    	let div2;
    	let current;

    	const icon = new Icon({
    			props: {
    				class: "material-icons",
    				style: "vertical-align: text-bottom;",
    				$$slots: { default: [create_default_slot_3$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*fullsizeImage*/ ctx[2] && create_if_block_1$3(ctx);

    	const button = new Button_1({
    			props: {
    				disabled: !/*thumbnailImage*/ ctx[1],
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*deleteImages*/ ctx[8]);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			t1 = text("\n        Thumbnail is ready!\n        ");
    			if (if_block) if_block.c();
    			t2 = space();
    			div2 = element("div");
    			create_component(button.$$.fragment);
    			if (img.src !== (img_src_value = /*thumbnailImage*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			set_style(img, "max-height", "60px");
    			set_style(img, "height", "100%");
    			attr_dev(img, "alt", "thmbnail");
    			add_location(img, file$l, 119, 8, 3719);
    			attr_dev(div0, "class", "col svelte-aja25b");
    			set_style(div0, "padding", "4px");
    			add_location(div0, file$l, 118, 6, 3671);
    			attr_dev(div1, "class", "col svelte-aja25b");
    			set_style(div1, "padding-top", "12px");
    			add_location(div1, file$l, 124, 6, 3848);
    			attr_dev(div2, "class", "col svelte-aja25b");
    			set_style(div2, "height", "100px");
    			add_location(div2, file$l, 137, 6, 4246);
    			attr_dev(div3, "class", "flex-grid-imageOk svelte-aja25b");
    			add_location(div3, file$l, 117, 4, 3633);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, img);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(icon, div1, null);
    			append_dev(div1, t1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			mount_component(button, div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*thumbnailImage*/ 2 && img.src !== (img_src_value = /*thumbnailImage*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);

    			if (/*fullsizeImage*/ ctx[2]) {
    				if (!if_block) {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				} else {
    					transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const button_changes = {};
    			if (dirty & /*thumbnailImage*/ 2) button_changes.disabled = !/*thumbnailImage*/ ctx[1];

    			if (dirty & /*$$scope*/ 4096) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(icon);
    			if (if_block) if_block.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(117:2) {#if thumbnailImage}",
    		ctx
    	});

    	return block;
    }

    // (126:8) <Icon class="material-icons" style="vertical-align: text-bottom;">
    function create_default_slot_3$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("done");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$5.name,
    		type: "slot",
    		source: "(126:8) <Icon class=\\\"material-icons\\\" style=\\\"vertical-align: text-bottom;\\\">",
    		ctx
    	});

    	return block;
    }

    // (130:8) {#if fullsizeImage}
    function create_if_block_1$3(ctx) {
    	let br;
    	let t0;
    	let t1;
    	let current;

    	const icon = new Icon({
    			props: {
    				class: "material-icons",
    				style: "vertical-align: text-bottom;",
    				$$slots: { default: [create_default_slot_2$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			create_component(icon.$$.fragment);
    			t1 = text("\n          Fullsize is ready!");
    			add_location(br, file$l, 130, 10, 4065);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(icon, target, anchor);
    			insert_dev(target, t1, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			destroy_component(icon, detaching);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(130:8) {#if fullsizeImage}",
    		ctx
    	});

    	return block;
    }

    // (132:10) <Icon class="material-icons" style="vertical-align: text-bottom;">
    function create_default_slot_2$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("done");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$5.name,
    		type: "slot",
    		source: "(132:10) <Icon class=\\\"material-icons\\\" style=\\\"vertical-align: text-bottom;\\\">",
    		ctx
    	});

    	return block;
    }

    // (144:10) <Label>
    function create_default_slot_1$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$6.name,
    		type: "slot",
    		source: "(144:10) <Label>",
    		ctx
    	});

    	return block;
    }

    // (139:8) <Button           on:click={deleteImages}           disabled={!thumbnailImage}           variant="raised"           class="formButton">
    function create_default_slot$8(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(139:8) <Button           on:click={deleteImages}           disabled={!thumbnailImage}           variant=\\\"raised\\\"           class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let t3;
    	let current;
    	const if_block_creators = [create_if_block_3$1, create_if_block_4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*cachedImageLoading*/ ctx[4]) return 0;
    		if (/*cachedImage*/ ctx[3].src) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block1 = !/*cachedImageLoading*/ ctx[4] && !/*cachedImage*/ ctx[3].src && !/*thumbnailImage*/ ctx[1] && create_if_block_2$1(ctx);
    	let if_block2 = /*thumbnailImage*/ ctx[1] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Select image";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			add_location(h2, file$l, 79, 2, 2564);
    			add_location(div, file$l, 78, 0, 2556);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t3);
    			if (if_block2) if_block2.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div, t2);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (!/*cachedImageLoading*/ ctx[4] && !/*cachedImage*/ ctx[3].src && !/*thumbnailImage*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(div, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*thumbnailImage*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block$7(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let uploadedFiles = [];
    	let thumbnailImage = null;
    	let fullsizeImage = null;
    	let cachedImage = {};
    	let cachedImageLoading = true; //!!new URLSearchParams(window.location.search).get("shareTarget");

    	onMount(async () => {
    		if (cachedImageLoading) {
    			loadCachedImage();
    		}
    	});

    	async function loadCachedImage() {
    		const images = await getCachedMediaMetadata("image");
    		let img = images ? images[0] : null;

    		if (img) {
    			let [thumb, fullSize] = await getImageFormUrl(img.src);
    			$$invalidate(3, cachedImage = img);
    			$$invalidate(3, cachedImage.thumbnailImage = thumb, cachedImage);
    			$$invalidate(3, cachedImage.fullsizeImage = fullSize, cachedImage);
    		}

    		$$invalidate(4, cachedImageLoading = false);
    	}

    	async function useCachedImage(e) {
    		e.preventDefault();
    		$$invalidate(1, thumbnailImage = cachedImage.thumbnailImage);
    		$$invalidate(2, fullsizeImage = cachedImage.fullsizeImage);
    		dispatch("imageChoosen", { thumbnailImage, fullsizeImage });
    		deleteCachedMediaMetadata(cachedImage.src).then(result => $$invalidate(3, cachedImage = {}));
    	}

    	async function deleteCachedImage(e) {
    		e.preventDefault();
    		await deleteCachedMediaMetadata(cachedImage.src);
    		$$invalidate(3, cachedImage = null);
    		$$invalidate(4, cachedImageLoading = true);
    		loadCachedImage();
    		return false;
    	}

    	function readUploadedFiles(e) {
    		readFile$1(e.target.files[0]).then(([thumb, fullSize]) => {
    			$$invalidate(1, thumbnailImage = thumb);
    			$$invalidate(2, fullsizeImage = fullSize);
    			dispatch("imageChoosen", { thumbnailImage, fullsizeImage });
    		});
    	}

    	function deleteImages() {
    		$$invalidate(1, thumbnailImage = null);
    		$$invalidate(2, fullsizeImage = null);
    		dispatch("imageChoosen", { thumbnailImage, fullsizeImage });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageSelector> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImageSelector", $$slots, []);

    	function input_change_handler() {
    		uploadedFiles = this.value;
    		$$invalidate(0, uploadedFiles);
    	}

    	$$self.$capture_state = () => ({
    		readFile: readFile$1,
    		getImageFormUrl,
    		LinearProgress,
    		Icon,
    		Button: Button_1,
    		Label,
    		createEventDispatcher,
    		getCachedMediaMetadata,
    		deleteCachedMediaMetadata,
    		tick,
    		onMount,
    		dispatch,
    		uploadedFiles,
    		thumbnailImage,
    		fullsizeImage,
    		cachedImage,
    		cachedImageLoading,
    		loadCachedImage,
    		useCachedImage,
    		deleteCachedImage,
    		readUploadedFiles,
    		deleteImages
    	});

    	$$self.$inject_state = $$props => {
    		if ("uploadedFiles" in $$props) $$invalidate(0, uploadedFiles = $$props.uploadedFiles);
    		if ("thumbnailImage" in $$props) $$invalidate(1, thumbnailImage = $$props.thumbnailImage);
    		if ("fullsizeImage" in $$props) $$invalidate(2, fullsizeImage = $$props.fullsizeImage);
    		if ("cachedImage" in $$props) $$invalidate(3, cachedImage = $$props.cachedImage);
    		if ("cachedImageLoading" in $$props) $$invalidate(4, cachedImageLoading = $$props.cachedImageLoading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		uploadedFiles,
    		thumbnailImage,
    		fullsizeImage,
    		cachedImage,
    		cachedImageLoading,
    		useCachedImage,
    		deleteCachedImage,
    		readUploadedFiles,
    		deleteImages,
    		dispatch,
    		loadCachedImage,
    		input_change_handler
    	];
    }

    class ImageSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageSelector",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\components\AddPlaceToBe.svelte generated by Svelte v3.20.1 */

    const { console: console_1$3 } = globals;
    const file$m = "src\\components\\AddPlaceToBe.svelte";

    // (110:8) <Label>
    function create_default_slot_1$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Send");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$7.name,
    		type: "slot",
    		source: "(110:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (106:6) <Button         disabled={!($imageForm.valid && imageObj.funFact.length > 0 && fullsizeImage && thumbnailImage && location)}         variant="raised"         class="formButton">
    function create_default_slot$9(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(106:6) <Button         disabled={!($imageForm.valid && imageObj.funFact.length > 0 && fullsizeImage && thumbnailImage && location)}         variant=\\\"raised\\\"         class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let div3;
    	let h1;
    	let t1;
    	let form_1;
    	let div2;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let t8;
    	let t9;
    	let current;
    	let dispose;
    	const imageselector = new ImageSelector({ $$inline: true });
    	imageselector.$on("imageChoosen", /*updateImage*/ ctx[4]);
    	const locationselector = new LocationSelector({ $$inline: true });
    	locationselector.$on("locationChoosen", /*updateLocation*/ ctx[5]);

    	const button = new Button_1({
    			props: {
    				disabled: !(/*$imageForm*/ ctx[3].valid && /*imageObj*/ ctx[0].funFact.length > 0 && /*fullsizeImage*/ ctx[2] && /*thumbnailImage*/ ctx[1] && location),
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Add place to be";
    			t1 = space();
    			form_1 = element("form");
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Location, Country";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Fun Fact";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			create_component(imageselector.$$.fragment);
    			t8 = space();
    			create_component(locationselector.$$.fragment);
    			t9 = space();
    			create_component(button.$$.fragment);
    			add_location(h1, file$m, 90, 2, 2259);
    			attr_dev(label0, "for", "title");
    			add_location(label0, file$m, 94, 8, 2388);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "title");
    			add_location(input0, file$m, 95, 8, 2441);
    			add_location(div0, file$m, 93, 6, 2374);
    			attr_dev(label1, "for", "fact");
    			add_location(label1, file$m, 98, 8, 2542);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "fact");
    			add_location(input1, file$m, 99, 8, 2585);
    			add_location(div1, file$m, 97, 6, 2528);
    			attr_dev(div2, "class", "lurinForm");
    			add_location(div2, file$m, 92, 4, 2344);
    			set_style(form_1, "max-width", "400px");
    			add_location(form_1, file$m, 91, 2, 2286);
    			attr_dev(div3, "class", "contentpadding");
    			add_location(div3, file$m, 89, 0, 2228);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h1);
    			append_dev(div3, t1);
    			append_dev(div3, form_1);
    			append_dev(form_1, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*imageObj*/ ctx[0].imageTitle);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			set_input_value(input1, /*imageObj*/ ctx[0].funFact);
    			append_dev(div2, t7);
    			mount_component(imageselector, div2, null);
    			append_dev(div2, t8);
    			mount_component(locationselector, div2, null);
    			append_dev(div2, t9);
    			mount_component(button, div2, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    				listen_dev(form_1, "submit", /*saveData*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imageObj*/ 1 && input0.value !== /*imageObj*/ ctx[0].imageTitle) {
    				set_input_value(input0, /*imageObj*/ ctx[0].imageTitle);
    			}

    			if (dirty & /*imageObj*/ 1 && input1.value !== /*imageObj*/ ctx[0].funFact) {
    				set_input_value(input1, /*imageObj*/ ctx[0].funFact);
    			}

    			const button_changes = {};
    			if (dirty & /*$imageForm, imageObj, fullsizeImage, thumbnailImage*/ 15) button_changes.disabled = !(/*$imageForm*/ ctx[3].valid && /*imageObj*/ ctx[0].funFact.length > 0 && /*fullsizeImage*/ ctx[2] && /*thumbnailImage*/ ctx[1] && location);

    			if (dirty & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageselector.$$.fragment, local);
    			transition_in(locationselector.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageselector.$$.fragment, local);
    			transition_out(locationselector.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(imageselector);
    			destroy_component(locationselector);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let $imageForm;

    	let imageObj = {
    		imageTitle: "",
    		funFact: "",
    		imageKey: "",
    		location: {},
    		thumbnail: ""
    	};

    	let thumbnailImage = null;
    	let fullsizeImage = null;

    	function updateImage(event) {
    		$$invalidate(2, fullsizeImage = event.detail.fullsizeImage);
    		$$invalidate(1, thumbnailImage = event.detail.thumbnailImage);
    	}

    	function updateLocation(event) {
    		$$invalidate(0, imageObj.location = event.detail, imageObj);
    	}

    	const imageForm = form(() => ({
    		title: {
    			value: imageObj.imageTitle,
    			validators: ["required", "min:5", "max:80"]
    		},
    		funFact: {
    			value: imageObj.funFact,
    			validators: ["required", "min:5", "max:240"]
    		}
    	}));

    	validate_store(imageForm, "imageForm");
    	component_subscribe($$self, imageForm, value => $$invalidate(3, $imageForm = value));

    	async function saveData(e) {
    		e.preventDefault();

    		try {
    			$$invalidate(0, imageObj.insertTime = new Date().getTime(), imageObj);
    			var result = await saveImageAndMetadata(imageObj, thumbnailImage, fullsizeImage);

    			if (result) {
    				$$invalidate(0, imageObj = {
    					imageTitle: "",
    					funFact: "",
    					imageKey: "",
    					location: {},
    					thumbnail: ""
    				});

    				$$invalidate(1, thumbnailImage = null);
    				$$invalidate(2, fullsizeImage = null);
    				notify("thanks for adding this gem.");
    				page_js("/images");
    			} else {
    				notify("something went wrong :-(");
    			}
    		} catch(e) {
    			console.log("error on save", e);
    			notify("something went wrong :-(");
    		}

    		return false;
    	}

    	function handleFiles(e) {
    		readFile(e.target.files[0]).then(([thumb, fullSize]) => {
    			$$invalidate(1, thumbnailImage = thumb);
    			$$invalidate(2, fullsizeImage = fullSize);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<AddPlaceToBe> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AddPlaceToBe", $$slots, []);

    	function input0_input_handler() {
    		imageObj.imageTitle = this.value;
    		$$invalidate(0, imageObj);
    	}

    	function input1_input_handler() {
    		imageObj.funFact = this.value;
    		$$invalidate(0, imageObj);
    	}

    	$$self.$capture_state = () => ({
    		saveImageAndMetadata,
    		resizeImage,
    		getOrientation,
    		rotatePhoto,
    		IconButton,
    		Icon,
    		notify,
    		form,
    		Button: Button_1,
    		Label,
    		onMount,
    		LocationSelector,
    		ImageSelector,
    		page: page_js,
    		imageObj,
    		thumbnailImage,
    		fullsizeImage,
    		updateImage,
    		updateLocation,
    		imageForm,
    		saveData,
    		handleFiles,
    		$imageForm
    	});

    	$$self.$inject_state = $$props => {
    		if ("imageObj" in $$props) $$invalidate(0, imageObj = $$props.imageObj);
    		if ("thumbnailImage" in $$props) $$invalidate(1, thumbnailImage = $$props.thumbnailImage);
    		if ("fullsizeImage" in $$props) $$invalidate(2, fullsizeImage = $$props.fullsizeImage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		imageObj,
    		thumbnailImage,
    		fullsizeImage,
    		$imageForm,
    		updateImage,
    		updateLocation,
    		imageForm,
    		saveData,
    		handleFiles,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class AddPlaceToBe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddPlaceToBe",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\components\Login.svelte generated by Svelte v3.20.1 */

    const { console: console_1$4 } = globals;
    const file$n = "src\\components\\Login.svelte";

    // (92:2) {:else}
    function create_else_block$2(ctx) {
    	let h1;
    	let t1;
    	let h3;
    	let t2;
    	let t3_value = /*user*/ ctx[1].email + "";
    	let t3;
    	let t4;
    	let form_1;
    	let current;
    	let dispose;

    	const button = new Button_1({
    			props: {
    				class: "formButton",
    				variant: "raised",
    				$$slots: { default: [create_default_slot_4$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "LoggedIn";
    			t1 = space();
    			h3 = element("h3");
    			t2 = text("As: ");
    			t3 = text(t3_value);
    			t4 = space();
    			form_1 = element("form");
    			create_component(button.$$.fragment);
    			add_location(h1, file$n, 92, 4, 2508);
    			add_location(h3, file$n, 93, 4, 2531);
    			add_location(form_1, file$n, 94, 4, 2562);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t2);
    			append_dev(h3, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, form_1, anchor);
    			mount_component(button, form_1, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(form_1, "submit", /*logoutUser*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*user*/ 2) && t3_value !== (t3_value = /*user*/ ctx[1].email + "")) set_data_dev(t3, t3_value);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(form_1);
    			destroy_component(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(92:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (66:2) {#if showLogin}
    function create_if_block$8(ctx) {
    	let h1;
    	let t1;
    	let form_1;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let br;
    	let t5;
    	let div1;
    	let label1;
    	let t7;
    	let input1;
    	let t8;
    	let t9;
    	let current;
    	let dispose;

    	const button0 = new Button_1({
    			props: {
    				disabled: !/*$loginForm*/ ctx[3].valid || /*loginObj*/ ctx[0].email.length == 0 || /*loginObj*/ ctx[0].password.length == 0,
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot_2$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button_1({
    			props: {
    				disabled: !/*$loginForm*/ ctx[3].email.valid || /*loginObj*/ ctx[0].email.length == 0,
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*sendPasswordResetLink*/ ctx[6]);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Login";
    			t1 = space();
    			form_1 = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email Address";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			br = element("br");
    			t5 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			create_component(button0.$$.fragment);
    			t9 = space();
    			create_component(button1.$$.fragment);
    			add_location(h1, file$n, 66, 4, 1636);
    			attr_dev(label0, "for", "email");
    			add_location(label0, file$n, 69, 8, 1725);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "email");
    			add_location(input0, file$n, 70, 8, 1775);
    			add_location(div0, file$n, 68, 6, 1710);
    			add_location(br, file$n, 72, 6, 1859);
    			attr_dev(label1, "for", "password");
    			add_location(label1, file$n, 74, 8, 1888);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "name", "password");
    			add_location(input1, file$n, 75, 8, 1936);
    			add_location(div1, file$n, 73, 6, 1873);
    			attr_dev(form_1, "class", "lurinForm");
    			add_location(form_1, file$n, 67, 4, 1656);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form_1, anchor);
    			append_dev(form_1, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*loginObj*/ ctx[0].email);
    			append_dev(form_1, t4);
    			append_dev(form_1, br);
    			append_dev(form_1, t5);
    			append_dev(form_1, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t7);
    			append_dev(div1, input1);
    			set_input_value(input1, /*loginObj*/ ctx[0].password);
    			append_dev(form_1, t8);
    			mount_component(button0, form_1, null);
    			insert_dev(target, t9, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    				listen_dev(form_1, "submit", /*loginUser*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*loginObj*/ 1 && input0.value !== /*loginObj*/ ctx[0].email) {
    				set_input_value(input0, /*loginObj*/ ctx[0].email);
    			}

    			if (dirty & /*loginObj*/ 1 && input1.value !== /*loginObj*/ ctx[0].password) {
    				set_input_value(input1, /*loginObj*/ ctx[0].password);
    			}

    			const button0_changes = {};
    			if (dirty & /*$loginForm, loginObj*/ 9) button0_changes.disabled = !/*$loginForm*/ ctx[3].valid || /*loginObj*/ ctx[0].email.length == 0 || /*loginObj*/ ctx[0].password.length == 0;

    			if (dirty & /*$$scope*/ 2048) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};
    			if (dirty & /*$loginForm, loginObj*/ 9) button1_changes.disabled = !/*$loginForm*/ ctx[3].email.valid || /*loginObj*/ ctx[0].email.length == 0;

    			if (dirty & /*$$scope*/ 2048) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form_1);
    			destroy_component(button0);
    			if (detaching) detach_dev(t9);
    			destroy_component(button1, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(66:2) {#if showLogin}",
    		ctx
    	});

    	return block;
    }

    // (97:8) <Label>
    function create_default_slot_5$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Logout");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$3.name,
    		type: "slot",
    		source: "(97:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (96:6) <Button class="formButton" variant="raised">
    function create_default_slot_4$4(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_5$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$4.name,
    		type: "slot",
    		source: "(96:6) <Button class=\\\"formButton\\\" variant=\\\"raised\\\">",
    		ctx
    	});

    	return block;
    }

    // (82:8) <Label>
    function create_default_slot_3$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Login");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$6.name,
    		type: "slot",
    		source: "(82:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (78:6) <Button          disabled={!$loginForm.valid || loginObj.email.length == 0 || loginObj.password.length == 0}          variant="raised"          class="formButton">
    function create_default_slot_2$6(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_3$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$6.name,
    		type: "slot",
    		source: "(78:6) <Button          disabled={!$loginForm.valid || loginObj.email.length == 0 || loginObj.password.length == 0}          variant=\\\"raised\\\"          class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (90:6) <Label>
    function create_default_slot_1$8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Send password reset link");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$8.name,
    		type: "slot",
    		source: "(90:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (85:4) <Button        on:click={sendPasswordResetLink}        disabled={!$loginForm.email.valid || loginObj.email.length == 0}        variant="raised"        class="formButton">
    function create_default_slot$a(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(85:4) <Button        on:click={sendPasswordResetLink}        disabled={!$loginForm.email.valid || loginObj.email.length == 0}        variant=\\\"raised\\\"        class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$8, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*showLogin*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "contentpadding");
    			add_location(div, file$n, 64, 0, 1583);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let $loginForm;
    	let loginObj = { email: "", password: "" };
    	let user = {};
    	let showLogin = true;

    	const unsubscribe = userStore.subscribe(u => {
    		$$invalidate(2, showLogin = !u.loggedIn);
    		$$invalidate(1, user = u);
    	});

    	const loginForm = form(() => ({
    		email: {
    			value: loginObj.email,
    			validators: ["required", "email", "min:5", "max:150"]
    		},
    		password: {
    			value: loginObj.password,
    			validators: ["required", "min:5", "max:80"]
    		}
    	}));

    	validate_store(loginForm, "loginForm");
    	component_subscribe($$self, loginForm, value => $$invalidate(3, $loginForm = value));

    	function logoutUser(e) {
    		e.preventDefault();
    		logout().then(u => $$invalidate(1, user = u));
    		return false;
    	}

    	function sendPasswordResetLink() {
    		resetPasswordRequest(user).then(resposne => {
    			notify("Password reset email sent. I hope you remember the password of your email account.");
    		});
    	}

    	async function loginUser(e) {
    		e.preventDefault();

    		if (!navigator.onLine) {
    			notify("Your internet connection is lost and lurin couldn't fix it. try later.");
    			return false;
    		}

    		try {
    			await login(loginObj);
    		} catch(e) {
    			console.log("login error:", e);
    			notify("oooups, lurin didn't let you login.");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Login", $$slots, []);

    	function input0_input_handler() {
    		loginObj.email = this.value;
    		$$invalidate(0, loginObj);
    	}

    	function input1_input_handler() {
    		loginObj.password = this.value;
    		$$invalidate(0, loginObj);
    	}

    	$$self.$capture_state = () => ({
    		login,
    		logout,
    		userStore,
    		resetPasswordRequest,
    		form,
    		Button: Button_1,
    		Label,
    		notify,
    		loginObj,
    		user,
    		showLogin,
    		unsubscribe,
    		loginForm,
    		logoutUser,
    		sendPasswordResetLink,
    		loginUser,
    		$loginForm
    	});

    	$$self.$inject_state = $$props => {
    		if ("loginObj" in $$props) $$invalidate(0, loginObj = $$props.loginObj);
    		if ("user" in $$props) $$invalidate(1, user = $$props.user);
    		if ("showLogin" in $$props) $$invalidate(2, showLogin = $$props.showLogin);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		loginObj,
    		user,
    		showLogin,
    		$loginForm,
    		loginForm,
    		logoutUser,
    		sendPasswordResetLink,
    		loginUser,
    		unsubscribe,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\components\ImageFullScreen.svelte generated by Svelte v3.20.1 */

    const { console: console_1$5 } = globals;
    const file$o = "src\\components\\ImageFullScreen.svelte";

    // (73:6) <IconButton         on:click={() => page('/' + backUrl + '#:~:text=' + encodeURIComponent(image.imageTitle))}         class="lurinsnavicons material-icons"         aria-label="Open map">
    function create_default_slot_4$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("close");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$5.name,
    		type: "slot",
    		source: "(73:6) <IconButton         on:click={() => page('/' + backUrl + '#:~:text=' + encodeURIComponent(image.imageTitle))}         class=\\\"lurinsnavicons material-icons\\\"         aria-label=\\\"Open map\\\">",
    		ctx
    	});

    	return block;
    }

    // (80:6) <IconButton         on:click={() => page('/map?key=' + image.key)}         class="lurinsnavicons material-icons"         aria-label="Open map">
    function create_default_slot_3$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("place");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$7.name,
    		type: "slot",
    		source: "(80:6) <IconButton         on:click={() => page('/map?key=' + image.key)}         class=\\\"lurinsnavicons material-icons\\\"         aria-label=\\\"Open map\\\">",
    		ctx
    	});

    	return block;
    }

    // (86:6) <IconButton         on:click={toggleZoom}         class="lurinsnavicons material-icons"         aria-label="Toggle zoom">
    function create_default_slot_2$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("aspect_ratio");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$7.name,
    		type: "slot",
    		source: "(86:6) <IconButton         on:click={toggleZoom}         class=\\\"lurinsnavicons material-icons\\\"         aria-label=\\\"Toggle zoom\\\">",
    		ctx
    	});

    	return block;
    }

    // (100:6) {:else}
    function create_else_block$3(ctx) {
    	let current;

    	const iconbutton = new IconButton({
    			props: {
    				class: "lurinsnavicons material-icons",
    				"aria-label": "placeholder",
    				$$slots: { default: [create_default_slot_1$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(iconbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(iconbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const iconbutton_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				iconbutton_changes.$$scope = { dirty, ctx };
    			}

    			iconbutton.$set(iconbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(iconbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(100:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (93:6) {#if canShare}
    function create_if_block$9(ctx) {
    	let current;

    	const iconbutton = new IconButton({
    			props: {
    				class: "lurinsnavicons material-icons",
    				"aria-label": "Back",
    				$$slots: { default: [create_default_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	iconbutton.$on("click", /*shareImage*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(iconbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(iconbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const iconbutton_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				iconbutton_changes.$$scope = { dirty, ctx };
    			}

    			iconbutton.$set(iconbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(iconbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(93:6) {#if canShare}",
    		ctx
    	});

    	return block;
    }

    // (101:8) <IconButton           class="lurinsnavicons material-icons"           aria-label="placeholder">
    function create_default_slot_1$9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("_");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$9.name,
    		type: "slot",
    		source: "(101:8) <IconButton           class=\\\"lurinsnavicons material-icons\\\"           aria-label=\\\"placeholder\\\">",
    		ctx
    	});

    	return block;
    }

    // (94:8) <IconButton           on:click={shareImage}           class="lurinsnavicons material-icons"           aria-label="Back">
    function create_default_slot$b(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("share");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(94:8) <IconButton           on:click={shareImage}           class=\\\"lurinsnavicons material-icons\\\"           aria-label=\\\"Back\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let div7;
    	let div0;
    	let t0;
    	let div6;
    	let div4;
    	let div1;
    	let span;
    	let t1_value = /*image*/ ctx[0].imageTitle + "";
    	let t1;
    	let t2;
    	let div2;
    	let t3_value = /*image*/ ctx[0].funFact + "";
    	let t3;
    	let t4;
    	let div3;
    	let t5_value = getDisplayTime(/*image*/ ctx[0].insertTime) + "";
    	let t5;
    	let t6;
    	let div5;
    	let t7;
    	let t8;
    	let t9;
    	let current_block_type_index;
    	let if_block;
    	let div7_style_value;
    	let current;
    	let dispose;

    	const iconbutton0 = new IconButton({
    			props: {
    				class: "lurinsnavicons material-icons",
    				"aria-label": "Open map",
    				$$slots: { default: [create_default_slot_4$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	iconbutton0.$on("click", /*click_handler*/ ctx[10]);

    	const iconbutton1 = new IconButton({
    			props: {
    				class: "lurinsnavicons material-icons",
    				"aria-label": "Open map",
    				$$slots: { default: [create_default_slot_3$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	iconbutton1.$on("click", /*click_handler_1*/ ctx[11]);

    	const iconbutton2 = new IconButton({
    			props: {
    				class: "lurinsnavicons material-icons",
    				"aria-label": "Toggle zoom",
    				$$slots: { default: [create_default_slot_2$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	iconbutton2.$on("click", /*toggleZoom*/ ctx[7]);
    	const if_block_creators = [create_if_block$9, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*canShare*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div6 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div3 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div5 = element("div");
    			create_component(iconbutton0.$$.fragment);
    			t7 = space();
    			create_component(iconbutton1.$$.fragment);
    			t8 = space();
    			create_component(iconbutton2.$$.fragment);
    			t9 = space();
    			if_block.c();
    			attr_dev(div0, "class", "showHideInfoArea svelte-hppwgu");
    			add_location(div0, file$o, 55, 2, 2239);
    			attr_dev(span, "class", "title svelte-hppwgu");
    			add_location(span, file$o, 66, 8, 2525);
    			attr_dev(div1, "class", "svelte-hppwgu");
    			add_location(div1, file$o, 65, 6, 2511);
    			attr_dev(div2, "class", "text svelte-hppwgu");
    			add_location(div2, file$o, 68, 6, 2590);
    			attr_dev(div3, "class", "text svelte-hppwgu");
    			add_location(div3, file$o, 69, 6, 2636);
    			attr_dev(div4, "class", "svelte-hppwgu");
    			add_location(div4, file$o, 64, 4, 2499);
    			attr_dev(div5, "class", "svelte-hppwgu");
    			add_location(div5, file$o, 71, 4, 2710);
    			attr_dev(div6, "class", "textContainer svelte-hppwgu");
    			set_style(div6, "visibility", /*showTextContainer*/ ctx[2] ? "inherit" : "hidden");
    			add_location(div6, file$o, 61, 2, 2396);
    			attr_dev(div7, "class", "container svelte-hppwgu");
    			attr_dev(div7, "style", div7_style_value = "background-image: url('" + /*image*/ ctx[0].url + "'); " + /*backgroundSize*/ ctx[3]);
    			add_location(div7, file$o, 52, 0, 2146);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div7, t0);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, div1);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div2, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, t5);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			mount_component(iconbutton0, div5, null);
    			append_dev(div5, t7);
    			mount_component(iconbutton1, div5, null);
    			append_dev(div5, t8);
    			mount_component(iconbutton2, div5, null);
    			append_dev(div5, t9);
    			if_blocks[current_block_type_index].m(div5, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div0, "mousedown", /*toggleText*/ ctx[5], false, false, false),
    				listen_dev(div0, "touchstart", /*toggleText*/ ctx[5], { passive: true }, false, false),
    				listen_dev(div0, "touchend", /*toggleText*/ ctx[5], { passive: true }, false, false),
    				listen_dev(div0, "mouseup", /*toggleText*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*image*/ 1) && t1_value !== (t1_value = /*image*/ ctx[0].imageTitle + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*image*/ 1) && t3_value !== (t3_value = /*image*/ ctx[0].funFact + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*image*/ 1) && t5_value !== (t5_value = getDisplayTime(/*image*/ ctx[0].insertTime) + "")) set_data_dev(t5, t5_value);
    			const iconbutton0_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				iconbutton0_changes.$$scope = { dirty, ctx };
    			}

    			iconbutton0.$set(iconbutton0_changes);
    			const iconbutton1_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				iconbutton1_changes.$$scope = { dirty, ctx };
    			}

    			iconbutton1.$set(iconbutton1_changes);
    			const iconbutton2_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				iconbutton2_changes.$$scope = { dirty, ctx };
    			}

    			iconbutton2.$set(iconbutton2_changes);
    			if_block.p(ctx, dirty);

    			if (!current || dirty & /*showTextContainer*/ 4) {
    				set_style(div6, "visibility", /*showTextContainer*/ ctx[2] ? "inherit" : "hidden");
    			}

    			if (!current || dirty & /*image, backgroundSize*/ 9 && div7_style_value !== (div7_style_value = "background-image: url('" + /*image*/ ctx[0].url + "'); " + /*backgroundSize*/ ctx[3])) {
    				attr_dev(div7, "style", div7_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton0.$$.fragment, local);
    			transition_in(iconbutton1.$$.fragment, local);
    			transition_in(iconbutton2.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbutton0.$$.fragment, local);
    			transition_out(iconbutton1.$$.fragment, local);
    			transition_out(iconbutton2.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(iconbutton0);
    			destroy_component(iconbutton1);
    			destroy_component(iconbutton2);
    			if_blocks[current_block_type_index].d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { image } = $$props;
    	let { backUrl } = $$props;
    	let { imageRatioContain = false } = $$props;
    	let showTextContainer = true;
    	let backgroundSize = "background-size: cover;";
    	let dispatcher = createEventDispatcher();
    	const canShare = "canShare" in navigator;

    	function toggleText() {
    		$$invalidate(2, showTextContainer = !showTextContainer);
    	}

    	async function shareImage(e) {
    		let response = await fetch(image.fullImageSizeUrl);
    		let data = await response.blob();
    		let metadata = { type: "image/jpeg" };
    		let file = new File([data], image.key + ".jpg", metadata);
    		const files = [file];

    		if (canShare && navigator.canShare({ files })) {
    			try {
    				navigator.share({ files });
    			} catch(ex) {
    				console.log("sharerror", ex);
    			}
    		}
    	}

    	function toggleZoom() {
    		$$invalidate(8, imageRatioContain = !imageRatioContain);

    		if (imageRatioContain) {
    			$$invalidate(3, backgroundSize = "background-size: contain;");
    		} else {
    			$$invalidate(3, backgroundSize = "background-size: cover;");
    		}

    		dispatcher("imageratiochanged", { imageRatioContain });
    	}

    	const writable_props = ["image", "backUrl", "imageRatioContain"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<ImageFullScreen> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImageFullScreen", $$slots, []);
    	const click_handler = () => page_js("/" + backUrl + "#:~:text=" + encodeURIComponent(image.imageTitle));
    	const click_handler_1 = () => page_js("/map?key=" + image.key);

    	$$self.$set = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("backUrl" in $$props) $$invalidate(1, backUrl = $$props.backUrl);
    		if ("imageRatioContain" in $$props) $$invalidate(8, imageRatioContain = $$props.imageRatioContain);
    	};

    	$$self.$capture_state = () => ({
    		IconButton,
    		Icon,
    		getDisplayTime,
    		createEventDispatcher,
    		page: page_js,
    		image,
    		backUrl,
    		imageRatioContain,
    		showTextContainer,
    		backgroundSize,
    		dispatcher,
    		canShare,
    		toggleText,
    		shareImage,
    		toggleZoom
    	});

    	$$self.$inject_state = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("backUrl" in $$props) $$invalidate(1, backUrl = $$props.backUrl);
    		if ("imageRatioContain" in $$props) $$invalidate(8, imageRatioContain = $$props.imageRatioContain);
    		if ("showTextContainer" in $$props) $$invalidate(2, showTextContainer = $$props.showTextContainer);
    		if ("backgroundSize" in $$props) $$invalidate(3, backgroundSize = $$props.backgroundSize);
    		if ("dispatcher" in $$props) dispatcher = $$props.dispatcher;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		image,
    		backUrl,
    		showTextContainer,
    		backgroundSize,
    		canShare,
    		toggleText,
    		shareImage,
    		toggleZoom,
    		imageRatioContain,
    		dispatcher,
    		click_handler,
    		click_handler_1
    	];
    }

    class ImageFullScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {
    			image: 0,
    			backUrl: 1,
    			imageRatioContain: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageFullScreen",
    			options,
    			id: create_fragment$q.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[0] === undefined && !("image" in props)) {
    			console_1$5.warn("<ImageFullScreen> was created without expected prop 'image'");
    		}

    		if (/*backUrl*/ ctx[1] === undefined && !("backUrl" in props)) {
    			console_1$5.warn("<ImageFullScreen> was created without expected prop 'backUrl'");
    		}
    	}

    	get image() {
    		throw new Error("<ImageFullScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<ImageFullScreen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get backUrl() {
    		throw new Error("<ImageFullScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backUrl(value) {
    		throw new Error("<ImageFullScreen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imageRatioContain() {
    		throw new Error("<ImageFullScreen>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageRatioContain(value) {
    		throw new Error("<ImageFullScreen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ImageFullScreenSwipe.svelte generated by Svelte v3.20.1 */

    const { Object: Object_1, console: console_1$6 } = globals;
    const file$p = "src\\components\\ImageFullScreenSwipe.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (99:2) {#each images as image}
    function create_each_block$3(ctx) {
    	let div;
    	let t;
    	let current;

    	const imagefullscreen = new ImageFullScreen({
    			props: {
    				backUrl: /*backUrl*/ ctx[3],
    				image: /*image*/ ctx[12],
    				imageRatioContain: /*imageRatioContain*/ ctx[1]
    			},
    			$$inline: true
    		});

    	imagefullscreen.$on("imageratiochanged", /*imageRatioChanged*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(imagefullscreen.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "slide svelte-1mbjqia");
    			add_location(div, file$p, 99, 4, 2776);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(imagefullscreen, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const imagefullscreen_changes = {};
    			if (dirty & /*images*/ 1) imagefullscreen_changes.image = /*image*/ ctx[12];
    			if (dirty & /*imageRatioContain*/ 2) imagefullscreen_changes.imageRatioContain = /*imageRatioContain*/ ctx[1];
    			imagefullscreen.$set(imagefullscreen_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagefullscreen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagefullscreen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(imagefullscreen);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(99:2) {#each images as image}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let div;
    	let current;
    	let dispose;
    	let each_value = /*images*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "slider svelte-1mbjqia");
    			add_location(div, file$p, 97, 0, 2679);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			/*div_binding*/ ctx[11](div);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(div, "scroll", /*sliderScrolled*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*backUrl, images, imageRatioContain, imageRatioChanged*/ 43) {
    				each_value = /*images*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			/*div_binding*/ ctx[11](null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let { params } = $$props;
    	let images = [];
    	let imageRatioContain = false;
    	let slider;
    	let defaultIndex = -1;
    	let backUrl = params.backUrl;

    	onMount(async function () {
    		let imageObservable = await subscribeToImages();

    		imageObservable.subscribe(x => {
    			var idx = x.findIndex(y => y.key == params.key);
    			console.log("default index is:", idx);

    			$$invalidate(0, images = x.map(x => {
    				x.url = x.fullImageSizeUrl || x.thumbnail;
    				return x;
    			}));

    			if (idx == -1) {
    				idx = 0;
    			} else if (defaultIndex != idx) {
    				defaultIndex = idx;
    				preloadImage(defaultIndex);
    				preloadImage(defaultIndex + 1);
    				preloadImage(defaultIndex - 1);
    			}
    		});

    		notify("use arrow keys or swipe to navigate between images.");
    		await tick();
    		$$invalidate(2, slider.scrollLeft = slider.scrollWidth / images.length * defaultIndex, slider);
    	});

    	function getIndex(idx) {
    		if (idx < 0) {
    			idx = images.length - 1;
    		}

    		if (images.length <= idx) {
    			idx = 0;
    		}

    		return idx;
    	}

    	function preloadImage(idx) {
    		idx = getIndex(idx);
    		let i = images[idx];

    		if (!i || i.fullImageSizeUrl) {
    			console.log(i.imageTitle + " is already preloaded");
    			return;
    		}

    		loadFullSizeImage(i).then(url => {
    			i.fullImageSizeUrl = url;
    			i.url = url;
    			console.log("preload ok for: " + i.imageTitle, idx);
    			$$invalidate(0, images[idx] = Object.assign({}, i), images);
    		});
    	}

    	function sliderScrolled(e) {
    		let width = e.target.scrollWidth / images.length;
    		let idx = Math.round(e.target.scrollLeft / width, 0);

    		if (idx != defaultIndex) {
    			activeChanged(idx);
    		}
    	}

    	function imageRatioChanged(e) {
    		$$invalidate(1, imageRatioContain = e.detail.imageRatioContain);
    	}

    	function activeChanged(idx) {
    		defaultIndex = idx;
    		console.log("activechange to:", images[idx].imageTitle, idx);
    		tick();
    		page_js("/slideShow?key=" + images[idx].key);
    		preloadImage(idx + 2);
    		preloadImage(idx + 1);
    		preloadImage(idx - 1);
    		preloadImage(idx - 2);
    	}

    	const writable_props = ["params"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$6.warn(`<ImageFullScreenSwipe> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ImageFullScreenSwipe", $$slots, []);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, slider = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		ImageFullScreen,
    		subscribeToImages,
    		loadFullSizeImage,
    		tick,
    		onMount,
    		notify,
    		writable,
    		page: page_js,
    		params,
    		images,
    		imageRatioContain,
    		slider,
    		defaultIndex,
    		backUrl,
    		getIndex,
    		preloadImage,
    		sliderScrolled,
    		imageRatioChanged,
    		activeChanged
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    		if ("imageRatioContain" in $$props) $$invalidate(1, imageRatioContain = $$props.imageRatioContain);
    		if ("slider" in $$props) $$invalidate(2, slider = $$props.slider);
    		if ("defaultIndex" in $$props) defaultIndex = $$props.defaultIndex;
    		if ("backUrl" in $$props) $$invalidate(3, backUrl = $$props.backUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		images,
    		imageRatioContain,
    		slider,
    		backUrl,
    		sliderScrolled,
    		imageRatioChanged,
    		params,
    		defaultIndex,
    		getIndex,
    		preloadImage,
    		activeChanged,
    		div_binding
    	];
    }

    class ImageFullScreenSwipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageFullScreenSwipe",
    			options,
    			id: create_fragment$r.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
    			console_1$6.warn("<ImageFullScreenSwipe> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<ImageFullScreenSwipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ImageFullScreenSwipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$6 = {
        FIXED_CLASS: 'mdc-top-app-bar--fixed',
        FIXED_SCROLLED_CLASS: 'mdc-top-app-bar--fixed-scrolled',
        SHORT_CLASS: 'mdc-top-app-bar--short',
        SHORT_COLLAPSED_CLASS: 'mdc-top-app-bar--short-collapsed',
        SHORT_HAS_ACTION_ITEM_CLASS: 'mdc-top-app-bar--short-has-action-item',
    };
    var numbers$2 = {
        DEBOUNCE_THROTTLE_RESIZE_TIME_MS: 100,
        MAX_TOP_APP_BAR_HEIGHT: 128,
    };
    var strings$8 = {
        ACTION_ITEM_SELECTOR: '.mdc-top-app-bar__action-item',
        NAVIGATION_EVENT: 'MDCTopAppBar:nav',
        NAVIGATION_ICON_SELECTOR: '.mdc-top-app-bar__navigation-icon',
        ROOT_SELECTOR: '.mdc-top-app-bar',
        TITLE_SELECTOR: '.mdc-top-app-bar__title',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTopAppBarBaseFoundation = /** @class */ (function (_super) {
        __extends(MDCTopAppBarBaseFoundation, _super);
        /* istanbul ignore next: optional argument is not a branch statement */
        function MDCTopAppBarBaseFoundation(adapter) {
            return _super.call(this, __assign({}, MDCTopAppBarBaseFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCTopAppBarBaseFoundation, "strings", {
            get: function () {
                return strings$8;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTopAppBarBaseFoundation, "cssClasses", {
            get: function () {
                return cssClasses$6;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTopAppBarBaseFoundation, "numbers", {
            get: function () {
                return numbers$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTopAppBarBaseFoundation, "defaultAdapter", {
            /**
             * See {@link MDCTopAppBarAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    hasClass: function () { return false; },
                    setStyle: function () { return undefined; },
                    getTopAppBarHeight: function () { return 0; },
                    notifyNavigationIconClicked: function () { return undefined; },
                    getViewportScrollY: function () { return 0; },
                    getTotalActionItems: function () { return 0; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        /** Other variants of TopAppBar foundation overrides this method */
        MDCTopAppBarBaseFoundation.prototype.handleTargetScroll = function () { }; // tslint:disable-line:no-empty
        /** Other variants of TopAppBar foundation overrides this method */
        MDCTopAppBarBaseFoundation.prototype.handleWindowResize = function () { }; // tslint:disable-line:no-empty
        MDCTopAppBarBaseFoundation.prototype.handleNavigationClick = function () {
            this.adapter_.notifyNavigationIconClicked();
        };
        return MDCTopAppBarBaseFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var INITIAL_VALUE = 0;
    var MDCTopAppBarFoundation = /** @class */ (function (_super) {
        __extends(MDCTopAppBarFoundation, _super);
        /* istanbul ignore next: optional argument is not a branch statement */
        function MDCTopAppBarFoundation(adapter) {
            var _this = _super.call(this, adapter) || this;
            /**
             * Indicates if the top app bar was docked in the previous scroll handler iteration.
             */
            _this.wasDocked_ = true;
            /**
             * Indicates if the top app bar is docked in the fully shown position.
             */
            _this.isDockedShowing_ = true;
            /**
             * Variable for current scroll position of the top app bar
             */
            _this.currentAppBarOffsetTop_ = 0;
            /**
             * Used to prevent the top app bar from being scrolled out of view during resize events
             */
            _this.isCurrentlyBeingResized_ = false;
            /**
             * The timeout that's used to throttle the resize events
             */
            _this.resizeThrottleId_ = INITIAL_VALUE;
            /**
             * The timeout that's used to debounce toggling the isCurrentlyBeingResized_ variable after a resize
             */
            _this.resizeDebounceId_ = INITIAL_VALUE;
            _this.lastScrollPosition_ = _this.adapter_.getViewportScrollY();
            _this.topAppBarHeight_ = _this.adapter_.getTopAppBarHeight();
            return _this;
        }
        MDCTopAppBarFoundation.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.adapter_.setStyle('top', '');
        };
        /**
         * Scroll handler for the default scroll behavior of the top app bar.
         * @override
         */
        MDCTopAppBarFoundation.prototype.handleTargetScroll = function () {
            var currentScrollPosition = Math.max(this.adapter_.getViewportScrollY(), 0);
            var diff = currentScrollPosition - this.lastScrollPosition_;
            this.lastScrollPosition_ = currentScrollPosition;
            // If the window is being resized the lastScrollPosition_ needs to be updated but the
            // current scroll of the top app bar should stay in the same position.
            if (!this.isCurrentlyBeingResized_) {
                this.currentAppBarOffsetTop_ -= diff;
                if (this.currentAppBarOffsetTop_ > 0) {
                    this.currentAppBarOffsetTop_ = 0;
                }
                else if (Math.abs(this.currentAppBarOffsetTop_) > this.topAppBarHeight_) {
                    this.currentAppBarOffsetTop_ = -this.topAppBarHeight_;
                }
                this.moveTopAppBar_();
            }
        };
        /**
         * Top app bar resize handler that throttle/debounce functions that execute updates.
         * @override
         */
        MDCTopAppBarFoundation.prototype.handleWindowResize = function () {
            var _this = this;
            // Throttle resize events 10 p/s
            if (!this.resizeThrottleId_) {
                this.resizeThrottleId_ = setTimeout(function () {
                    _this.resizeThrottleId_ = INITIAL_VALUE;
                    _this.throttledResizeHandler_();
                }, numbers$2.DEBOUNCE_THROTTLE_RESIZE_TIME_MS);
            }
            this.isCurrentlyBeingResized_ = true;
            if (this.resizeDebounceId_) {
                clearTimeout(this.resizeDebounceId_);
            }
            this.resizeDebounceId_ = setTimeout(function () {
                _this.handleTargetScroll();
                _this.isCurrentlyBeingResized_ = false;
                _this.resizeDebounceId_ = INITIAL_VALUE;
            }, numbers$2.DEBOUNCE_THROTTLE_RESIZE_TIME_MS);
        };
        /**
         * Function to determine if the DOM needs to update.
         */
        MDCTopAppBarFoundation.prototype.checkForUpdate_ = function () {
            var offscreenBoundaryTop = -this.topAppBarHeight_;
            var hasAnyPixelsOffscreen = this.currentAppBarOffsetTop_ < 0;
            var hasAnyPixelsOnscreen = this.currentAppBarOffsetTop_ > offscreenBoundaryTop;
            var partiallyShowing = hasAnyPixelsOffscreen && hasAnyPixelsOnscreen;
            // If it's partially showing, it can't be docked.
            if (partiallyShowing) {
                this.wasDocked_ = false;
            }
            else {
                // Not previously docked and not partially showing, it's now docked.
                if (!this.wasDocked_) {
                    this.wasDocked_ = true;
                    return true;
                }
                else if (this.isDockedShowing_ !== hasAnyPixelsOnscreen) {
                    this.isDockedShowing_ = hasAnyPixelsOnscreen;
                    return true;
                }
            }
            return partiallyShowing;
        };
        /**
         * Function to move the top app bar if needed.
         */
        MDCTopAppBarFoundation.prototype.moveTopAppBar_ = function () {
            if (this.checkForUpdate_()) {
                // Once the top app bar is fully hidden we use the max potential top app bar height as our offset
                // so the top app bar doesn't show if the window resizes and the new height > the old height.
                var offset = this.currentAppBarOffsetTop_;
                if (Math.abs(offset) >= this.topAppBarHeight_) {
                    offset = -numbers$2.MAX_TOP_APP_BAR_HEIGHT;
                }
                this.adapter_.setStyle('top', offset + 'px');
            }
        };
        /**
         * Throttled function that updates the top app bar scrolled values if the
         * top app bar height changes.
         */
        MDCTopAppBarFoundation.prototype.throttledResizeHandler_ = function () {
            var currentHeight = this.adapter_.getTopAppBarHeight();
            if (this.topAppBarHeight_ !== currentHeight) {
                this.wasDocked_ = false;
                // Since the top app bar has a different height depending on the screen width, this
                // will ensure that the top app bar remains in the correct location if
                // completely hidden and a resize makes the top app bar a different height.
                this.currentAppBarOffsetTop_ -= this.topAppBarHeight_ - currentHeight;
                this.topAppBarHeight_ = currentHeight;
            }
            this.handleTargetScroll();
        };
        return MDCTopAppBarFoundation;
    }(MDCTopAppBarBaseFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFixedTopAppBarFoundation = /** @class */ (function (_super) {
        __extends(MDCFixedTopAppBarFoundation, _super);
        function MDCFixedTopAppBarFoundation() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * State variable for the previous scroll iteration top app bar state
             */
            _this.wasScrolled_ = false;
            return _this;
        }
        /**
         * Scroll handler for applying/removing the modifier class on the fixed top app bar.
         * @override
         */
        MDCFixedTopAppBarFoundation.prototype.handleTargetScroll = function () {
            var currentScroll = this.adapter_.getViewportScrollY();
            if (currentScroll <= 0) {
                if (this.wasScrolled_) {
                    this.adapter_.removeClass(cssClasses$6.FIXED_SCROLLED_CLASS);
                    this.wasScrolled_ = false;
                }
            }
            else {
                if (!this.wasScrolled_) {
                    this.adapter_.addClass(cssClasses$6.FIXED_SCROLLED_CLASS);
                    this.wasScrolled_ = true;
                }
            }
        };
        return MDCFixedTopAppBarFoundation;
    }(MDCTopAppBarFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCShortTopAppBarFoundation = /** @class */ (function (_super) {
        __extends(MDCShortTopAppBarFoundation, _super);
        /* istanbul ignore next: optional argument is not a branch statement */
        function MDCShortTopAppBarFoundation(adapter) {
            var _this = _super.call(this, adapter) || this;
            _this.isCollapsed_ = false;
            _this.isAlwaysCollapsed_ = false;
            return _this;
        }
        Object.defineProperty(MDCShortTopAppBarFoundation.prototype, "isCollapsed", {
            // Public visibility for backward compatibility.
            get: function () {
                return this.isCollapsed_;
            },
            enumerable: true,
            configurable: true
        });
        MDCShortTopAppBarFoundation.prototype.init = function () {
            _super.prototype.init.call(this);
            if (this.adapter_.getTotalActionItems() > 0) {
                this.adapter_.addClass(cssClasses$6.SHORT_HAS_ACTION_ITEM_CLASS);
            }
            // If initialized with SHORT_COLLAPSED_CLASS, the bar should always be collapsed
            this.setAlwaysCollapsed(this.adapter_.hasClass(cssClasses$6.SHORT_COLLAPSED_CLASS));
        };
        /**
         * Set if the short top app bar should always be collapsed.
         *
         * @param value When `true`, bar will always be collapsed. When `false`, bar may collapse or expand based on scroll.
         */
        MDCShortTopAppBarFoundation.prototype.setAlwaysCollapsed = function (value) {
            this.isAlwaysCollapsed_ = !!value;
            if (this.isAlwaysCollapsed_) {
                this.collapse_();
            }
            else {
                // let maybeCollapseBar_ determine if the bar should be collapsed
                this.maybeCollapseBar_();
            }
        };
        MDCShortTopAppBarFoundation.prototype.getAlwaysCollapsed = function () {
            return this.isAlwaysCollapsed_;
        };
        /**
         * Scroll handler for applying/removing the collapsed modifier class on the short top app bar.
         * @override
         */
        MDCShortTopAppBarFoundation.prototype.handleTargetScroll = function () {
            this.maybeCollapseBar_();
        };
        MDCShortTopAppBarFoundation.prototype.maybeCollapseBar_ = function () {
            if (this.isAlwaysCollapsed_) {
                return;
            }
            var currentScroll = this.adapter_.getViewportScrollY();
            if (currentScroll <= 0) {
                if (this.isCollapsed_) {
                    this.uncollapse_();
                }
            }
            else {
                if (!this.isCollapsed_) {
                    this.collapse_();
                }
            }
        };
        MDCShortTopAppBarFoundation.prototype.uncollapse_ = function () {
            this.adapter_.removeClass(cssClasses$6.SHORT_COLLAPSED_CLASS);
            this.isCollapsed_ = false;
        };
        MDCShortTopAppBarFoundation.prototype.collapse_ = function () {
            this.adapter_.addClass(cssClasses$6.SHORT_COLLAPSED_CLASS);
            this.isCollapsed_ = true;
        };
        return MDCShortTopAppBarFoundation;
    }(MDCTopAppBarBaseFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTopAppBar = /** @class */ (function (_super) {
        __extends(MDCTopAppBar, _super);
        function MDCTopAppBar() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTopAppBar.attachTo = function (root) {
            return new MDCTopAppBar(root);
        };
        MDCTopAppBar.prototype.initialize = function (rippleFactory) {
            if (rippleFactory === void 0) { rippleFactory = function (el) { return MDCRipple.attachTo(el); }; }
            this.navIcon_ = this.root_.querySelector(strings$8.NAVIGATION_ICON_SELECTOR);
            // Get all icons in the toolbar and instantiate the ripples
            var icons = [].slice.call(this.root_.querySelectorAll(strings$8.ACTION_ITEM_SELECTOR));
            if (this.navIcon_) {
                icons.push(this.navIcon_);
            }
            this.iconRipples_ = icons.map(function (icon) {
                var ripple = rippleFactory(icon);
                ripple.unbounded = true;
                return ripple;
            });
            this.scrollTarget_ = window;
        };
        MDCTopAppBar.prototype.initialSyncWithDOM = function () {
            this.handleNavigationClick_ = this.foundation_.handleNavigationClick.bind(this.foundation_);
            this.handleWindowResize_ = this.foundation_.handleWindowResize.bind(this.foundation_);
            this.handleTargetScroll_ = this.foundation_.handleTargetScroll.bind(this.foundation_);
            this.scrollTarget_.addEventListener('scroll', this.handleTargetScroll_);
            if (this.navIcon_) {
                this.navIcon_.addEventListener('click', this.handleNavigationClick_);
            }
            var isFixed = this.root_.classList.contains(cssClasses$6.FIXED_CLASS);
            var isShort = this.root_.classList.contains(cssClasses$6.SHORT_CLASS);
            if (!isShort && !isFixed) {
                window.addEventListener('resize', this.handleWindowResize_);
            }
        };
        MDCTopAppBar.prototype.destroy = function () {
            this.iconRipples_.forEach(function (iconRipple) { return iconRipple.destroy(); });
            this.scrollTarget_.removeEventListener('scroll', this.handleTargetScroll_);
            if (this.navIcon_) {
                this.navIcon_.removeEventListener('click', this.handleNavigationClick_);
            }
            var isFixed = this.root_.classList.contains(cssClasses$6.FIXED_CLASS);
            var isShort = this.root_.classList.contains(cssClasses$6.SHORT_CLASS);
            if (!isShort && !isFixed) {
                window.removeEventListener('resize', this.handleWindowResize_);
            }
            _super.prototype.destroy.call(this);
        };
        MDCTopAppBar.prototype.setScrollTarget = function (target) {
            // Remove scroll handler from the previous scroll target
            this.scrollTarget_.removeEventListener('scroll', this.handleTargetScroll_);
            this.scrollTarget_ = target;
            // Initialize scroll handler on the new scroll target
            this.handleTargetScroll_ =
                this.foundation_.handleTargetScroll.bind(this.foundation_);
            this.scrollTarget_.addEventListener('scroll', this.handleTargetScroll_);
        };
        MDCTopAppBar.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                setStyle: function (property, value) { return _this.root_.style.setProperty(property, value); },
                getTopAppBarHeight: function () { return _this.root_.clientHeight; },
                notifyNavigationIconClicked: function () { return _this.emit(strings$8.NAVIGATION_EVENT, {}); },
                getViewportScrollY: function () {
                    var win = _this.scrollTarget_;
                    var el = _this.scrollTarget_;
                    return win.pageYOffset !== undefined ? win.pageYOffset : el.scrollTop;
                },
                getTotalActionItems: function () { return _this.root_.querySelectorAll(strings$8.ACTION_ITEM_SELECTOR).length; },
            };
            // tslint:enable:object-literal-sort-keys
            var foundation;
            if (this.root_.classList.contains(cssClasses$6.SHORT_CLASS)) {
                foundation = new MDCShortTopAppBarFoundation(adapter);
            }
            else if (this.root_.classList.contains(cssClasses$6.FIXED_CLASS)) {
                foundation = new MDCFixedTopAppBarFoundation(adapter);
            }
            else {
                foundation = new MDCTopAppBarFoundation(adapter);
            }
            return foundation;
        };
        return MDCTopAppBar;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules\@smui\top-app-bar\TopAppBar.svelte generated by Svelte v3.20.1 */
    const file$q = "node_modules\\@smui\\top-app-bar\\TopAppBar.svelte";

    function create_fragment$s(ctx) {
    	let header;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	let header_levels = [
    		{
    			class: "\n    mdc-top-app-bar\n    " + /*className*/ ctx[1] + "\n    " + (/*variant*/ ctx[2] === "short"
    			? "mdc-top-app-bar--short"
    			: "") + "\n    " + (/*collapsed*/ ctx[4]
    			? "mdc-top-app-bar--short-collapsed"
    			: "") + "\n    " + (/*variant*/ ctx[2] === "fixed"
    			? "mdc-top-app-bar--fixed"
    			: "") + "\n    " + (/*variant*/ ctx[2] === "static"
    			? "smui-top-app-bar--static"
    			: "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    			? "smui-top-app-bar--color-secondary"
    			: "") + "\n    " + (/*prominent*/ ctx[5] ? "mdc-top-app-bar--prominent" : "") + "\n    " + (/*dense*/ ctx[6] ? "mdc-top-app-bar--dense" : "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[9], ["use", "class", "variant", "color", "collapsed", "prominent", "dense"])
    	];

    	let header_data = {};

    	for (let i = 0; i < header_levels.length; i += 1) {
    		header_data = assign(header_data, header_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			if (default_slot) default_slot.c();
    			set_attributes(header, header_data);
    			add_location(header, file$q, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, header, anchor);

    			if (default_slot) {
    				default_slot.m(header, null);
    			}

    			/*header_binding*/ ctx[13](header);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, header, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[8].call(null, header))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2048) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[11], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null));
    				}
    			}

    			set_attributes(header, get_spread_update(header_levels, [
    				dirty & /*className, variant, collapsed, color, prominent, dense*/ 126 && {
    					class: "\n    mdc-top-app-bar\n    " + /*className*/ ctx[1] + "\n    " + (/*variant*/ ctx[2] === "short"
    					? "mdc-top-app-bar--short"
    					: "") + "\n    " + (/*collapsed*/ ctx[4]
    					? "mdc-top-app-bar--short-collapsed"
    					: "") + "\n    " + (/*variant*/ ctx[2] === "fixed"
    					? "mdc-top-app-bar--fixed"
    					: "") + "\n    " + (/*variant*/ ctx[2] === "static"
    					? "smui-top-app-bar--static"
    					: "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    					? "smui-top-app-bar--color-secondary"
    					: "") + "\n    " + (/*prominent*/ ctx[5] ? "mdc-top-app-bar--prominent" : "") + "\n    " + (/*dense*/ ctx[6] ? "mdc-top-app-bar--dense" : "") + "\n  "
    				},
    				dirty & /*exclude, $$props*/ 512 && exclude(/*$$props*/ ctx[9], ["use", "class", "variant", "color", "collapsed", "prominent", "dense"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (default_slot) default_slot.d(detaching);
    			/*header_binding*/ ctx[13](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCList:action"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { variant = "standard" } = $$props;
    	let { color = "primary" } = $$props;
    	let { collapsed = false } = $$props;
    	let { prominent = false } = $$props;
    	let { dense = false } = $$props;
    	let element;
    	let topAppBar;

    	onMount(() => {
    		topAppBar = new MDCTopAppBar(element);
    	});

    	onDestroy(() => {
    		topAppBar && topAppBar.destroy();
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TopAppBar", $$slots, ['default']);

    	function header_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("variant" in $$new_props) $$invalidate(2, variant = $$new_props.variant);
    		if ("color" in $$new_props) $$invalidate(3, color = $$new_props.color);
    		if ("collapsed" in $$new_props) $$invalidate(4, collapsed = $$new_props.collapsed);
    		if ("prominent" in $$new_props) $$invalidate(5, prominent = $$new_props.prominent);
    		if ("dense" in $$new_props) $$invalidate(6, dense = $$new_props.dense);
    		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		MDCTopAppBar,
    		onMount,
    		onDestroy,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		variant,
    		color,
    		collapsed,
    		prominent,
    		dense,
    		element,
    		topAppBar
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("variant" in $$props) $$invalidate(2, variant = $$new_props.variant);
    		if ("color" in $$props) $$invalidate(3, color = $$new_props.color);
    		if ("collapsed" in $$props) $$invalidate(4, collapsed = $$new_props.collapsed);
    		if ("prominent" in $$props) $$invalidate(5, prominent = $$new_props.prominent);
    		if ("dense" in $$props) $$invalidate(6, dense = $$new_props.dense);
    		if ("element" in $$props) $$invalidate(7, element = $$new_props.element);
    		if ("topAppBar" in $$props) topAppBar = $$new_props.topAppBar;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		variant,
    		color,
    		collapsed,
    		prominent,
    		dense,
    		element,
    		forwardEvents,
    		$$props,
    		topAppBar,
    		$$scope,
    		$$slots,
    		header_binding
    	];
    }

    class TopAppBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {
    			use: 0,
    			class: 1,
    			variant: 2,
    			color: 3,
    			collapsed: 4,
    			prominent: 5,
    			dense: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TopAppBar",
    			options,
    			id: create_fragment$s.name
    		});
    	}

    	get use() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get collapsed() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set collapsed(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prominent() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prominent(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Row = classAdderBuilder({
      class: 'mdc-top-app-bar__row',
      component: Div,
      contexts: {}
    });

    /* node_modules\@smui\top-app-bar\Section.svelte generated by Svelte v3.20.1 */
    const file$r = "node_modules\\@smui\\top-app-bar\\Section.svelte";

    function create_fragment$t(ctx) {
    	let section;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	let section_levels = [
    		{
    			class: "\n    mdc-top-app-bar__section\n    " + /*className*/ ctx[1] + "\n    " + (/*align*/ ctx[2] === "start"
    			? "mdc-top-app-bar__section--align-start"
    			: "") + "\n    " + (/*align*/ ctx[2] === "end"
    			? "mdc-top-app-bar__section--align-end"
    			: "") + "\n  "
    		},
    		/*toolbar*/ ctx[3] ? { role: "toolbar" } : {},
    		exclude(/*$$props*/ ctx[5], ["use", "class", "align", "toolbar"])
    	];

    	let section_data = {};

    	for (let i = 0; i < section_levels.length; i += 1) {
    		section_data = assign(section_data, section_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			if (default_slot) default_slot.c();
    			set_attributes(section, section_data);
    			add_location(section, file$r, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, section, anchor);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, section, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[4].call(null, section))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    				}
    			}

    			set_attributes(section, get_spread_update(section_levels, [
    				dirty & /*className, align*/ 6 && {
    					class: "\n    mdc-top-app-bar__section\n    " + /*className*/ ctx[1] + "\n    " + (/*align*/ ctx[2] === "start"
    					? "mdc-top-app-bar__section--align-start"
    					: "") + "\n    " + (/*align*/ ctx[2] === "end"
    					? "mdc-top-app-bar__section--align-end"
    					: "") + "\n  "
    				},
    				dirty & /*toolbar*/ 8 && (/*toolbar*/ ctx[3] ? { role: "toolbar" } : {}),
    				dirty & /*exclude, $$props*/ 32 && exclude(/*$$props*/ ctx[5], ["use", "class", "align", "toolbar"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCList:action"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { align = "start" } = $$props;
    	let { toolbar = false } = $$props;

    	setContext("SMUI:icon-button:context", toolbar
    	? "top-app-bar:action"
    	: "top-app-bar:navigation");

    	setContext("SMUI:button:context", toolbar
    	? "top-app-bar:action"
    	: "top-app-bar:navigation");

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Section", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("align" in $$new_props) $$invalidate(2, align = $$new_props.align);
    		if ("toolbar" in $$new_props) $$invalidate(3, toolbar = $$new_props.toolbar);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		align,
    		toolbar
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("align" in $$props) $$invalidate(2, align = $$new_props.align);
    		if ("toolbar" in $$props) $$invalidate(3, toolbar = $$new_props.toolbar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, className, align, toolbar, forwardEvents, $$props, $$scope, $$slots];
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, { use: 0, class: 1, align: 2, toolbar: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$t.name
    		});
    	}

    	get use() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toolbar() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toolbar(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\Span.svelte generated by Svelte v3.20.1 */
    const file$s = "node_modules\\@smui\\common\\Span.svelte";

    function create_fragment$u(ctx) {
    	let span;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let span_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span, span_data);
    			add_location(span, file$s, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, span, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, span))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    				}
    			}

    			set_attributes(span, get_spread_update(span_levels, [dirty & /*exclude, $$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Span", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, $$slots];
    }

    class Span extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Span",
    			options,
    			id: create_fragment$u.name
    		});
    	}

    	get use() {
    		throw new Error("<Span>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Span>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Title$1 = classAdderBuilder({
      class: 'mdc-top-app-bar__title',
      component: Span,
      contexts: {}
    });

    function DenseFixedAdjust(node) {
      node.classList.add('mdc-top-app-bar--dense-fixed-adjust');

      return {
        destroy() {
          node.classList.remove('mdc-top-app-bar--dense-fixed-adjust');
        }
      }
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$7 = {
        ANCHOR: 'mdc-menu-surface--anchor',
        ANIMATING_CLOSED: 'mdc-menu-surface--animating-closed',
        ANIMATING_OPEN: 'mdc-menu-surface--animating-open',
        FIXED: 'mdc-menu-surface--fixed',
        OPEN: 'mdc-menu-surface--open',
        ROOT: 'mdc-menu-surface',
    };
    // tslint:disable:object-literal-sort-keys
    var strings$9 = {
        CLOSED_EVENT: 'MDCMenuSurface:closed',
        OPENED_EVENT: 'MDCMenuSurface:opened',
        FOCUSABLE_ELEMENTS: [
            'button:not(:disabled)', '[href]:not([aria-disabled="true"])', 'input:not(:disabled)',
            'select:not(:disabled)', 'textarea:not(:disabled)', '[tabindex]:not([tabindex="-1"]):not([aria-disabled="true"])',
        ].join(', '),
    };
    // tslint:enable:object-literal-sort-keys
    var numbers$3 = {
        /** Total duration of menu-surface open animation. */
        TRANSITION_OPEN_DURATION: 120,
        /** Total duration of menu-surface close animation. */
        TRANSITION_CLOSE_DURATION: 75,
        /** Margin left to the edge of the viewport when menu-surface is at maximum possible height. */
        MARGIN_TO_EDGE: 32,
        /** Ratio of anchor width to menu-surface width for switching from corner positioning to center positioning. */
        ANCHOR_TO_MENU_SURFACE_WIDTH_RATIO: 0.67,
    };
    /**
     * Enum for bits in the {@see Corner) bitmap.
     */
    var CornerBit;
    (function (CornerBit) {
        CornerBit[CornerBit["BOTTOM"] = 1] = "BOTTOM";
        CornerBit[CornerBit["CENTER"] = 2] = "CENTER";
        CornerBit[CornerBit["RIGHT"] = 4] = "RIGHT";
        CornerBit[CornerBit["FLIP_RTL"] = 8] = "FLIP_RTL";
    })(CornerBit || (CornerBit = {}));
    /**
     * Enum for representing an element corner for positioning the menu-surface.
     *
     * The START constants map to LEFT if element directionality is left
     * to right and RIGHT if the directionality is right to left.
     * Likewise END maps to RIGHT or LEFT depending on the directionality.
     */
    var Corner;
    (function (Corner) {
        Corner[Corner["TOP_LEFT"] = 0] = "TOP_LEFT";
        Corner[Corner["TOP_RIGHT"] = 4] = "TOP_RIGHT";
        Corner[Corner["BOTTOM_LEFT"] = 1] = "BOTTOM_LEFT";
        Corner[Corner["BOTTOM_RIGHT"] = 5] = "BOTTOM_RIGHT";
        Corner[Corner["TOP_START"] = 8] = "TOP_START";
        Corner[Corner["TOP_END"] = 12] = "TOP_END";
        Corner[Corner["BOTTOM_START"] = 9] = "BOTTOM_START";
        Corner[Corner["BOTTOM_END"] = 13] = "BOTTOM_END";
    })(Corner || (Corner = {}));
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$8 = {
        LIST_ITEM_ACTIVATED_CLASS: 'mdc-list-item--activated',
        LIST_ITEM_CLASS: 'mdc-list-item',
        LIST_ITEM_DISABLED_CLASS: 'mdc-list-item--disabled',
        LIST_ITEM_SELECTED_CLASS: 'mdc-list-item--selected',
        ROOT: 'mdc-list',
    };
    var strings$a = {
        ACTION_EVENT: 'MDCList:action',
        ARIA_CHECKED: 'aria-checked',
        ARIA_CHECKED_CHECKBOX_SELECTOR: '[role="checkbox"][aria-checked="true"]',
        ARIA_CHECKED_RADIO_SELECTOR: '[role="radio"][aria-checked="true"]',
        ARIA_CURRENT: 'aria-current',
        ARIA_DISABLED: 'aria-disabled',
        ARIA_ORIENTATION: 'aria-orientation',
        ARIA_ORIENTATION_HORIZONTAL: 'horizontal',
        ARIA_ROLE_CHECKBOX_SELECTOR: '[role="checkbox"]',
        ARIA_SELECTED: 'aria-selected',
        CHECKBOX_RADIO_SELECTOR: 'input[type="checkbox"]:not(:disabled), input[type="radio"]:not(:disabled)',
        CHECKBOX_SELECTOR: 'input[type="checkbox"]:not(:disabled)',
        CHILD_ELEMENTS_TO_TOGGLE_TABINDEX: "\n    ." + cssClasses$8.LIST_ITEM_CLASS + " button:not(:disabled),\n    ." + cssClasses$8.LIST_ITEM_CLASS + " a\n  ",
        FOCUSABLE_CHILD_ELEMENTS: "\n    ." + cssClasses$8.LIST_ITEM_CLASS + " button:not(:disabled),\n    ." + cssClasses$8.LIST_ITEM_CLASS + " a,\n    ." + cssClasses$8.LIST_ITEM_CLASS + " input[type=\"radio\"]:not(:disabled),\n    ." + cssClasses$8.LIST_ITEM_CLASS + " input[type=\"checkbox\"]:not(:disabled)\n  ",
        RADIO_SELECTOR: 'input[type="radio"]:not(:disabled)',
    };
    var numbers$4 = {
        UNSET_INDEX: -1,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var ELEMENTS_KEY_ALLOWED_IN = ['input', 'button', 'textarea', 'select'];
    function isNumberArray(selectedIndex) {
        return selectedIndex instanceof Array;
    }
    var MDCListFoundation = /** @class */ (function (_super) {
        __extends(MDCListFoundation, _super);
        function MDCListFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCListFoundation.defaultAdapter, adapter)) || this;
            _this.wrapFocus_ = false;
            _this.isVertical_ = true;
            _this.isSingleSelectionList_ = false;
            _this.selectedIndex_ = numbers$4.UNSET_INDEX;
            _this.focusedItemIndex_ = numbers$4.UNSET_INDEX;
            _this.useActivatedClass_ = false;
            _this.ariaCurrentAttrValue_ = null;
            _this.isCheckboxList_ = false;
            _this.isRadioList_ = false;
            return _this;
        }
        Object.defineProperty(MDCListFoundation, "strings", {
            get: function () {
                return strings$a;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCListFoundation, "cssClasses", {
            get: function () {
                return cssClasses$8;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCListFoundation, "numbers", {
            get: function () {
                return numbers$4;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCListFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClassForElementIndex: function () { return undefined; },
                    focusItemAtIndex: function () { return undefined; },
                    getAttributeForElementIndex: function () { return null; },
                    getFocusedElementIndex: function () { return 0; },
                    getListItemCount: function () { return 0; },
                    hasCheckboxAtIndex: function () { return false; },
                    hasRadioAtIndex: function () { return false; },
                    isCheckboxCheckedAtIndex: function () { return false; },
                    isFocusInsideList: function () { return false; },
                    isRootFocused: function () { return false; },
                    notifyAction: function () { return undefined; },
                    removeClassForElementIndex: function () { return undefined; },
                    setAttributeForElementIndex: function () { return undefined; },
                    setCheckedCheckboxOrRadioAtIndex: function () { return undefined; },
                    setTabIndexForListItemChildren: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCListFoundation.prototype.layout = function () {
            if (this.adapter_.getListItemCount() === 0) {
                return;
            }
            if (this.adapter_.hasCheckboxAtIndex(0)) {
                this.isCheckboxList_ = true;
            }
            else if (this.adapter_.hasRadioAtIndex(0)) {
                this.isRadioList_ = true;
            }
        };
        /**
         * Sets the private wrapFocus_ variable.
         */
        MDCListFoundation.prototype.setWrapFocus = function (value) {
            this.wrapFocus_ = value;
        };
        /**
         * Sets the isVertical_ private variable.
         */
        MDCListFoundation.prototype.setVerticalOrientation = function (value) {
            this.isVertical_ = value;
        };
        /**
         * Sets the isSingleSelectionList_ private variable.
         */
        MDCListFoundation.prototype.setSingleSelection = function (value) {
            this.isSingleSelectionList_ = value;
        };
        /**
         * Sets the useActivatedClass_ private variable.
         */
        MDCListFoundation.prototype.setUseActivatedClass = function (useActivated) {
            this.useActivatedClass_ = useActivated;
        };
        MDCListFoundation.prototype.getSelectedIndex = function () {
            return this.selectedIndex_;
        };
        MDCListFoundation.prototype.setSelectedIndex = function (index) {
            if (!this.isIndexValid_(index)) {
                return;
            }
            if (this.isCheckboxList_) {
                this.setCheckboxAtIndex_(index);
            }
            else if (this.isRadioList_) {
                this.setRadioAtIndex_(index);
            }
            else {
                this.setSingleSelectionAtIndex_(index);
            }
        };
        /**
         * Focus in handler for the list items.
         */
        MDCListFoundation.prototype.handleFocusIn = function (_, listItemIndex) {
            if (listItemIndex >= 0) {
                this.adapter_.setTabIndexForListItemChildren(listItemIndex, '0');
            }
        };
        /**
         * Focus out handler for the list items.
         */
        MDCListFoundation.prototype.handleFocusOut = function (_, listItemIndex) {
            var _this = this;
            if (listItemIndex >= 0) {
                this.adapter_.setTabIndexForListItemChildren(listItemIndex, '-1');
            }
            /**
             * Between Focusout & Focusin some browsers do not have focus on any element. Setting a delay to wait till the focus
             * is moved to next element.
             */
            setTimeout(function () {
                if (!_this.adapter_.isFocusInsideList()) {
                    _this.setTabindexToFirstSelectedItem_();
                }
            }, 0);
        };
        /**
         * Key handler for the list.
         */
        MDCListFoundation.prototype.handleKeydown = function (evt, isRootListItem, listItemIndex) {
            var isArrowLeft = evt.key === 'ArrowLeft' || evt.keyCode === 37;
            var isArrowUp = evt.key === 'ArrowUp' || evt.keyCode === 38;
            var isArrowRight = evt.key === 'ArrowRight' || evt.keyCode === 39;
            var isArrowDown = evt.key === 'ArrowDown' || evt.keyCode === 40;
            var isHome = evt.key === 'Home' || evt.keyCode === 36;
            var isEnd = evt.key === 'End' || evt.keyCode === 35;
            var isEnter = evt.key === 'Enter' || evt.keyCode === 13;
            var isSpace = evt.key === 'Space' || evt.keyCode === 32;
            if (this.adapter_.isRootFocused()) {
                if (isArrowUp || isEnd) {
                    evt.preventDefault();
                    this.focusLastElement();
                }
                else if (isArrowDown || isHome) {
                    evt.preventDefault();
                    this.focusFirstElement();
                }
                return;
            }
            var currentIndex = this.adapter_.getFocusedElementIndex();
            if (currentIndex === -1) {
                currentIndex = listItemIndex;
                if (currentIndex < 0) {
                    // If this event doesn't have a mdc-list-item ancestor from the
                    // current list (not from a sublist), return early.
                    return;
                }
            }
            var nextIndex;
            if ((this.isVertical_ && isArrowDown) || (!this.isVertical_ && isArrowRight)) {
                this.preventDefaultEvent_(evt);
                nextIndex = this.focusNextElement(currentIndex);
            }
            else if ((this.isVertical_ && isArrowUp) || (!this.isVertical_ && isArrowLeft)) {
                this.preventDefaultEvent_(evt);
                nextIndex = this.focusPrevElement(currentIndex);
            }
            else if (isHome) {
                this.preventDefaultEvent_(evt);
                nextIndex = this.focusFirstElement();
            }
            else if (isEnd) {
                this.preventDefaultEvent_(evt);
                nextIndex = this.focusLastElement();
            }
            else if (isEnter || isSpace) {
                if (isRootListItem) {
                    // Return early if enter key is pressed on anchor element which triggers synthetic MouseEvent event.
                    var target = evt.target;
                    if (target && target.tagName === 'A' && isEnter) {
                        return;
                    }
                    this.preventDefaultEvent_(evt);
                    if (this.isSelectableList_()) {
                        this.setSelectedIndexOnAction_(currentIndex);
                    }
                    this.adapter_.notifyAction(currentIndex);
                }
            }
            this.focusedItemIndex_ = currentIndex;
            if (nextIndex !== undefined) {
                this.setTabindexAtIndex_(nextIndex);
                this.focusedItemIndex_ = nextIndex;
            }
        };
        /**
         * Click handler for the list.
         */
        MDCListFoundation.prototype.handleClick = function (index, toggleCheckbox) {
            if (index === numbers$4.UNSET_INDEX) {
                return;
            }
            if (this.isSelectableList_()) {
                this.setSelectedIndexOnAction_(index, toggleCheckbox);
            }
            this.adapter_.notifyAction(index);
            this.setTabindexAtIndex_(index);
            this.focusedItemIndex_ = index;
        };
        /**
         * Focuses the next element on the list.
         */
        MDCListFoundation.prototype.focusNextElement = function (index) {
            var count = this.adapter_.getListItemCount();
            var nextIndex = index + 1;
            if (nextIndex >= count) {
                if (this.wrapFocus_) {
                    nextIndex = 0;
                }
                else {
                    // Return early because last item is already focused.
                    return index;
                }
            }
            this.adapter_.focusItemAtIndex(nextIndex);
            return nextIndex;
        };
        /**
         * Focuses the previous element on the list.
         */
        MDCListFoundation.prototype.focusPrevElement = function (index) {
            var prevIndex = index - 1;
            if (prevIndex < 0) {
                if (this.wrapFocus_) {
                    prevIndex = this.adapter_.getListItemCount() - 1;
                }
                else {
                    // Return early because first item is already focused.
                    return index;
                }
            }
            this.adapter_.focusItemAtIndex(prevIndex);
            return prevIndex;
        };
        MDCListFoundation.prototype.focusFirstElement = function () {
            this.adapter_.focusItemAtIndex(0);
            return 0;
        };
        MDCListFoundation.prototype.focusLastElement = function () {
            var lastIndex = this.adapter_.getListItemCount() - 1;
            this.adapter_.focusItemAtIndex(lastIndex);
            return lastIndex;
        };
        /**
         * @param itemIndex Index of the list item
         * @param isEnabled Sets the list item to enabled or disabled.
         */
        MDCListFoundation.prototype.setEnabled = function (itemIndex, isEnabled) {
            if (!this.isIndexValid_(itemIndex)) {
                return;
            }
            if (isEnabled) {
                this.adapter_.removeClassForElementIndex(itemIndex, cssClasses$8.LIST_ITEM_DISABLED_CLASS);
                this.adapter_.setAttributeForElementIndex(itemIndex, strings$a.ARIA_DISABLED, 'false');
            }
            else {
                this.adapter_.addClassForElementIndex(itemIndex, cssClasses$8.LIST_ITEM_DISABLED_CLASS);
                this.adapter_.setAttributeForElementIndex(itemIndex, strings$a.ARIA_DISABLED, 'true');
            }
        };
        /**
         * Ensures that preventDefault is only called if the containing element doesn't
         * consume the event, and it will cause an unintended scroll.
         */
        MDCListFoundation.prototype.preventDefaultEvent_ = function (evt) {
            var target = evt.target;
            var tagName = ("" + target.tagName).toLowerCase();
            if (ELEMENTS_KEY_ALLOWED_IN.indexOf(tagName) === -1) {
                evt.preventDefault();
            }
        };
        MDCListFoundation.prototype.setSingleSelectionAtIndex_ = function (index) {
            if (this.selectedIndex_ === index) {
                return;
            }
            var selectedClassName = cssClasses$8.LIST_ITEM_SELECTED_CLASS;
            if (this.useActivatedClass_) {
                selectedClassName = cssClasses$8.LIST_ITEM_ACTIVATED_CLASS;
            }
            if (this.selectedIndex_ !== numbers$4.UNSET_INDEX) {
                this.adapter_.removeClassForElementIndex(this.selectedIndex_, selectedClassName);
            }
            this.adapter_.addClassForElementIndex(index, selectedClassName);
            this.setAriaForSingleSelectionAtIndex_(index);
            this.selectedIndex_ = index;
        };
        /**
         * Sets aria attribute for single selection at given index.
         */
        MDCListFoundation.prototype.setAriaForSingleSelectionAtIndex_ = function (index) {
            // Detect the presence of aria-current and get the value only during list initialization when it is in unset state.
            if (this.selectedIndex_ === numbers$4.UNSET_INDEX) {
                this.ariaCurrentAttrValue_ =
                    this.adapter_.getAttributeForElementIndex(index, strings$a.ARIA_CURRENT);
            }
            var isAriaCurrent = this.ariaCurrentAttrValue_ !== null;
            var ariaAttribute = isAriaCurrent ? strings$a.ARIA_CURRENT : strings$a.ARIA_SELECTED;
            if (this.selectedIndex_ !== numbers$4.UNSET_INDEX) {
                this.adapter_.setAttributeForElementIndex(this.selectedIndex_, ariaAttribute, 'false');
            }
            var ariaAttributeValue = isAriaCurrent ? this.ariaCurrentAttrValue_ : 'true';
            this.adapter_.setAttributeForElementIndex(index, ariaAttribute, ariaAttributeValue);
        };
        /**
         * Toggles radio at give index. Radio doesn't change the checked state if it is already checked.
         */
        MDCListFoundation.prototype.setRadioAtIndex_ = function (index) {
            this.adapter_.setCheckedCheckboxOrRadioAtIndex(index, true);
            if (this.selectedIndex_ !== numbers$4.UNSET_INDEX) {
                this.adapter_.setAttributeForElementIndex(this.selectedIndex_, strings$a.ARIA_CHECKED, 'false');
            }
            this.adapter_.setAttributeForElementIndex(index, strings$a.ARIA_CHECKED, 'true');
            this.selectedIndex_ = index;
        };
        MDCListFoundation.prototype.setCheckboxAtIndex_ = function (index) {
            for (var i = 0; i < this.adapter_.getListItemCount(); i++) {
                var isChecked = false;
                if (index.indexOf(i) >= 0) {
                    isChecked = true;
                }
                this.adapter_.setCheckedCheckboxOrRadioAtIndex(i, isChecked);
                this.adapter_.setAttributeForElementIndex(i, strings$a.ARIA_CHECKED, isChecked ? 'true' : 'false');
            }
            this.selectedIndex_ = index;
        };
        MDCListFoundation.prototype.setTabindexAtIndex_ = function (index) {
            if (this.focusedItemIndex_ === numbers$4.UNSET_INDEX && index !== 0) {
                // If no list item was selected set first list item's tabindex to -1.
                // Generally, tabindex is set to 0 on first list item of list that has no preselected items.
                this.adapter_.setAttributeForElementIndex(0, 'tabindex', '-1');
            }
            else if (this.focusedItemIndex_ >= 0 && this.focusedItemIndex_ !== index) {
                this.adapter_.setAttributeForElementIndex(this.focusedItemIndex_, 'tabindex', '-1');
            }
            this.adapter_.setAttributeForElementIndex(index, 'tabindex', '0');
        };
        /**
         * @return Return true if it is single selectin list, checkbox list or radio list.
         */
        MDCListFoundation.prototype.isSelectableList_ = function () {
            return this.isSingleSelectionList_ || this.isCheckboxList_ || this.isRadioList_;
        };
        MDCListFoundation.prototype.setTabindexToFirstSelectedItem_ = function () {
            var targetIndex = 0;
            if (this.isSelectableList_()) {
                if (typeof this.selectedIndex_ === 'number' && this.selectedIndex_ !== numbers$4.UNSET_INDEX) {
                    targetIndex = this.selectedIndex_;
                }
                else if (isNumberArray(this.selectedIndex_) && this.selectedIndex_.length > 0) {
                    targetIndex = this.selectedIndex_.reduce(function (currentIndex, minIndex) { return Math.min(currentIndex, minIndex); });
                }
            }
            this.setTabindexAtIndex_(targetIndex);
        };
        MDCListFoundation.prototype.isIndexValid_ = function (index) {
            var _this = this;
            if (index instanceof Array) {
                if (!this.isCheckboxList_) {
                    throw new Error('MDCListFoundation: Array of index is only supported for checkbox based list');
                }
                if (index.length === 0) {
                    return true;
                }
                else {
                    return index.some(function (i) { return _this.isIndexInRange_(i); });
                }
            }
            else if (typeof index === 'number') {
                if (this.isCheckboxList_) {
                    throw new Error('MDCListFoundation: Expected array of index for checkbox based list but got number: ' + index);
                }
                return this.isIndexInRange_(index);
            }
            else {
                return false;
            }
        };
        MDCListFoundation.prototype.isIndexInRange_ = function (index) {
            var listSize = this.adapter_.getListItemCount();
            return index >= 0 && index < listSize;
        };
        MDCListFoundation.prototype.setSelectedIndexOnAction_ = function (index, toggleCheckbox) {
            if (toggleCheckbox === void 0) { toggleCheckbox = true; }
            if (this.isCheckboxList_) {
                this.toggleCheckboxAtIndex_(index, toggleCheckbox);
            }
            else {
                this.setSelectedIndex(index);
            }
        };
        MDCListFoundation.prototype.toggleCheckboxAtIndex_ = function (index, toggleCheckbox) {
            var isChecked = this.adapter_.isCheckboxCheckedAtIndex(index);
            if (toggleCheckbox) {
                isChecked = !isChecked;
                this.adapter_.setCheckedCheckboxOrRadioAtIndex(index, isChecked);
            }
            this.adapter_.setAttributeForElementIndex(index, strings$a.ARIA_CHECKED, isChecked ? 'true' : 'false');
            // If none of the checkbox items are selected and selectedIndex is not initialized then provide a default value.
            var selectedIndexes = this.selectedIndex_ === numbers$4.UNSET_INDEX ? [] : this.selectedIndex_.slice();
            if (isChecked) {
                selectedIndexes.push(index);
            }
            else {
                selectedIndexes = selectedIndexes.filter(function (i) { return i !== index; });
            }
            this.selectedIndex_ = selectedIndexes;
        };
        return MDCListFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCList = /** @class */ (function (_super) {
        __extends(MDCList, _super);
        function MDCList() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(MDCList.prototype, "vertical", {
            set: function (value) {
                this.foundation_.setVerticalOrientation(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCList.prototype, "listElements", {
            get: function () {
                return [].slice.call(this.root_.querySelectorAll("." + cssClasses$8.LIST_ITEM_CLASS));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCList.prototype, "wrapFocus", {
            set: function (value) {
                this.foundation_.setWrapFocus(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCList.prototype, "singleSelection", {
            set: function (isSingleSelectionList) {
                this.foundation_.setSingleSelection(isSingleSelectionList);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCList.prototype, "selectedIndex", {
            get: function () {
                return this.foundation_.getSelectedIndex();
            },
            set: function (index) {
                this.foundation_.setSelectedIndex(index);
            },
            enumerable: true,
            configurable: true
        });
        MDCList.attachTo = function (root) {
            return new MDCList(root);
        };
        MDCList.prototype.initialSyncWithDOM = function () {
            this.handleClick_ = this.handleClickEvent_.bind(this);
            this.handleKeydown_ = this.handleKeydownEvent_.bind(this);
            this.focusInEventListener_ = this.handleFocusInEvent_.bind(this);
            this.focusOutEventListener_ = this.handleFocusOutEvent_.bind(this);
            this.listen('keydown', this.handleKeydown_);
            this.listen('click', this.handleClick_);
            this.listen('focusin', this.focusInEventListener_);
            this.listen('focusout', this.focusOutEventListener_);
            this.layout();
            this.initializeListType();
        };
        MDCList.prototype.destroy = function () {
            this.unlisten('keydown', this.handleKeydown_);
            this.unlisten('click', this.handleClick_);
            this.unlisten('focusin', this.focusInEventListener_);
            this.unlisten('focusout', this.focusOutEventListener_);
        };
        MDCList.prototype.layout = function () {
            var direction = this.root_.getAttribute(strings$a.ARIA_ORIENTATION);
            this.vertical = direction !== strings$a.ARIA_ORIENTATION_HORIZONTAL;
            // List items need to have at least tabindex=-1 to be focusable.
            [].slice.call(this.root_.querySelectorAll('.mdc-list-item:not([tabindex])'))
                .forEach(function (el) {
                el.setAttribute('tabindex', '-1');
            });
            // Child button/a elements are not tabbable until the list item is focused.
            [].slice.call(this.root_.querySelectorAll(strings$a.FOCUSABLE_CHILD_ELEMENTS))
                .forEach(function (el) { return el.setAttribute('tabindex', '-1'); });
            this.foundation_.layout();
        };
        /**
         * Initialize selectedIndex value based on pre-selected checkbox list items, single selection or radio.
         */
        MDCList.prototype.initializeListType = function () {
            var _this = this;
            var checkboxListItems = this.root_.querySelectorAll(strings$a.ARIA_ROLE_CHECKBOX_SELECTOR);
            var singleSelectedListItem = this.root_.querySelector("\n      ." + cssClasses$8.LIST_ITEM_ACTIVATED_CLASS + ",\n      ." + cssClasses$8.LIST_ITEM_SELECTED_CLASS + "\n    ");
            var radioSelectedListItem = this.root_.querySelector(strings$a.ARIA_CHECKED_RADIO_SELECTOR);
            if (checkboxListItems.length) {
                var preselectedItems = this.root_.querySelectorAll(strings$a.ARIA_CHECKED_CHECKBOX_SELECTOR);
                this.selectedIndex =
                    [].map.call(preselectedItems, function (listItem) { return _this.listElements.indexOf(listItem); });
            }
            else if (singleSelectedListItem) {
                if (singleSelectedListItem.classList.contains(cssClasses$8.LIST_ITEM_ACTIVATED_CLASS)) {
                    this.foundation_.setUseActivatedClass(true);
                }
                this.singleSelection = true;
                this.selectedIndex = this.listElements.indexOf(singleSelectedListItem);
            }
            else if (radioSelectedListItem) {
                this.selectedIndex = this.listElements.indexOf(radioSelectedListItem);
            }
        };
        /**
         * Updates the list item at itemIndex to the desired isEnabled state.
         * @param itemIndex Index of the list item
         * @param isEnabled Sets the list item to enabled or disabled.
         */
        MDCList.prototype.setEnabled = function (itemIndex, isEnabled) {
            this.foundation_.setEnabled(itemIndex, isEnabled);
        };
        MDCList.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addClassForElementIndex: function (index, className) {
                    var element = _this.listElements[index];
                    if (element) {
                        element.classList.add(className);
                    }
                },
                focusItemAtIndex: function (index) {
                    var element = _this.listElements[index];
                    if (element) {
                        element.focus();
                    }
                },
                getAttributeForElementIndex: function (index, attr) { return _this.listElements[index].getAttribute(attr); },
                getFocusedElementIndex: function () { return _this.listElements.indexOf(document.activeElement); },
                getListItemCount: function () { return _this.listElements.length; },
                hasCheckboxAtIndex: function (index) {
                    var listItem = _this.listElements[index];
                    return !!listItem.querySelector(strings$a.CHECKBOX_SELECTOR);
                },
                hasRadioAtIndex: function (index) {
                    var listItem = _this.listElements[index];
                    return !!listItem.querySelector(strings$a.RADIO_SELECTOR);
                },
                isCheckboxCheckedAtIndex: function (index) {
                    var listItem = _this.listElements[index];
                    var toggleEl = listItem.querySelector(strings$a.CHECKBOX_SELECTOR);
                    return toggleEl.checked;
                },
                isFocusInsideList: function () {
                    return _this.root_.contains(document.activeElement);
                },
                isRootFocused: function () { return document.activeElement === _this.root_; },
                notifyAction: function (index) {
                    _this.emit(strings$a.ACTION_EVENT, { index: index }, /** shouldBubble */ true);
                },
                removeClassForElementIndex: function (index, className) {
                    var element = _this.listElements[index];
                    if (element) {
                        element.classList.remove(className);
                    }
                },
                setAttributeForElementIndex: function (index, attr, value) {
                    var element = _this.listElements[index];
                    if (element) {
                        element.setAttribute(attr, value);
                    }
                },
                setCheckedCheckboxOrRadioAtIndex: function (index, isChecked) {
                    var listItem = _this.listElements[index];
                    var toggleEl = listItem.querySelector(strings$a.CHECKBOX_RADIO_SELECTOR);
                    toggleEl.checked = isChecked;
                    var event = document.createEvent('Event');
                    event.initEvent('change', true, true);
                    toggleEl.dispatchEvent(event);
                },
                setTabIndexForListItemChildren: function (listItemIndex, tabIndexValue) {
                    var element = _this.listElements[listItemIndex];
                    var listItemChildren = [].slice.call(element.querySelectorAll(strings$a.CHILD_ELEMENTS_TO_TOGGLE_TABINDEX));
                    listItemChildren.forEach(function (el) { return el.setAttribute('tabindex', tabIndexValue); });
                },
            };
            return new MDCListFoundation(adapter);
        };
        /**
         * Used to figure out which list item this event is targetting. Or returns -1 if
         * there is no list item
         */
        MDCList.prototype.getListItemIndex_ = function (evt) {
            var eventTarget = evt.target;
            var nearestParent = closest(eventTarget, "." + cssClasses$8.LIST_ITEM_CLASS + ", ." + cssClasses$8.ROOT);
            // Get the index of the element if it is a list item.
            if (nearestParent && matches$1(nearestParent, "." + cssClasses$8.LIST_ITEM_CLASS)) {
                return this.listElements.indexOf(nearestParent);
            }
            return -1;
        };
        /**
         * Used to figure out which element was clicked before sending the event to the foundation.
         */
        MDCList.prototype.handleFocusInEvent_ = function (evt) {
            var index = this.getListItemIndex_(evt);
            this.foundation_.handleFocusIn(evt, index);
        };
        /**
         * Used to figure out which element was clicked before sending the event to the foundation.
         */
        MDCList.prototype.handleFocusOutEvent_ = function (evt) {
            var index = this.getListItemIndex_(evt);
            this.foundation_.handleFocusOut(evt, index);
        };
        /**
         * Used to figure out which element was focused when keydown event occurred before sending the event to the
         * foundation.
         */
        MDCList.prototype.handleKeydownEvent_ = function (evt) {
            var index = this.getListItemIndex_(evt);
            var target = evt.target;
            this.foundation_.handleKeydown(evt, target.classList.contains(cssClasses$8.LIST_ITEM_CLASS), index);
        };
        /**
         * Used to figure out which element was clicked before sending the event to the foundation.
         */
        MDCList.prototype.handleClickEvent_ = function (evt) {
            var index = this.getListItemIndex_(evt);
            var target = evt.target;
            // Toggle the checkbox only if it's not the target of the event, or the checkbox will have 2 change events.
            var toggleCheckbox = !matches$1(target, strings$a.CHECKBOX_RADIO_SELECTOR);
            this.foundation_.handleClick(index, toggleCheckbox);
        };
        return MDCList;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCMenuSurfaceFoundation = /** @class */ (function (_super) {
        __extends(MDCMenuSurfaceFoundation, _super);
        function MDCMenuSurfaceFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCMenuSurfaceFoundation.defaultAdapter, adapter)) || this;
            _this.isOpen_ = false;
            _this.isQuickOpen_ = false;
            _this.isHoistedElement_ = false;
            _this.isFixedPosition_ = false;
            _this.openAnimationEndTimerId_ = 0;
            _this.closeAnimationEndTimerId_ = 0;
            _this.animationRequestId_ = 0;
            _this.anchorCorner_ = Corner.TOP_START;
            _this.anchorMargin_ = { top: 0, right: 0, bottom: 0, left: 0 };
            _this.position_ = { x: 0, y: 0 };
            return _this;
        }
        Object.defineProperty(MDCMenuSurfaceFoundation, "cssClasses", {
            get: function () {
                return cssClasses$7;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenuSurfaceFoundation, "strings", {
            get: function () {
                return strings$9;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenuSurfaceFoundation, "numbers", {
            get: function () {
                return numbers$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenuSurfaceFoundation, "Corner", {
            get: function () {
                return Corner;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenuSurfaceFoundation, "defaultAdapter", {
            /**
             * @see {@link MDCMenuSurfaceAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    hasClass: function () { return false; },
                    hasAnchor: function () { return false; },
                    isElementInContainer: function () { return false; },
                    isFocused: function () { return false; },
                    isRtl: function () { return false; },
                    getInnerDimensions: function () { return ({ height: 0, width: 0 }); },
                    getAnchorDimensions: function () { return null; },
                    getWindowDimensions: function () { return ({ height: 0, width: 0 }); },
                    getBodyDimensions: function () { return ({ height: 0, width: 0 }); },
                    getWindowScroll: function () { return ({ x: 0, y: 0 }); },
                    setPosition: function () { return undefined; },
                    setMaxHeight: function () { return undefined; },
                    setTransformOrigin: function () { return undefined; },
                    saveFocus: function () { return undefined; },
                    restoreFocus: function () { return undefined; },
                    notifyClose: function () { return undefined; },
                    notifyOpen: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCMenuSurfaceFoundation.prototype.init = function () {
            var _a = MDCMenuSurfaceFoundation.cssClasses, ROOT = _a.ROOT, OPEN = _a.OPEN;
            if (!this.adapter_.hasClass(ROOT)) {
                throw new Error(ROOT + " class required in root element.");
            }
            if (this.adapter_.hasClass(OPEN)) {
                this.isOpen_ = true;
            }
        };
        MDCMenuSurfaceFoundation.prototype.destroy = function () {
            clearTimeout(this.openAnimationEndTimerId_);
            clearTimeout(this.closeAnimationEndTimerId_);
            // Cancel any currently running animations.
            cancelAnimationFrame(this.animationRequestId_);
        };
        /**
         * @param corner Default anchor corner alignment of top-left menu surface corner.
         */
        MDCMenuSurfaceFoundation.prototype.setAnchorCorner = function (corner) {
            this.anchorCorner_ = corner;
        };
        /**
         * @param margin Set of margin values from anchor.
         */
        MDCMenuSurfaceFoundation.prototype.setAnchorMargin = function (margin) {
            this.anchorMargin_.top = margin.top || 0;
            this.anchorMargin_.right = margin.right || 0;
            this.anchorMargin_.bottom = margin.bottom || 0;
            this.anchorMargin_.left = margin.left || 0;
        };
        /** Used to indicate if the menu-surface is hoisted to the body. */
        MDCMenuSurfaceFoundation.prototype.setIsHoisted = function (isHoisted) {
            this.isHoistedElement_ = isHoisted;
        };
        /** Used to set the menu-surface calculations based on a fixed position menu. */
        MDCMenuSurfaceFoundation.prototype.setFixedPosition = function (isFixedPosition) {
            this.isFixedPosition_ = isFixedPosition;
        };
        /** Sets the menu-surface position on the page. */
        MDCMenuSurfaceFoundation.prototype.setAbsolutePosition = function (x, y) {
            this.position_.x = this.isFinite_(x) ? x : 0;
            this.position_.y = this.isFinite_(y) ? y : 0;
        };
        MDCMenuSurfaceFoundation.prototype.setQuickOpen = function (quickOpen) {
            this.isQuickOpen_ = quickOpen;
        };
        MDCMenuSurfaceFoundation.prototype.isOpen = function () {
            return this.isOpen_;
        };
        /**
         * Open the menu surface.
         */
        MDCMenuSurfaceFoundation.prototype.open = function () {
            var _this = this;
            this.adapter_.saveFocus();
            if (!this.isQuickOpen_) {
                this.adapter_.addClass(MDCMenuSurfaceFoundation.cssClasses.ANIMATING_OPEN);
            }
            this.animationRequestId_ = requestAnimationFrame(function () {
                _this.adapter_.addClass(MDCMenuSurfaceFoundation.cssClasses.OPEN);
                _this.dimensions_ = _this.adapter_.getInnerDimensions();
                _this.autoPosition_();
                if (_this.isQuickOpen_) {
                    _this.adapter_.notifyOpen();
                }
                else {
                    _this.openAnimationEndTimerId_ = setTimeout(function () {
                        _this.openAnimationEndTimerId_ = 0;
                        _this.adapter_.removeClass(MDCMenuSurfaceFoundation.cssClasses.ANIMATING_OPEN);
                        _this.adapter_.notifyOpen();
                    }, numbers$3.TRANSITION_OPEN_DURATION);
                }
            });
            this.isOpen_ = true;
        };
        /**
         * Closes the menu surface.
         */
        MDCMenuSurfaceFoundation.prototype.close = function (skipRestoreFocus) {
            var _this = this;
            if (skipRestoreFocus === void 0) { skipRestoreFocus = false; }
            if (!this.isQuickOpen_) {
                this.adapter_.addClass(MDCMenuSurfaceFoundation.cssClasses.ANIMATING_CLOSED);
            }
            requestAnimationFrame(function () {
                _this.adapter_.removeClass(MDCMenuSurfaceFoundation.cssClasses.OPEN);
                if (_this.isQuickOpen_) {
                    _this.adapter_.notifyClose();
                }
                else {
                    _this.closeAnimationEndTimerId_ = setTimeout(function () {
                        _this.closeAnimationEndTimerId_ = 0;
                        _this.adapter_.removeClass(MDCMenuSurfaceFoundation.cssClasses.ANIMATING_CLOSED);
                        _this.adapter_.notifyClose();
                    }, numbers$3.TRANSITION_CLOSE_DURATION);
                }
            });
            this.isOpen_ = false;
            if (!skipRestoreFocus) {
                this.maybeRestoreFocus_();
            }
        };
        /** Handle clicks and close if not within menu-surface element. */
        MDCMenuSurfaceFoundation.prototype.handleBodyClick = function (evt) {
            var el = evt.target;
            if (this.adapter_.isElementInContainer(el)) {
                return;
            }
            this.close();
        };
        /** Handle keys that close the surface. */
        MDCMenuSurfaceFoundation.prototype.handleKeydown = function (evt) {
            var keyCode = evt.keyCode, key = evt.key;
            var isEscape = key === 'Escape' || keyCode === 27;
            if (isEscape) {
                this.close();
            }
        };
        MDCMenuSurfaceFoundation.prototype.autoPosition_ = function () {
            var _a;
            // Compute measurements for autoposition methods reuse.
            this.measurements_ = this.getAutoLayoutMeasurements_();
            var corner = this.getOriginCorner_();
            var maxMenuSurfaceHeight = this.getMenuSurfaceMaxHeight_(corner);
            var verticalAlignment = this.hasBit_(corner, CornerBit.BOTTOM) ? 'bottom' : 'top';
            var horizontalAlignment = this.hasBit_(corner, CornerBit.RIGHT) ? 'right' : 'left';
            var horizontalOffset = this.getHorizontalOriginOffset_(corner);
            var verticalOffset = this.getVerticalOriginOffset_(corner);
            var _b = this.measurements_, anchorSize = _b.anchorSize, surfaceSize = _b.surfaceSize;
            var position = (_a = {},
                _a[horizontalAlignment] = horizontalOffset,
                _a[verticalAlignment] = verticalOffset,
                _a);
            // Center align when anchor width is comparable or greater than menu surface, otherwise keep corner.
            if (anchorSize.width / surfaceSize.width > numbers$3.ANCHOR_TO_MENU_SURFACE_WIDTH_RATIO) {
                horizontalAlignment = 'center';
            }
            // If the menu-surface has been hoisted to the body, it's no longer relative to the anchor element
            if (this.isHoistedElement_ || this.isFixedPosition_) {
                this.adjustPositionForHoistedElement_(position);
            }
            this.adapter_.setTransformOrigin(horizontalAlignment + " " + verticalAlignment);
            this.adapter_.setPosition(position);
            this.adapter_.setMaxHeight(maxMenuSurfaceHeight ? maxMenuSurfaceHeight + 'px' : '');
        };
        /**
         * @return Measurements used to position menu surface popup.
         */
        MDCMenuSurfaceFoundation.prototype.getAutoLayoutMeasurements_ = function () {
            var anchorRect = this.adapter_.getAnchorDimensions();
            var bodySize = this.adapter_.getBodyDimensions();
            var viewportSize = this.adapter_.getWindowDimensions();
            var windowScroll = this.adapter_.getWindowScroll();
            if (!anchorRect) {
                // tslint:disable:object-literal-sort-keys Positional properties are more readable when they're grouped together
                anchorRect = {
                    top: this.position_.y,
                    right: this.position_.x,
                    bottom: this.position_.y,
                    left: this.position_.x,
                    width: 0,
                    height: 0,
                };
                // tslint:enable:object-literal-sort-keys
            }
            return {
                anchorSize: anchorRect,
                bodySize: bodySize,
                surfaceSize: this.dimensions_,
                viewportDistance: {
                    // tslint:disable:object-literal-sort-keys Positional properties are more readable when they're grouped together
                    top: anchorRect.top,
                    right: viewportSize.width - anchorRect.right,
                    bottom: viewportSize.height - anchorRect.bottom,
                    left: anchorRect.left,
                },
                viewportSize: viewportSize,
                windowScroll: windowScroll,
            };
        };
        /**
         * Computes the corner of the anchor from which to animate and position the menu surface.
         */
        MDCMenuSurfaceFoundation.prototype.getOriginCorner_ = function () {
            // Defaults: open from the top left.
            var corner = Corner.TOP_LEFT;
            var _a = this.measurements_, viewportDistance = _a.viewportDistance, anchorSize = _a.anchorSize, surfaceSize = _a.surfaceSize;
            var isBottomAligned = this.hasBit_(this.anchorCorner_, CornerBit.BOTTOM);
            var availableTop = isBottomAligned ? viewportDistance.top + anchorSize.height + this.anchorMargin_.bottom
                : viewportDistance.top + this.anchorMargin_.top;
            var availableBottom = isBottomAligned ? viewportDistance.bottom - this.anchorMargin_.bottom
                : viewportDistance.bottom + anchorSize.height - this.anchorMargin_.top;
            var topOverflow = surfaceSize.height - availableTop;
            var bottomOverflow = surfaceSize.height - availableBottom;
            if (bottomOverflow > 0 && topOverflow < bottomOverflow) {
                corner = this.setBit_(corner, CornerBit.BOTTOM);
            }
            var isRtl = this.adapter_.isRtl();
            var isFlipRtl = this.hasBit_(this.anchorCorner_, CornerBit.FLIP_RTL);
            var avoidHorizontalOverlap = this.hasBit_(this.anchorCorner_, CornerBit.RIGHT);
            var isAlignedRight = (avoidHorizontalOverlap && !isRtl) ||
                (!avoidHorizontalOverlap && isFlipRtl && isRtl);
            var availableLeft = isAlignedRight ? viewportDistance.left + anchorSize.width + this.anchorMargin_.right :
                viewportDistance.left + this.anchorMargin_.left;
            var availableRight = isAlignedRight ? viewportDistance.right - this.anchorMargin_.right :
                viewportDistance.right + anchorSize.width - this.anchorMargin_.left;
            var leftOverflow = surfaceSize.width - availableLeft;
            var rightOverflow = surfaceSize.width - availableRight;
            if ((leftOverflow < 0 && isAlignedRight && isRtl) ||
                (avoidHorizontalOverlap && !isAlignedRight && leftOverflow < 0) ||
                (rightOverflow > 0 && leftOverflow < rightOverflow)) {
                corner = this.setBit_(corner, CornerBit.RIGHT);
            }
            return corner;
        };
        /**
         * @param corner Origin corner of the menu surface.
         * @return Maximum height of the menu surface, based on available space. 0 indicates should not be set.
         */
        MDCMenuSurfaceFoundation.prototype.getMenuSurfaceMaxHeight_ = function (corner) {
            var viewportDistance = this.measurements_.viewportDistance;
            var maxHeight = 0;
            var isBottomAligned = this.hasBit_(corner, CornerBit.BOTTOM);
            var isBottomAnchored = this.hasBit_(this.anchorCorner_, CornerBit.BOTTOM);
            var MARGIN_TO_EDGE = MDCMenuSurfaceFoundation.numbers.MARGIN_TO_EDGE;
            // When maximum height is not specified, it is handled from CSS.
            if (isBottomAligned) {
                maxHeight = viewportDistance.top + this.anchorMargin_.top - MARGIN_TO_EDGE;
                if (!isBottomAnchored) {
                    maxHeight += this.measurements_.anchorSize.height;
                }
            }
            else {
                maxHeight =
                    viewportDistance.bottom - this.anchorMargin_.bottom + this.measurements_.anchorSize.height - MARGIN_TO_EDGE;
                if (isBottomAnchored) {
                    maxHeight -= this.measurements_.anchorSize.height;
                }
            }
            return maxHeight;
        };
        /**
         * @param corner Origin corner of the menu surface.
         * @return Horizontal offset of menu surface origin corner from corresponding anchor corner.
         */
        MDCMenuSurfaceFoundation.prototype.getHorizontalOriginOffset_ = function (corner) {
            var anchorSize = this.measurements_.anchorSize;
            // isRightAligned corresponds to using the 'right' property on the surface.
            var isRightAligned = this.hasBit_(corner, CornerBit.RIGHT);
            var avoidHorizontalOverlap = this.hasBit_(this.anchorCorner_, CornerBit.RIGHT);
            if (isRightAligned) {
                var rightOffset = avoidHorizontalOverlap ? anchorSize.width - this.anchorMargin_.left : this.anchorMargin_.right;
                // For hoisted or fixed elements, adjust the offset by the difference between viewport width and body width so
                // when we calculate the right value (`adjustPositionForHoistedElement_`) based on the element position,
                // the right property is correct.
                if (this.isHoistedElement_ || this.isFixedPosition_) {
                    return rightOffset - (this.measurements_.viewportSize.width - this.measurements_.bodySize.width);
                }
                return rightOffset;
            }
            return avoidHorizontalOverlap ? anchorSize.width - this.anchorMargin_.right : this.anchorMargin_.left;
        };
        /**
         * @param corner Origin corner of the menu surface.
         * @return Vertical offset of menu surface origin corner from corresponding anchor corner.
         */
        MDCMenuSurfaceFoundation.prototype.getVerticalOriginOffset_ = function (corner) {
            var anchorSize = this.measurements_.anchorSize;
            var isBottomAligned = this.hasBit_(corner, CornerBit.BOTTOM);
            var avoidVerticalOverlap = this.hasBit_(this.anchorCorner_, CornerBit.BOTTOM);
            var y = 0;
            if (isBottomAligned) {
                y = avoidVerticalOverlap ? anchorSize.height - this.anchorMargin_.top : -this.anchorMargin_.bottom;
            }
            else {
                y = avoidVerticalOverlap ? (anchorSize.height + this.anchorMargin_.bottom) : this.anchorMargin_.top;
            }
            return y;
        };
        /** Calculates the offsets for positioning the menu-surface when the menu-surface has been hoisted to the body. */
        MDCMenuSurfaceFoundation.prototype.adjustPositionForHoistedElement_ = function (position) {
            var e_1, _a;
            var _b = this.measurements_, windowScroll = _b.windowScroll, viewportDistance = _b.viewportDistance;
            var props = Object.keys(position);
            try {
                for (var props_1 = __values(props), props_1_1 = props_1.next(); !props_1_1.done; props_1_1 = props_1.next()) {
                    var prop = props_1_1.value;
                    var value = position[prop] || 0;
                    // Hoisted surfaces need to have the anchor elements location on the page added to the
                    // position properties for proper alignment on the body.
                    value += viewportDistance[prop];
                    // Surfaces that are absolutely positioned need to have additional calculations for scroll
                    // and bottom positioning.
                    if (!this.isFixedPosition_) {
                        if (prop === 'top') {
                            value += windowScroll.y;
                        }
                        else if (prop === 'bottom') {
                            value -= windowScroll.y;
                        }
                        else if (prop === 'left') {
                            value += windowScroll.x;
                        }
                        else { // prop === 'right'
                            value -= windowScroll.x;
                        }
                    }
                    position[prop] = value;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (props_1_1 && !props_1_1.done && (_a = props_1.return)) _a.call(props_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        /**
         * The last focused element when the menu surface was opened should regain focus, if the user is
         * focused on or within the menu surface when it is closed.
         */
        MDCMenuSurfaceFoundation.prototype.maybeRestoreFocus_ = function () {
            var isRootFocused = this.adapter_.isFocused();
            var childHasFocus = document.activeElement && this.adapter_.isElementInContainer(document.activeElement);
            if (isRootFocused || childHasFocus) {
                this.adapter_.restoreFocus();
            }
        };
        MDCMenuSurfaceFoundation.prototype.hasBit_ = function (corner, bit) {
            return Boolean(corner & bit); // tslint:disable-line:no-bitwise
        };
        MDCMenuSurfaceFoundation.prototype.setBit_ = function (corner, bit) {
            return corner | bit; // tslint:disable-line:no-bitwise
        };
        /**
         * isFinite that doesn't force conversion to number type.
         * Equivalent to Number.isFinite in ES2015, which is not supported in IE.
         */
        MDCMenuSurfaceFoundation.prototype.isFinite_ = function (num) {
            return typeof num === 'number' && isFinite(num);
        };
        return MDCMenuSurfaceFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cachedCssTransformPropertyName_;
    /**
     * Returns the name of the correct transform property to use on the current browser.
     */
    function getTransformPropertyName(globalObj, forceRefresh) {
        if (forceRefresh === void 0) { forceRefresh = false; }
        if (cachedCssTransformPropertyName_ === undefined || forceRefresh) {
            var el = globalObj.document.createElement('div');
            cachedCssTransformPropertyName_ = 'transform' in el.style ? 'transform' : 'webkitTransform';
        }
        return cachedCssTransformPropertyName_;
    }
    //# sourceMappingURL=util.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCMenuSurface = /** @class */ (function (_super) {
        __extends(MDCMenuSurface, _super);
        function MDCMenuSurface() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCMenuSurface.attachTo = function (root) {
            return new MDCMenuSurface(root);
        };
        MDCMenuSurface.prototype.initialSyncWithDOM = function () {
            var _this = this;
            var parentEl = this.root_.parentElement;
            this.anchorElement = parentEl && parentEl.classList.contains(cssClasses$7.ANCHOR) ? parentEl : null;
            if (this.root_.classList.contains(cssClasses$7.FIXED)) {
                this.setFixedPosition(true);
            }
            this.handleKeydown_ = function (evt) { return _this.foundation_.handleKeydown(evt); };
            this.handleBodyClick_ = function (evt) { return _this.foundation_.handleBodyClick(evt); };
            this.registerBodyClickListener_ = function () { return document.body.addEventListener('click', _this.handleBodyClick_); };
            this.deregisterBodyClickListener_ = function () { return document.body.removeEventListener('click', _this.handleBodyClick_); };
            this.listen('keydown', this.handleKeydown_);
            this.listen(strings$9.OPENED_EVENT, this.registerBodyClickListener_);
            this.listen(strings$9.CLOSED_EVENT, this.deregisterBodyClickListener_);
        };
        MDCMenuSurface.prototype.destroy = function () {
            this.unlisten('keydown', this.handleKeydown_);
            this.unlisten(strings$9.OPENED_EVENT, this.registerBodyClickListener_);
            this.unlisten(strings$9.CLOSED_EVENT, this.deregisterBodyClickListener_);
            _super.prototype.destroy.call(this);
        };
        MDCMenuSurface.prototype.isOpen = function () {
            return this.foundation_.isOpen();
        };
        MDCMenuSurface.prototype.open = function () {
            this.foundation_.open();
        };
        MDCMenuSurface.prototype.close = function (skipRestoreFocus) {
            if (skipRestoreFocus === void 0) { skipRestoreFocus = false; }
            this.foundation_.close(skipRestoreFocus);
        };
        Object.defineProperty(MDCMenuSurface.prototype, "quickOpen", {
            set: function (quickOpen) {
                this.foundation_.setQuickOpen(quickOpen);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Removes the menu-surface from it's current location and appends it to the
         * body to overcome any overflow:hidden issues.
         */
        MDCMenuSurface.prototype.hoistMenuToBody = function () {
            document.body.appendChild(this.root_);
            this.setIsHoisted(true);
        };
        /** Sets the foundation to use page offsets for an positioning when the menu is hoisted to the body. */
        MDCMenuSurface.prototype.setIsHoisted = function (isHoisted) {
            this.foundation_.setIsHoisted(isHoisted);
        };
        /** Sets the element that the menu-surface is anchored to. */
        MDCMenuSurface.prototype.setMenuSurfaceAnchorElement = function (element) {
            this.anchorElement = element;
        };
        /** Sets the menu-surface to position: fixed. */
        MDCMenuSurface.prototype.setFixedPosition = function (isFixed) {
            if (isFixed) {
                this.root_.classList.add(cssClasses$7.FIXED);
            }
            else {
                this.root_.classList.remove(cssClasses$7.FIXED);
            }
            this.foundation_.setFixedPosition(isFixed);
        };
        /** Sets the absolute x/y position to position based on. Requires the menu to be hoisted. */
        MDCMenuSurface.prototype.setAbsolutePosition = function (x, y) {
            this.foundation_.setAbsolutePosition(x, y);
            this.setIsHoisted(true);
        };
        /**
         * @param corner Default anchor corner alignment of top-left surface corner.
         */
        MDCMenuSurface.prototype.setAnchorCorner = function (corner) {
            this.foundation_.setAnchorCorner(corner);
        };
        MDCMenuSurface.prototype.setAnchorMargin = function (margin) {
            this.foundation_.setAnchorMargin(margin);
        };
        MDCMenuSurface.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                hasAnchor: function () { return !!_this.anchorElement; },
                notifyClose: function () { return _this.emit(MDCMenuSurfaceFoundation.strings.CLOSED_EVENT, {}); },
                notifyOpen: function () { return _this.emit(MDCMenuSurfaceFoundation.strings.OPENED_EVENT, {}); },
                isElementInContainer: function (el) { return _this.root_.contains(el); },
                isRtl: function () { return getComputedStyle(_this.root_).getPropertyValue('direction') === 'rtl'; },
                setTransformOrigin: function (origin) {
                    var propertyName = getTransformPropertyName(window) + "-origin";
                    _this.root_.style.setProperty(propertyName, origin);
                },
                isFocused: function () { return document.activeElement === _this.root_; },
                saveFocus: function () {
                    _this.previousFocus_ = document.activeElement;
                },
                restoreFocus: function () {
                    if (_this.root_.contains(document.activeElement)) {
                        if (_this.previousFocus_ && _this.previousFocus_.focus) {
                            _this.previousFocus_.focus();
                        }
                    }
                },
                getInnerDimensions: function () {
                    return { width: _this.root_.offsetWidth, height: _this.root_.offsetHeight };
                },
                getAnchorDimensions: function () { return _this.anchorElement ? _this.anchorElement.getBoundingClientRect() : null; },
                getWindowDimensions: function () {
                    return { width: window.innerWidth, height: window.innerHeight };
                },
                getBodyDimensions: function () {
                    return { width: document.body.clientWidth, height: document.body.clientHeight };
                },
                getWindowScroll: function () {
                    return { x: window.pageXOffset, y: window.pageYOffset };
                },
                setPosition: function (position) {
                    _this.root_.style.left = 'left' in position ? position.left + "px" : '';
                    _this.root_.style.right = 'right' in position ? position.right + "px" : '';
                    _this.root_.style.top = 'top' in position ? position.top + "px" : '';
                    _this.root_.style.bottom = 'bottom' in position ? position.bottom + "px" : '';
                },
                setMaxHeight: function (height) {
                    _this.root_.style.maxHeight = height;
                },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCMenuSurfaceFoundation(adapter);
        };
        return MDCMenuSurface;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$9 = {
        MENU_SELECTED_LIST_ITEM: 'mdc-menu-item--selected',
        MENU_SELECTION_GROUP: 'mdc-menu__selection-group',
        ROOT: 'mdc-menu',
    };
    var strings$b = {
        ARIA_CHECKED_ATTR: 'aria-checked',
        ARIA_DISABLED_ATTR: 'aria-disabled',
        CHECKBOX_SELECTOR: 'input[type="checkbox"]',
        LIST_SELECTOR: '.mdc-list',
        SELECTED_EVENT: 'MDCMenu:selected',
    };
    var numbers$5 = {
        FOCUS_ROOT_INDEX: -1,
    };
    var DefaultFocusState;
    (function (DefaultFocusState) {
        DefaultFocusState[DefaultFocusState["NONE"] = 0] = "NONE";
        DefaultFocusState[DefaultFocusState["LIST_ROOT"] = 1] = "LIST_ROOT";
        DefaultFocusState[DefaultFocusState["FIRST_ITEM"] = 2] = "FIRST_ITEM";
        DefaultFocusState[DefaultFocusState["LAST_ITEM"] = 3] = "LAST_ITEM";
    })(DefaultFocusState || (DefaultFocusState = {}));
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCMenuFoundation = /** @class */ (function (_super) {
        __extends(MDCMenuFoundation, _super);
        function MDCMenuFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCMenuFoundation.defaultAdapter, adapter)) || this;
            _this.closeAnimationEndTimerId_ = 0;
            _this.defaultFocusState_ = DefaultFocusState.LIST_ROOT;
            return _this;
        }
        Object.defineProperty(MDCMenuFoundation, "cssClasses", {
            get: function () {
                return cssClasses$9;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenuFoundation, "strings", {
            get: function () {
                return strings$b;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenuFoundation, "numbers", {
            get: function () {
                return numbers$5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenuFoundation, "defaultAdapter", {
            /**
             * @see {@link MDCMenuAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClassToElementAtIndex: function () { return undefined; },
                    removeClassFromElementAtIndex: function () { return undefined; },
                    addAttributeToElementAtIndex: function () { return undefined; },
                    removeAttributeFromElementAtIndex: function () { return undefined; },
                    elementContainsClass: function () { return false; },
                    closeSurface: function () { return undefined; },
                    getElementIndex: function () { return -1; },
                    notifySelected: function () { return undefined; },
                    getMenuItemCount: function () { return 0; },
                    focusItemAtIndex: function () { return undefined; },
                    focusListRoot: function () { return undefined; },
                    getSelectedSiblingOfItemAtIndex: function () { return -1; },
                    isSelectableItemAtIndex: function () { return false; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCMenuFoundation.prototype.destroy = function () {
            if (this.closeAnimationEndTimerId_) {
                clearTimeout(this.closeAnimationEndTimerId_);
            }
            this.adapter_.closeSurface();
        };
        MDCMenuFoundation.prototype.handleKeydown = function (evt) {
            var key = evt.key, keyCode = evt.keyCode;
            var isTab = key === 'Tab' || keyCode === 9;
            if (isTab) {
                this.adapter_.closeSurface(/** skipRestoreFocus */ true);
            }
        };
        MDCMenuFoundation.prototype.handleItemAction = function (listItem) {
            var _this = this;
            var index = this.adapter_.getElementIndex(listItem);
            if (index < 0) {
                return;
            }
            this.adapter_.notifySelected({ index: index });
            this.adapter_.closeSurface();
            // Wait for the menu to close before adding/removing classes that affect styles.
            this.closeAnimationEndTimerId_ = setTimeout(function () {
                // Recompute the index in case the menu contents have changed.
                var recomputedIndex = _this.adapter_.getElementIndex(listItem);
                if (_this.adapter_.isSelectableItemAtIndex(recomputedIndex)) {
                    _this.setSelectedIndex(recomputedIndex);
                }
            }, MDCMenuSurfaceFoundation.numbers.TRANSITION_CLOSE_DURATION);
        };
        MDCMenuFoundation.prototype.handleMenuSurfaceOpened = function () {
            switch (this.defaultFocusState_) {
                case DefaultFocusState.FIRST_ITEM:
                    this.adapter_.focusItemAtIndex(0);
                    break;
                case DefaultFocusState.LAST_ITEM:
                    this.adapter_.focusItemAtIndex(this.adapter_.getMenuItemCount() - 1);
                    break;
                case DefaultFocusState.NONE:
                    // Do nothing.
                    break;
                default:
                    this.adapter_.focusListRoot();
                    break;
            }
        };
        /**
         * Sets default focus state where the menu should focus every time when menu
         * is opened. Focuses the list root (`DefaultFocusState.LIST_ROOT`) element by
         * default.
         */
        MDCMenuFoundation.prototype.setDefaultFocusState = function (focusState) {
            this.defaultFocusState_ = focusState;
        };
        /**
         * Selects the list item at `index` within the menu.
         * @param index Index of list item within the menu.
         */
        MDCMenuFoundation.prototype.setSelectedIndex = function (index) {
            this.validatedIndex_(index);
            if (!this.adapter_.isSelectableItemAtIndex(index)) {
                throw new Error('MDCMenuFoundation: No selection group at specified index.');
            }
            var prevSelectedIndex = this.adapter_.getSelectedSiblingOfItemAtIndex(index);
            if (prevSelectedIndex >= 0) {
                this.adapter_.removeAttributeFromElementAtIndex(prevSelectedIndex, strings$b.ARIA_CHECKED_ATTR);
                this.adapter_.removeClassFromElementAtIndex(prevSelectedIndex, cssClasses$9.MENU_SELECTED_LIST_ITEM);
            }
            this.adapter_.addClassToElementAtIndex(index, cssClasses$9.MENU_SELECTED_LIST_ITEM);
            this.adapter_.addAttributeToElementAtIndex(index, strings$b.ARIA_CHECKED_ATTR, 'true');
        };
        /**
         * Sets the enabled state to isEnabled for the menu item at the given index.
         * @param index Index of the menu item
         * @param isEnabled The desired enabled state of the menu item.
         */
        MDCMenuFoundation.prototype.setEnabled = function (index, isEnabled) {
            this.validatedIndex_(index);
            if (isEnabled) {
                this.adapter_.removeClassFromElementAtIndex(index, cssClasses$8.LIST_ITEM_DISABLED_CLASS);
                this.adapter_.addAttributeToElementAtIndex(index, strings$b.ARIA_DISABLED_ATTR, 'false');
            }
            else {
                this.adapter_.addClassToElementAtIndex(index, cssClasses$8.LIST_ITEM_DISABLED_CLASS);
                this.adapter_.addAttributeToElementAtIndex(index, strings$b.ARIA_DISABLED_ATTR, 'true');
            }
        };
        MDCMenuFoundation.prototype.validatedIndex_ = function (index) {
            var menuSize = this.adapter_.getMenuItemCount();
            var isIndexInRange = index >= 0 && index < menuSize;
            if (!isIndexInRange) {
                throw new Error('MDCMenuFoundation: No list item at specified index.');
            }
        };
        return MDCMenuFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCMenu = /** @class */ (function (_super) {
        __extends(MDCMenu, _super);
        function MDCMenu() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCMenu.attachTo = function (root) {
            return new MDCMenu(root);
        };
        MDCMenu.prototype.initialize = function (menuSurfaceFactory, listFactory) {
            if (menuSurfaceFactory === void 0) { menuSurfaceFactory = function (el) { return new MDCMenuSurface(el); }; }
            if (listFactory === void 0) { listFactory = function (el) { return new MDCList(el); }; }
            this.menuSurfaceFactory_ = menuSurfaceFactory;
            this.listFactory_ = listFactory;
        };
        MDCMenu.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.menuSurface_ = this.menuSurfaceFactory_(this.root_);
            var list = this.root_.querySelector(strings$b.LIST_SELECTOR);
            if (list) {
                this.list_ = this.listFactory_(list);
                this.list_.wrapFocus = true;
            }
            else {
                this.list_ = null;
            }
            this.handleKeydown_ = function (evt) { return _this.foundation_.handleKeydown(evt); };
            this.handleItemAction_ = function (evt) { return _this.foundation_.handleItemAction(_this.items[evt.detail.index]); };
            this.handleMenuSurfaceOpened_ = function () { return _this.foundation_.handleMenuSurfaceOpened(); };
            this.menuSurface_.listen(MDCMenuSurfaceFoundation.strings.OPENED_EVENT, this.handleMenuSurfaceOpened_);
            this.listen('keydown', this.handleKeydown_);
            this.listen(MDCListFoundation.strings.ACTION_EVENT, this.handleItemAction_);
        };
        MDCMenu.prototype.destroy = function () {
            if (this.list_) {
                this.list_.destroy();
            }
            this.menuSurface_.destroy();
            this.menuSurface_.unlisten(MDCMenuSurfaceFoundation.strings.OPENED_EVENT, this.handleMenuSurfaceOpened_);
            this.unlisten('keydown', this.handleKeydown_);
            this.unlisten(MDCListFoundation.strings.ACTION_EVENT, this.handleItemAction_);
            _super.prototype.destroy.call(this);
        };
        Object.defineProperty(MDCMenu.prototype, "open", {
            get: function () {
                return this.menuSurface_.isOpen();
            },
            set: function (value) {
                if (value) {
                    this.menuSurface_.open();
                }
                else {
                    this.menuSurface_.close();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenu.prototype, "wrapFocus", {
            get: function () {
                return this.list_ ? this.list_.wrapFocus : false;
            },
            set: function (value) {
                if (this.list_) {
                    this.list_.wrapFocus = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenu.prototype, "items", {
            /**
             * Return the items within the menu. Note that this only contains the set of elements within
             * the items container that are proper list items, and not supplemental / presentational DOM
             * elements.
             */
            get: function () {
                return this.list_ ? this.list_.listElements : [];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCMenu.prototype, "quickOpen", {
            set: function (quickOpen) {
                this.menuSurface_.quickOpen = quickOpen;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Sets default focus state where the menu should focus every time when menu
         * is opened. Focuses the list root (`DefaultFocusState.LIST_ROOT`) element by
         * default.
         * @param focusState Default focus state.
         */
        MDCMenu.prototype.setDefaultFocusState = function (focusState) {
            this.foundation_.setDefaultFocusState(focusState);
        };
        /**
         * @param corner Default anchor corner alignment of top-left menu corner.
         */
        MDCMenu.prototype.setAnchorCorner = function (corner) {
            this.menuSurface_.setAnchorCorner(corner);
        };
        MDCMenu.prototype.setAnchorMargin = function (margin) {
            this.menuSurface_.setAnchorMargin(margin);
        };
        /**
         * Sets the list item as the selected row at the specified index.
         * @param index Index of list item within menu.
         */
        MDCMenu.prototype.setSelectedIndex = function (index) {
            this.foundation_.setSelectedIndex(index);
        };
        /**
         * Sets the enabled state to isEnabled for the menu item at the given index.
         * @param index Index of the menu item
         * @param isEnabled The desired enabled state of the menu item.
         */
        MDCMenu.prototype.setEnabled = function (index, isEnabled) {
            this.foundation_.setEnabled(index, isEnabled);
        };
        /**
         * @return The item within the menu at the index specified.
         */
        MDCMenu.prototype.getOptionByIndex = function (index) {
            var items = this.items;
            if (index < items.length) {
                return this.items[index];
            }
            else {
                return null;
            }
        };
        MDCMenu.prototype.setFixedPosition = function (isFixed) {
            this.menuSurface_.setFixedPosition(isFixed);
        };
        MDCMenu.prototype.hoistMenuToBody = function () {
            this.menuSurface_.hoistMenuToBody();
        };
        MDCMenu.prototype.setIsHoisted = function (isHoisted) {
            this.menuSurface_.setIsHoisted(isHoisted);
        };
        MDCMenu.prototype.setAbsolutePosition = function (x, y) {
            this.menuSurface_.setAbsolutePosition(x, y);
        };
        /**
         * Sets the element that the menu-surface is anchored to.
         */
        MDCMenu.prototype.setAnchorElement = function (element) {
            this.menuSurface_.anchorElement = element;
        };
        MDCMenu.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                addClassToElementAtIndex: function (index, className) {
                    var list = _this.items;
                    list[index].classList.add(className);
                },
                removeClassFromElementAtIndex: function (index, className) {
                    var list = _this.items;
                    list[index].classList.remove(className);
                },
                addAttributeToElementAtIndex: function (index, attr, value) {
                    var list = _this.items;
                    list[index].setAttribute(attr, value);
                },
                removeAttributeFromElementAtIndex: function (index, attr) {
                    var list = _this.items;
                    list[index].removeAttribute(attr);
                },
                elementContainsClass: function (element, className) { return element.classList.contains(className); },
                closeSurface: function (skipRestoreFocus) { return _this.menuSurface_.close(skipRestoreFocus); },
                getElementIndex: function (element) { return _this.items.indexOf(element); },
                notifySelected: function (evtData) { return _this.emit(strings$b.SELECTED_EVENT, {
                    index: evtData.index,
                    item: _this.items[evtData.index],
                }); },
                getMenuItemCount: function () { return _this.items.length; },
                focusItemAtIndex: function (index) { return _this.items[index].focus(); },
                focusListRoot: function () { return _this.root_.querySelector(strings$b.LIST_SELECTOR).focus(); },
                isSelectableItemAtIndex: function (index) { return !!closest(_this.items[index], "." + cssClasses$9.MENU_SELECTION_GROUP); },
                getSelectedSiblingOfItemAtIndex: function (index) {
                    var selectionGroupEl = closest(_this.items[index], "." + cssClasses$9.MENU_SELECTION_GROUP);
                    var selectedItemEl = selectionGroupEl.querySelector("." + cssClasses$9.MENU_SELECTED_LIST_ITEM);
                    return selectedItemEl ? _this.items.indexOf(selectedItemEl) : -1;
                },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCMenuFoundation(adapter);
        };
        return MDCMenu;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules\@smui\menu-surface\MenuSurface.svelte generated by Svelte v3.20.1 */
    const file$t = "node_modules\\@smui\\menu-surface\\MenuSurface.svelte";

    function create_fragment$v(ctx) {
    	let div;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[27].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[26], null);

    	let div_levels = [
    		{
    			class: "\n    mdc-menu-surface\n    " + /*className*/ ctx[3] + "\n    " + (/*fixed*/ ctx[0] ? "mdc-menu-surface--fixed" : "") + "\n    " + (/*isStatic*/ ctx[4] ? "mdc-menu-surface--open" : "") + "\n    " + (/*isStatic*/ ctx[4] ? "smui-menu-surface--static" : "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[7], [
    			"use",
    			"class",
    			"static",
    			"anchor",
    			"fixed",
    			"open",
    			"quickOpen",
    			"anchorElement",
    			"anchorCorner",
    			"element"
    		])
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$t, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[28](div);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[2])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[5].call(null, div)),
    				listen_dev(div, "MDCMenuSurface:closed", /*updateOpen*/ ctx[6], false, false, false),
    				listen_dev(div, "MDCMenuSurface:opened", /*updateOpen*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 67108864) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[26], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[26], dirty, null));
    				}
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				dirty & /*className, fixed, isStatic*/ 25 && {
    					class: "\n    mdc-menu-surface\n    " + /*className*/ ctx[3] + "\n    " + (/*fixed*/ ctx[0] ? "mdc-menu-surface--fixed" : "") + "\n    " + (/*isStatic*/ ctx[4] ? "mdc-menu-surface--open" : "") + "\n    " + (/*isStatic*/ ctx[4] ? "smui-menu-surface--static" : "") + "\n  "
    				},
    				dirty & /*exclude, $$props*/ 128 && exclude(/*$$props*/ ctx[7], [
    					"use",
    					"class",
    					"static",
    					"anchor",
    					"fixed",
    					"open",
    					"quickOpen",
    					"anchorElement",
    					"anchorCorner",
    					"element"
    				])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 4) useActions_action.update.call(null, /*use*/ ctx[2]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[28](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCMenuSurface:closed", "MDCMenuSurface:opened"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { static: isStatic = false } = $$props;
    	let { anchor = true } = $$props;
    	let { fixed = false } = $$props;
    	let { open = isStatic } = $$props;
    	let { quickOpen = false } = $$props;
    	let { anchorElement = null } = $$props;
    	let { anchorCorner = null } = $$props;
    	let { element = undefined } = $$props; // This is exported because Menu needs it.
    	let menuSurface;
    	let instantiate = getContext("SMUI:menu-surface:instantiate");
    	let getInstance = getContext("SMUI:menu-surface:getInstance");
    	setContext("SMUI:list:role", "menu");
    	setContext("SMUI:list:item:role", "menuitem");
    	let oldFixed = null;

    	onMount(async () => {
    		if (instantiate !== false) {
    			$$invalidate(22, menuSurface = new MDCMenuSurface(element));
    		} else {
    			$$invalidate(22, menuSurface = await getInstance());
    		}
    	});

    	onDestroy(() => {
    		if (anchor) {
    			element && element.parentNode.classList.remove("mdc-menu-surface--anchor");
    		}

    		let isHoisted = false;

    		if (menuSurface) {
    			isHoisted = menuSurface.foundation_.isHoistedElement_;

    			if (instantiate !== false) {
    				menuSurface.destroy();
    			}
    		}

    		if (isHoisted) {
    			element.parentNode.removeChild(element);
    		}
    	});

    	function updateOpen() {
    		if (menuSurface) {
    			if (isStatic) {
    				$$invalidate(8, open = true);
    			} else {
    				$$invalidate(8, open = menuSurface.isOpen());
    			}
    		}
    	}

    	function setOpen(value) {
    		$$invalidate(8, open = value);
    	}

    	function setAnchorCorner(...args) {
    		return menuSurface.setAnchorCorner(...args);
    	}

    	function setAnchorMargin(...args) {
    		return menuSurface.setAnchorMargin(...args);
    	}

    	function setFixedPosition(isFixed, ...args) {
    		$$invalidate(0, fixed = isFixed);
    		return menuSurface.setFixedPosition(isFixed, ...args);
    	}

    	function setAbsolutePosition(...args) {
    		return menuSurface.setAbsolutePosition(...args);
    	}

    	function setMenuSurfaceAnchorElement(...args) {
    		return menuSurface.setMenuSurfaceAnchorElement(...args);
    	}

    	function hoistMenuToBody(...args) {
    		return menuSurface.hoistMenuToBody(...args);
    	}

    	function setIsHoisted(...args) {
    		return menuSurface.setIsHoisted(...args);
    	}

    	function getDefaultFoundation(...args) {
    		return menuSurface.getDefaultFoundation(...args);
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MenuSurface", $$slots, ['default']);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(2, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ("static" in $$new_props) $$invalidate(4, isStatic = $$new_props.static);
    		if ("anchor" in $$new_props) $$invalidate(10, anchor = $$new_props.anchor);
    		if ("fixed" in $$new_props) $$invalidate(0, fixed = $$new_props.fixed);
    		if ("open" in $$new_props) $$invalidate(8, open = $$new_props.open);
    		if ("quickOpen" in $$new_props) $$invalidate(11, quickOpen = $$new_props.quickOpen);
    		if ("anchorElement" in $$new_props) $$invalidate(9, anchorElement = $$new_props.anchorElement);
    		if ("anchorCorner" in $$new_props) $$invalidate(12, anchorCorner = $$new_props.anchorCorner);
    		if ("element" in $$new_props) $$invalidate(1, element = $$new_props.element);
    		if ("$$scope" in $$new_props) $$invalidate(26, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Corner,
    		CornerBit,
    		MDCMenuSurface,
    		onMount,
    		onDestroy,
    		getContext,
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		isStatic,
    		anchor,
    		fixed,
    		open,
    		quickOpen,
    		anchorElement,
    		anchorCorner,
    		element,
    		menuSurface,
    		instantiate,
    		getInstance,
    		oldFixed,
    		updateOpen,
    		setOpen,
    		setAnchorCorner,
    		setAnchorMargin,
    		setFixedPosition,
    		setAbsolutePosition,
    		setMenuSurfaceAnchorElement,
    		hoistMenuToBody,
    		setIsHoisted,
    		getDefaultFoundation
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(2, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
    		if ("isStatic" in $$props) $$invalidate(4, isStatic = $$new_props.isStatic);
    		if ("anchor" in $$props) $$invalidate(10, anchor = $$new_props.anchor);
    		if ("fixed" in $$props) $$invalidate(0, fixed = $$new_props.fixed);
    		if ("open" in $$props) $$invalidate(8, open = $$new_props.open);
    		if ("quickOpen" in $$props) $$invalidate(11, quickOpen = $$new_props.quickOpen);
    		if ("anchorElement" in $$props) $$invalidate(9, anchorElement = $$new_props.anchorElement);
    		if ("anchorCorner" in $$props) $$invalidate(12, anchorCorner = $$new_props.anchorCorner);
    		if ("element" in $$props) $$invalidate(1, element = $$new_props.element);
    		if ("menuSurface" in $$props) $$invalidate(22, menuSurface = $$new_props.menuSurface);
    		if ("instantiate" in $$props) instantiate = $$new_props.instantiate;
    		if ("getInstance" in $$props) getInstance = $$new_props.getInstance;
    		if ("oldFixed" in $$props) $$invalidate(23, oldFixed = $$new_props.oldFixed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*element, anchor*/ 1026) {
    			 if (element && anchor && !element.parentNode.classList.contains("mdc-menu-surface--anchor")) {
    				element.parentNode.classList.add("mdc-menu-surface--anchor");
    				$$invalidate(9, anchorElement = element.parentNode);
    			}
    		}

    		if ($$self.$$.dirty & /*menuSurface, quickOpen*/ 4196352) {
    			 if (menuSurface && menuSurface.quickOpen !== quickOpen) {
    				$$invalidate(22, menuSurface.quickOpen = quickOpen, menuSurface);
    			}
    		}

    		if ($$self.$$.dirty & /*menuSurface, anchorElement*/ 4194816) {
    			 if (menuSurface && menuSurface.anchorElement !== anchorElement) {
    				$$invalidate(22, menuSurface.anchorElement = anchorElement, menuSurface);
    			}
    		}

    		if ($$self.$$.dirty & /*menuSurface, open*/ 4194560) {
    			 if (menuSurface && menuSurface.isOpen() !== open) {
    				if (open) {
    					menuSurface.open();
    				} else {
    					menuSurface.close();
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*menuSurface, oldFixed, fixed*/ 12582913) {
    			 if (menuSurface && oldFixed !== fixed) {
    				menuSurface.setFixedPosition(fixed);
    				$$invalidate(23, oldFixed = fixed);
    			}
    		}

    		if ($$self.$$.dirty & /*menuSurface, anchorCorner*/ 4198400) {
    			 if (menuSurface && anchorCorner != null) {
    				if (Corner.hasOwnProperty(anchorCorner)) {
    					menuSurface.setAnchorCorner(Corner[anchorCorner]);
    				} else if (CornerBit.hasOwnProperty(anchorCorner)) {
    					menuSurface.setAnchorCorner(Corner[anchorCorner]);
    				} else {
    					menuSurface.setAnchorCorner(anchorCorner);
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		fixed,
    		element,
    		use,
    		className,
    		isStatic,
    		forwardEvents,
    		updateOpen,
    		$$props,
    		open,
    		anchorElement,
    		anchor,
    		quickOpen,
    		anchorCorner,
    		setOpen,
    		setAnchorCorner,
    		setAnchorMargin,
    		setFixedPosition,
    		setAbsolutePosition,
    		setMenuSurfaceAnchorElement,
    		hoistMenuToBody,
    		setIsHoisted,
    		getDefaultFoundation,
    		menuSurface,
    		oldFixed,
    		instantiate,
    		getInstance,
    		$$scope,
    		$$slots,
    		div_binding
    	];
    }

    class MenuSurface extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {
    			use: 2,
    			class: 3,
    			static: 4,
    			anchor: 10,
    			fixed: 0,
    			open: 8,
    			quickOpen: 11,
    			anchorElement: 9,
    			anchorCorner: 12,
    			element: 1,
    			setOpen: 13,
    			setAnchorCorner: 14,
    			setAnchorMargin: 15,
    			setFixedPosition: 16,
    			setAbsolutePosition: 17,
    			setMenuSurfaceAnchorElement: 18,
    			hoistMenuToBody: 19,
    			setIsHoisted: 20,
    			getDefaultFoundation: 21
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MenuSurface",
    			options,
    			id: create_fragment$v.name
    		});
    	}

    	get use() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get static() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set static(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get anchor() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set anchor(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fixed() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fixed(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get quickOpen() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quickOpen(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get anchorElement() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set anchorElement(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get anchorCorner() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set anchorCorner(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get element() {
    		throw new Error("<MenuSurface>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setOpen() {
    		return this.$$.ctx[13];
    	}

    	set setOpen(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setAnchorCorner() {
    		return this.$$.ctx[14];
    	}

    	set setAnchorCorner(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setAnchorMargin() {
    		return this.$$.ctx[15];
    	}

    	set setAnchorMargin(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setFixedPosition() {
    		return this.$$.ctx[16];
    	}

    	set setFixedPosition(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setAbsolutePosition() {
    		return this.$$.ctx[17];
    	}

    	set setAbsolutePosition(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setMenuSurfaceAnchorElement() {
    		return this.$$.ctx[18];
    	}

    	set setMenuSurfaceAnchorElement(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hoistMenuToBody() {
    		return this.$$.ctx[19];
    	}

    	set hoistMenuToBody(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setIsHoisted() {
    		return this.$$.ctx[20];
    	}

    	set setIsHoisted(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getDefaultFoundation() {
    		return this.$$.ctx[21];
    	}

    	set getDefaultFoundation(value) {
    		throw new Error("<MenuSurface>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\menu\Menu.svelte generated by Svelte v3.20.1 */

    // (1:0) <MenuSurface   bind:element   use={[forwardEvents, ...use]}   class="mdc-menu {className}"   on:MDCMenu:selected={updateOpen}   on:MDCMenuSurface:closed={updateOpen} on:MDCMenuSurface:opened={updateOpen}   {...exclude($$props, ['use', 'class', 'wrapFocus'])} >
    function create_default_slot$c(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[34].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[36], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[1] & /*$$scope*/ 32) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[36], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[36], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$c.name,
    		type: "slot",
    		source: "(1:0) <MenuSurface   bind:element   use={[forwardEvents, ...use]}   class=\\\"mdc-menu {className}\\\"   on:MDCMenu:selected={updateOpen}   on:MDCMenuSurface:closed={updateOpen} on:MDCMenuSurface:opened={updateOpen}   {...exclude($$props, ['use', 'class', 'wrapFocus'])} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$w(ctx) {
    	let updating_element;
    	let current;

    	const menusurface_spread_levels = [
    		{
    			use: [/*forwardEvents*/ ctx[3], .../*use*/ ctx[0]]
    		},
    		{
    			class: "mdc-menu " + /*className*/ ctx[1]
    		},
    		exclude(/*$$props*/ ctx[5], ["use", "class", "wrapFocus"])
    	];

    	function menusurface_element_binding(value) {
    		/*menusurface_element_binding*/ ctx[35].call(null, value);
    	}

    	let menusurface_props = {
    		$$slots: { default: [create_default_slot$c] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < menusurface_spread_levels.length; i += 1) {
    		menusurface_props = assign(menusurface_props, menusurface_spread_levels[i]);
    	}

    	if (/*element*/ ctx[2] !== void 0) {
    		menusurface_props.element = /*element*/ ctx[2];
    	}

    	const menusurface = new MenuSurface({ props: menusurface_props, $$inline: true });
    	binding_callbacks.push(() => bind(menusurface, "element", menusurface_element_binding));
    	menusurface.$on("MDCMenu:selected", /*updateOpen*/ ctx[4]);
    	menusurface.$on("MDCMenuSurface:closed", /*updateOpen*/ ctx[4]);
    	menusurface.$on("MDCMenuSurface:opened", /*updateOpen*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(menusurface.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(menusurface, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const menusurface_changes = (dirty[0] & /*forwardEvents, use, className, $$props*/ 43)
    			? get_spread_update(menusurface_spread_levels, [
    					dirty[0] & /*forwardEvents, use*/ 9 && {
    						use: [/*forwardEvents*/ ctx[3], .../*use*/ ctx[0]]
    					},
    					dirty[0] & /*className*/ 2 && {
    						class: "mdc-menu " + /*className*/ ctx[1]
    					},
    					dirty[0] & /*$$props*/ 32 && get_spread_object(exclude(/*$$props*/ ctx[5], ["use", "class", "wrapFocus"]))
    				])
    			: {};

    			if (dirty[1] & /*$$scope*/ 32) {
    				menusurface_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_element && dirty[0] & /*element*/ 4) {
    				updating_element = true;
    				menusurface_changes.element = /*element*/ ctx[2];
    				add_flush_callback(() => updating_element = false);
    			}

    			menusurface.$set(menusurface_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menusurface.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menusurface.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menusurface, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCMenu:selected", "MDCMenuSurface:closed", "MDCMenuSurface:opened"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { static: isStatic = false } = $$props;
    	let { open = isStatic } = $$props; // Purposely omitted from the exclude call above.
    	let { quickOpen = false } = $$props; // Purposely omitted from the exclude call above.
    	let { anchorCorner = null } = $$props; // Purposely omitted from the exclude call above.
    	let { wrapFocus = false } = $$props;
    	let element;
    	let menu;
    	let instantiate = getContext("SMUI:menu:instantiate");
    	let getInstance = getContext("SMUI:menu:getInstance");
    	let menuSurfacePromiseResolve;
    	let menuSurfacePromise = new Promise(resolve => menuSurfacePromiseResolve = resolve);
    	let listPromiseResolve;
    	let listPromise = new Promise(resolve => listPromiseResolve = resolve);
    	setContext("SMUI:menu-surface:instantiate", false);
    	setContext("SMUI:menu-surface:getInstance", getMenuSurfaceInstancePromise);
    	setContext("SMUI:list:instantiate", false);
    	setContext("SMUI:list:getInstance", getListInstancePromise);

    	onMount(async () => {
    		if (instantiate !== false) {
    			$$invalidate(25, menu = new MDCMenu(element));
    		} else {
    			$$invalidate(25, menu = await getInstance());
    		}

    		menuSurfacePromiseResolve(menu.menuSurface_);
    		listPromiseResolve(menu.list_);
    	});

    	onDestroy(() => {
    		if (instantiate !== false) {
    			menu && menu.destroy();
    		}
    	});

    	function getMenuSurfaceInstancePromise() {
    		return menuSurfacePromise;
    	}

    	function getListInstancePromise() {
    		return listPromise;
    	}

    	function updateOpen() {
    		$$invalidate(6, open = menu.open);
    	}

    	function setOpen(value) {
    		$$invalidate(6, open = value);
    	}

    	function getItems() {
    		return menu.items;
    	}

    	function setDefaultFocusState(...args) {
    		return menu.setDefaultFocusState(...args);
    	}

    	function setAnchorCorner(...args) {
    		return menu.setAnchorCorner(...args);
    	}

    	function setAnchorMargin(...args) {
    		return menu.setAnchorMargin(...args);
    	}

    	function setSelectedIndex(...args) {
    		return menu.setSelectedIndex(...args);
    	}

    	function setEnabled(...args) {
    		return menu.setEnabled(...args);
    	}

    	function getOptionByIndex(...args) {
    		return menu.getOptionByIndex(...args);
    	}

    	function setFixedPosition(...args) {
    		return menu.setFixedPosition(...args);
    	}

    	function hoistMenuToBody(...args) {
    		return menu.hoistMenuToBody(...args);
    	}

    	function setIsHoisted(...args) {
    		return menu.setIsHoisted(...args);
    	}

    	function setAbsolutePosition(...args) {
    		return menu.setAbsolutePosition(...args);
    	}

    	function setAnchorElement(...args) {
    		return menu.setAnchorElement(...args);
    	}

    	function getDefaultFoundation(...args) {
    		return menu.getDefaultFoundation(...args);
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Menu", $$slots, ['default']);

    	function menusurface_element_binding(value) {
    		element = value;
    		$$invalidate(2, element);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("static" in $$new_props) $$invalidate(7, isStatic = $$new_props.static);
    		if ("open" in $$new_props) $$invalidate(6, open = $$new_props.open);
    		if ("quickOpen" in $$new_props) $$invalidate(8, quickOpen = $$new_props.quickOpen);
    		if ("anchorCorner" in $$new_props) $$invalidate(9, anchorCorner = $$new_props.anchorCorner);
    		if ("wrapFocus" in $$new_props) $$invalidate(10, wrapFocus = $$new_props.wrapFocus);
    		if ("$$scope" in $$new_props) $$invalidate(36, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		MDCMenu,
    		onMount,
    		onDestroy,
    		getContext,
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		MenuSurface,
    		Corner,
    		CornerBit,
    		forwardEvents,
    		use,
    		className,
    		isStatic,
    		open,
    		quickOpen,
    		anchorCorner,
    		wrapFocus,
    		element,
    		menu,
    		instantiate,
    		getInstance,
    		menuSurfacePromiseResolve,
    		menuSurfacePromise,
    		listPromiseResolve,
    		listPromise,
    		getMenuSurfaceInstancePromise,
    		getListInstancePromise,
    		updateOpen,
    		setOpen,
    		getItems,
    		setDefaultFocusState,
    		setAnchorCorner,
    		setAnchorMargin,
    		setSelectedIndex,
    		setEnabled,
    		getOptionByIndex,
    		setFixedPosition,
    		hoistMenuToBody,
    		setIsHoisted,
    		setAbsolutePosition,
    		setAnchorElement,
    		getDefaultFoundation
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("isStatic" in $$props) $$invalidate(7, isStatic = $$new_props.isStatic);
    		if ("open" in $$props) $$invalidate(6, open = $$new_props.open);
    		if ("quickOpen" in $$props) $$invalidate(8, quickOpen = $$new_props.quickOpen);
    		if ("anchorCorner" in $$props) $$invalidate(9, anchorCorner = $$new_props.anchorCorner);
    		if ("wrapFocus" in $$props) $$invalidate(10, wrapFocus = $$new_props.wrapFocus);
    		if ("element" in $$props) $$invalidate(2, element = $$new_props.element);
    		if ("menu" in $$props) $$invalidate(25, menu = $$new_props.menu);
    		if ("instantiate" in $$props) instantiate = $$new_props.instantiate;
    		if ("getInstance" in $$props) getInstance = $$new_props.getInstance;
    		if ("menuSurfacePromiseResolve" in $$props) menuSurfacePromiseResolve = $$new_props.menuSurfacePromiseResolve;
    		if ("menuSurfacePromise" in $$props) menuSurfacePromise = $$new_props.menuSurfacePromise;
    		if ("listPromiseResolve" in $$props) listPromiseResolve = $$new_props.listPromiseResolve;
    		if ("listPromise" in $$props) listPromise = $$new_props.listPromise;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*menu, open, isStatic*/ 33554624) {
    			 if (menu && menu.open !== open) {
    				if (isStatic) {
    					$$invalidate(6, open = true);
    				}

    				$$invalidate(25, menu.open = open, menu);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*menu, wrapFocus*/ 33555456) {
    			 if (menu && menu.wrapFocus !== wrapFocus) {
    				$$invalidate(25, menu.wrapFocus = wrapFocus, menu);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*menu, quickOpen*/ 33554688) {
    			 if (menu) {
    				$$invalidate(25, menu.quickOpen = quickOpen, menu);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*menu, anchorCorner*/ 33554944) {
    			 if (menu && anchorCorner != null) {
    				if (Corner.hasOwnProperty(anchorCorner)) {
    					menu.setAnchorCorner(Corner[anchorCorner]);
    				} else if (CornerBit.hasOwnProperty(anchorCorner)) {
    					menu.setAnchorCorner(Corner[anchorCorner]);
    				} else {
    					menu.setAnchorCorner(anchorCorner);
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		element,
    		forwardEvents,
    		updateOpen,
    		$$props,
    		open,
    		isStatic,
    		quickOpen,
    		anchorCorner,
    		wrapFocus,
    		setOpen,
    		getItems,
    		setDefaultFocusState,
    		setAnchorCorner,
    		setAnchorMargin,
    		setSelectedIndex,
    		setEnabled,
    		getOptionByIndex,
    		setFixedPosition,
    		hoistMenuToBody,
    		setIsHoisted,
    		setAbsolutePosition,
    		setAnchorElement,
    		getDefaultFoundation,
    		menu,
    		menuSurfacePromiseResolve,
    		listPromiseResolve,
    		instantiate,
    		getInstance,
    		menuSurfacePromise,
    		listPromise,
    		getMenuSurfaceInstancePromise,
    		getListInstancePromise,
    		$$slots,
    		menusurface_element_binding,
    		$$scope
    	];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$w,
    			create_fragment$w,
    			safe_not_equal,
    			{
    				use: 0,
    				class: 1,
    				static: 7,
    				open: 6,
    				quickOpen: 8,
    				anchorCorner: 9,
    				wrapFocus: 10,
    				setOpen: 11,
    				getItems: 12,
    				setDefaultFocusState: 13,
    				setAnchorCorner: 14,
    				setAnchorMargin: 15,
    				setSelectedIndex: 16,
    				setEnabled: 17,
    				getOptionByIndex: 18,
    				setFixedPosition: 19,
    				hoistMenuToBody: 20,
    				setIsHoisted: 21,
    				setAbsolutePosition: 22,
    				setAnchorElement: 23,
    				getDefaultFoundation: 24
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$w.name
    		});
    	}

    	get use() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get static() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set static(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get quickOpen() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quickOpen(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get anchorCorner() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set anchorCorner(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wrapFocus() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wrapFocus(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setOpen() {
    		return this.$$.ctx[11];
    	}

    	set setOpen(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getItems() {
    		return this.$$.ctx[12];
    	}

    	set getItems(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setDefaultFocusState() {
    		return this.$$.ctx[13];
    	}

    	set setDefaultFocusState(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setAnchorCorner() {
    		return this.$$.ctx[14];
    	}

    	set setAnchorCorner(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setAnchorMargin() {
    		return this.$$.ctx[15];
    	}

    	set setAnchorMargin(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setSelectedIndex() {
    		return this.$$.ctx[16];
    	}

    	set setSelectedIndex(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setEnabled() {
    		return this.$$.ctx[17];
    	}

    	set setEnabled(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getOptionByIndex() {
    		return this.$$.ctx[18];
    	}

    	set getOptionByIndex(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setFixedPosition() {
    		return this.$$.ctx[19];
    	}

    	set setFixedPosition(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hoistMenuToBody() {
    		return this.$$.ctx[20];
    	}

    	set hoistMenuToBody(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setIsHoisted() {
    		return this.$$.ctx[21];
    	}

    	set setIsHoisted(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setAbsolutePosition() {
    		return this.$$.ctx[22];
    	}

    	set setAbsolutePosition(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setAnchorElement() {
    		return this.$$.ctx[23];
    	}

    	set setAnchorElement(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getDefaultFoundation() {
    		return this.$$.ctx[24];
    	}

    	set getDefaultFoundation(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\menu\SelectionGroup.svelte generated by Svelte v3.20.1 */
    const file$u = "node_modules\\@smui\\menu\\SelectionGroup.svelte";

    function create_fragment$x(ctx) {
    	let li;
    	let ul;
    	let useActions_action;
    	let useActions_action_1;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	let ul_levels = [
    		{
    			class: "mdc-menu__selection-group " + /*list$class*/ ctx[2]
    		},
    		exclude(prefixFilter(/*$$props*/ ctx[4], "list$"), ["use", "class"])
    	];

    	let ul_data = {};

    	for (let i = 0; i < ul_levels.length; i += 1) {
    		ul_data = assign(ul_data, ul_levels[i]);
    	}

    	let li_levels = [exclude(/*$$props*/ ctx[4], ["use", "list$"])];
    	let li_data = {};

    	for (let i = 0; i < li_levels.length; i += 1) {
    		li_data = assign(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			set_attributes(ul, ul_data);
    			add_location(ul, file$u, 5, 2, 93);
    			set_attributes(li, li_data);
    			add_location(li, file$u, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, li, anchor);
    			append_dev(li, ul);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, ul, /*list$use*/ ctx[1])),
    				action_destroyer(useActions_action_1 = useActions.call(null, li, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[3].call(null, li))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    				}
    			}

    			set_attributes(ul, get_spread_update(ul_levels, [
    				dirty & /*list$class*/ 4 && {
    					class: "mdc-menu__selection-group " + /*list$class*/ ctx[2]
    				},
    				dirty & /*exclude, prefixFilter, $$props*/ 16 && exclude(prefixFilter(/*$$props*/ ctx[4], "list$"), ["use", "class"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*list$use*/ 2) useActions_action.update.call(null, /*list$use*/ ctx[1]);

    			set_attributes(li, get_spread_update(li_levels, [
    				dirty & /*exclude, $$props*/ 16 && exclude(/*$$props*/ ctx[4], ["use", "list$"])
    			]));

    			if (useActions_action_1 && is_function(useActions_action_1.update) && dirty & /*use*/ 1) useActions_action_1.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { list$use = [] } = $$props;
    	let { list$class = "" } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SelectionGroup", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("list$use" in $$new_props) $$invalidate(1, list$use = $$new_props.list$use);
    		if ("list$class" in $$new_props) $$invalidate(2, list$class = $$new_props.list$class);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		prefixFilter,
    		useActions,
    		forwardEvents,
    		use,
    		list$use,
    		list$class
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("list$use" in $$props) $$invalidate(1, list$use = $$new_props.list$use);
    		if ("list$class" in $$props) $$invalidate(2, list$class = $$new_props.list$class);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, list$use, list$class, forwardEvents, $$props, $$scope, $$slots];
    }

    class SelectionGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, { use: 0, list$use: 1, list$class: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectionGroup",
    			options,
    			id: create_fragment$x.name
    		});
    	}

    	get use() {
    		throw new Error("<SelectionGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<SelectionGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get list$use() {
    		throw new Error("<SelectionGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set list$use(value) {
    		throw new Error("<SelectionGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get list$class() {
    		throw new Error("<SelectionGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set list$class(value) {
    		throw new Error("<SelectionGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Graphic = classAdderBuilder({
      class: 'mdc-list-item__graphic',
      component: Span,
      contexts: {}
    });

    var SelectionGroupIcon = classAdderBuilder({
      class: 'mdc-menu__selection-group-icon',
      component: Graphic,
      contexts: {}
    });

    function Anchor(node) {
      node.classList.add('mdc-menu-surface--anchor');

      return {
        destroy() {
          node.classList.remove('mdc-menu-surface--anchor');
        }
      }
    }

    /* node_modules\@smui\list\List.svelte generated by Svelte v3.20.1 */
    const file$v = "node_modules\\@smui\\list\\List.svelte";

    // (18:0) {:else}
    function create_else_block$4(ctx) {
    	let ul;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[29].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[28], null);

    	let ul_levels = [
    		{
    			class: "\n      mdc-list\n      " + /*className*/ ctx[1] + "\n      " + (/*nonInteractive*/ ctx[2]
    			? "mdc-list--non-interactive"
    			: "") + "\n      " + (/*dense*/ ctx[3] ? "mdc-list--dense" : "") + "\n      " + (/*avatarList*/ ctx[4] ? "mdc-list--avatar-list" : "") + "\n      " + (/*twoLine*/ ctx[5] ? "mdc-list--two-line" : "") + "\n      " + (/*threeLine*/ ctx[6] && !/*twoLine*/ ctx[5]
    			? "smui-list--three-line"
    			: "") + "\n    "
    		},
    		{ role: /*role*/ ctx[8] },
    		/*props*/ ctx[9]
    	];

    	let ul_data = {};

    	for (let i = 0; i < ul_levels.length; i += 1) {
    		ul_data = assign(ul_data, ul_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			set_attributes(ul, ul_data);
    			add_location(ul, file$v, 18, 2, 478);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, ul, anchor);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			/*ul_binding*/ ctx[31](ul);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, ul, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[10].call(null, ul)),
    				listen_dev(ul, "MDCList:action", /*handleAction*/ ctx[12], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 268435456) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[28], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[28], dirty, null));
    				}
    			}

    			set_attributes(ul, get_spread_update(ul_levels, [
    				dirty[0] & /*className, nonInteractive, dense, avatarList, twoLine, threeLine*/ 126 && {
    					class: "\n      mdc-list\n      " + /*className*/ ctx[1] + "\n      " + (/*nonInteractive*/ ctx[2]
    					? "mdc-list--non-interactive"
    					: "") + "\n      " + (/*dense*/ ctx[3] ? "mdc-list--dense" : "") + "\n      " + (/*avatarList*/ ctx[4] ? "mdc-list--avatar-list" : "") + "\n      " + (/*twoLine*/ ctx[5] ? "mdc-list--two-line" : "") + "\n      " + (/*threeLine*/ ctx[6] && !/*twoLine*/ ctx[5]
    					? "smui-list--three-line"
    					: "") + "\n    "
    				},
    				dirty[0] & /*role*/ 256 && { role: /*role*/ ctx[8] },
    				dirty[0] & /*props*/ 512 && /*props*/ ctx[9]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty[0] & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (default_slot) default_slot.d(detaching);
    			/*ul_binding*/ ctx[31](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(18:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (1:0) {#if nav}
    function create_if_block$a(ctx) {
    	let nav_1;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[29].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[28], null);

    	let nav_1_levels = [
    		{
    			class: "\n      mdc-list\n      " + /*className*/ ctx[1] + "\n      " + (/*nonInteractive*/ ctx[2]
    			? "mdc-list--non-interactive"
    			: "") + "\n      " + (/*dense*/ ctx[3] ? "mdc-list--dense" : "") + "\n      " + (/*avatarList*/ ctx[4] ? "mdc-list--avatar-list" : "") + "\n      " + (/*twoLine*/ ctx[5] ? "mdc-list--two-line" : "") + "\n      " + (/*threeLine*/ ctx[6] && !/*twoLine*/ ctx[5]
    			? "smui-list--three-line"
    			: "") + "\n    "
    		},
    		/*props*/ ctx[9]
    	];

    	let nav_1_data = {};

    	for (let i = 0; i < nav_1_levels.length; i += 1) {
    		nav_1_data = assign(nav_1_data, nav_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			nav_1 = element("nav");
    			if (default_slot) default_slot.c();
    			set_attributes(nav_1, nav_1_data);
    			add_location(nav_1, file$v, 1, 2, 12);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, nav_1, anchor);

    			if (default_slot) {
    				default_slot.m(nav_1, null);
    			}

    			/*nav_1_binding*/ ctx[30](nav_1);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, nav_1, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[10].call(null, nav_1)),
    				listen_dev(nav_1, "MDCList:action", /*handleAction*/ ctx[12], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 268435456) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[28], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[28], dirty, null));
    				}
    			}

    			set_attributes(nav_1, get_spread_update(nav_1_levels, [
    				dirty[0] & /*className, nonInteractive, dense, avatarList, twoLine, threeLine*/ 126 && {
    					class: "\n      mdc-list\n      " + /*className*/ ctx[1] + "\n      " + (/*nonInteractive*/ ctx[2]
    					? "mdc-list--non-interactive"
    					: "") + "\n      " + (/*dense*/ ctx[3] ? "mdc-list--dense" : "") + "\n      " + (/*avatarList*/ ctx[4] ? "mdc-list--avatar-list" : "") + "\n      " + (/*twoLine*/ ctx[5] ? "mdc-list--two-line" : "") + "\n      " + (/*threeLine*/ ctx[6] && !/*twoLine*/ ctx[5]
    					? "smui-list--three-line"
    					: "") + "\n    "
    				},
    				dirty[0] & /*props*/ 512 && /*props*/ ctx[9]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty[0] & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav_1);
    			if (default_slot) default_slot.d(detaching);
    			/*nav_1_binding*/ ctx[30](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(1:0) {#if nav}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$y(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$a, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*nav*/ ctx[11]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$y.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$y($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCList:action"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { nonInteractive = false } = $$props;
    	let { dense = false } = $$props;
    	let { avatarList = false } = $$props;
    	let { twoLine = false } = $$props;
    	let { threeLine = false } = $$props;
    	let { vertical = true } = $$props;
    	let { wrapFocus = false } = $$props;
    	let { singleSelection = false } = $$props;
    	let { selectedIndex = null } = $$props;
    	let { radiolist = false } = $$props;
    	let { checklist = false } = $$props;
    	let element;
    	let list;
    	let role = getContext("SMUI:list:role");
    	let nav = getContext("SMUI:list:nav");
    	let instantiate = getContext("SMUI:list:instantiate");
    	let getInstance = getContext("SMUI:list:getInstance");
    	let addLayoutListener = getContext("SMUI:addLayoutListener");
    	let removeLayoutListener;
    	setContext("SMUI:list:nonInteractive", nonInteractive);

    	if (!role) {
    		if (singleSelection) {
    			role = "listbox";
    			setContext("SMUI:list:item:role", "option");
    		} else if (radiolist) {
    			role = "radiogroup";
    			setContext("SMUI:list:item:role", "radio");
    		} else if (checklist) {
    			role = "group";
    			setContext("SMUI:list:item:role", "checkbox");
    		} else {
    			role = "list";
    			setContext("SMUI:list:item:role", undefined);
    		}
    	}

    	if (addLayoutListener) {
    		removeLayoutListener = addLayoutListener(layout);
    	}

    	onMount(async () => {
    		if (instantiate !== false) {
    			$$invalidate(22, list = new MDCList(element));
    		} else {
    			$$invalidate(22, list = await getInstance());
    		}

    		if (singleSelection) {
    			list.initializeListType();
    			$$invalidate(13, selectedIndex = list.selectedIndex);
    		}
    	});

    	onDestroy(() => {
    		if (instantiate !== false) {
    			list && list.destroy();
    		}

    		if (removeLayoutListener) {
    			removeLayoutListener();
    		}
    	});

    	function handleAction(e) {
    		if (list && list.listElements[e.detail.index].classList.contains("mdc-list-item--disabled")) {
    			e.preventDefault();
    			$$invalidate(22, list.selectedIndex = selectedIndex, list);
    		} else if (list && list.selectedIndex === e.detail.index) {
    			$$invalidate(13, selectedIndex = e.detail.index);
    		}
    	}

    	function layout(...args) {
    		return list.layout(...args);
    	}

    	function setEnabled(...args) {
    		return list.setEnabled(...args);
    	}

    	function getDefaultFoundation(...args) {
    		return list.getDefaultFoundation(...args);
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("List", $$slots, ['default']);

    	function nav_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	function ul_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(27, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("nonInteractive" in $$new_props) $$invalidate(2, nonInteractive = $$new_props.nonInteractive);
    		if ("dense" in $$new_props) $$invalidate(3, dense = $$new_props.dense);
    		if ("avatarList" in $$new_props) $$invalidate(4, avatarList = $$new_props.avatarList);
    		if ("twoLine" in $$new_props) $$invalidate(5, twoLine = $$new_props.twoLine);
    		if ("threeLine" in $$new_props) $$invalidate(6, threeLine = $$new_props.threeLine);
    		if ("vertical" in $$new_props) $$invalidate(14, vertical = $$new_props.vertical);
    		if ("wrapFocus" in $$new_props) $$invalidate(15, wrapFocus = $$new_props.wrapFocus);
    		if ("singleSelection" in $$new_props) $$invalidate(16, singleSelection = $$new_props.singleSelection);
    		if ("selectedIndex" in $$new_props) $$invalidate(13, selectedIndex = $$new_props.selectedIndex);
    		if ("radiolist" in $$new_props) $$invalidate(17, radiolist = $$new_props.radiolist);
    		if ("checklist" in $$new_props) $$invalidate(18, checklist = $$new_props.checklist);
    		if ("$$scope" in $$new_props) $$invalidate(28, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		MDCList,
    		onMount,
    		onDestroy,
    		getContext,
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		nonInteractive,
    		dense,
    		avatarList,
    		twoLine,
    		threeLine,
    		vertical,
    		wrapFocus,
    		singleSelection,
    		selectedIndex,
    		radiolist,
    		checklist,
    		element,
    		list,
    		role,
    		nav,
    		instantiate,
    		getInstance,
    		addLayoutListener,
    		removeLayoutListener,
    		handleAction,
    		layout,
    		setEnabled,
    		getDefaultFoundation,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(27, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("nonInteractive" in $$props) $$invalidate(2, nonInteractive = $$new_props.nonInteractive);
    		if ("dense" in $$props) $$invalidate(3, dense = $$new_props.dense);
    		if ("avatarList" in $$props) $$invalidate(4, avatarList = $$new_props.avatarList);
    		if ("twoLine" in $$props) $$invalidate(5, twoLine = $$new_props.twoLine);
    		if ("threeLine" in $$props) $$invalidate(6, threeLine = $$new_props.threeLine);
    		if ("vertical" in $$props) $$invalidate(14, vertical = $$new_props.vertical);
    		if ("wrapFocus" in $$props) $$invalidate(15, wrapFocus = $$new_props.wrapFocus);
    		if ("singleSelection" in $$props) $$invalidate(16, singleSelection = $$new_props.singleSelection);
    		if ("selectedIndex" in $$props) $$invalidate(13, selectedIndex = $$new_props.selectedIndex);
    		if ("radiolist" in $$props) $$invalidate(17, radiolist = $$new_props.radiolist);
    		if ("checklist" in $$props) $$invalidate(18, checklist = $$new_props.checklist);
    		if ("element" in $$props) $$invalidate(7, element = $$new_props.element);
    		if ("list" in $$props) $$invalidate(22, list = $$new_props.list);
    		if ("role" in $$props) $$invalidate(8, role = $$new_props.role);
    		if ("nav" in $$props) $$invalidate(11, nav = $$new_props.nav);
    		if ("instantiate" in $$props) instantiate = $$new_props.instantiate;
    		if ("getInstance" in $$props) getInstance = $$new_props.getInstance;
    		if ("addLayoutListener" in $$props) addLayoutListener = $$new_props.addLayoutListener;
    		if ("removeLayoutListener" in $$props) removeLayoutListener = $$new_props.removeLayoutListener;
    		if ("props" in $$props) $$invalidate(9, props = $$new_props.props);
    	};

    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(9, props = exclude($$props, [
    			"use",
    			"class",
    			"nonInteractive",
    			"dense",
    			"avatarList",
    			"twoLine",
    			"threeLine",
    			"vertical",
    			"wrapFocus",
    			"singleSelection",
    			"selectedIndex",
    			"radiolist",
    			"checklist"
    		]));

    		if ($$self.$$.dirty[0] & /*list, vertical*/ 4210688) {
    			 if (list && list.vertical !== vertical) {
    				$$invalidate(22, list.vertical = vertical, list);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*list, wrapFocus*/ 4227072) {
    			 if (list && list.wrapFocus !== wrapFocus) {
    				$$invalidate(22, list.wrapFocus = wrapFocus, list);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*list, singleSelection*/ 4259840) {
    			 if (list && list.singleSelection !== singleSelection) {
    				$$invalidate(22, list.singleSelection = singleSelection, list);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*list, singleSelection, selectedIndex*/ 4268032) {
    			 if (list && singleSelection && list.selectedIndex !== selectedIndex) {
    				$$invalidate(22, list.selectedIndex = selectedIndex, list);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		nonInteractive,
    		dense,
    		avatarList,
    		twoLine,
    		threeLine,
    		element,
    		role,
    		props,
    		forwardEvents,
    		nav,
    		handleAction,
    		selectedIndex,
    		vertical,
    		wrapFocus,
    		singleSelection,
    		radiolist,
    		checklist,
    		layout,
    		setEnabled,
    		getDefaultFoundation,
    		list,
    		removeLayoutListener,
    		instantiate,
    		getInstance,
    		addLayoutListener,
    		$$props,
    		$$scope,
    		$$slots,
    		nav_1_binding,
    		ul_binding
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$y,
    			create_fragment$y,
    			safe_not_equal,
    			{
    				use: 0,
    				class: 1,
    				nonInteractive: 2,
    				dense: 3,
    				avatarList: 4,
    				twoLine: 5,
    				threeLine: 6,
    				vertical: 14,
    				wrapFocus: 15,
    				singleSelection: 16,
    				selectedIndex: 13,
    				radiolist: 17,
    				checklist: 18,
    				layout: 19,
    				setEnabled: 20,
    				getDefaultFoundation: 21
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$y.name
    		});
    	}

    	get use() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nonInteractive() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nonInteractive(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get avatarList() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set avatarList(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get twoLine() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set twoLine(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get threeLine() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set threeLine(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wrapFocus() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wrapFocus(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get singleSelection() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set singleSelection(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIndex() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get radiolist() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set radiolist(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checklist() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checklist(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		return this.$$.ctx[19];
    	}

    	set layout(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setEnabled() {
    		return this.$$.ctx[20];
    	}

    	set setEnabled(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getDefaultFoundation() {
    		return this.$$.ctx[21];
    	}

    	set getDefaultFoundation(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\list\Item.svelte generated by Svelte v3.20.1 */
    const file$w = "node_modules\\@smui\\list\\Item.svelte";

    // (40:0) {:else}
    function create_else_block$5(ctx) {
    	let li;
    	let useActions_action;
    	let forwardEvents_action;
    	let Ripple_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[25].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[24], null);

    	let li_levels = [
    		/*role*/ ctx[6] === "option"
    		? {
    				"aria-selected": /*selected*/ ctx[7] ? "true" : "false"
    			}
    		: {},
    		/*props*/ ctx[12],
    		{
    			class: "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n      " + (/*role*/ ctx[6] === "menuitem" && /*selected*/ ctx[7]
    			? "mdc-menu-item--selected"
    			: "") + "\n    "
    		},
    		{ role: /*role*/ ctx[6] },
    		/*role*/ ctx[6] === "radio" || /*role*/ ctx[6] === "checkbox"
    		? {
    				"aria-checked": /*checked*/ ctx[10] ? "true" : "false"
    			}
    		: {},
    		{ tabindex: /*tabindex*/ ctx[0] }
    	];

    	let li_data = {};

    	for (let i = 0; i < li_levels.length; i += 1) {
    		li_data = assign(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (default_slot) default_slot.c();
    			set_attributes(li, li_data);
    			add_location(li, file$w, 40, 2, 1053);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			/*li_binding*/ ctx[28](li);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, li, /*use*/ ctx[1])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[13].call(null, li)),
    				action_destroyer(Ripple_action = Ripple.call(null, li, {
    					ripple: /*ripple*/ ctx[3],
    					unbounded: false,
    					color: /*color*/ ctx[4]
    				})),
    				listen_dev(li, "click", /*action*/ ctx[15], false, false, false),
    				listen_dev(li, "keydown", /*handleKeydown*/ ctx[16], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16777216) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[24], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[24], dirty, null));
    				}
    			}

    			set_attributes(li, get_spread_update(li_levels, [
    				dirty & /*role, selected*/ 192 && (/*role*/ ctx[6] === "option"
    				? {
    						"aria-selected": /*selected*/ ctx[7] ? "true" : "false"
    					}
    				: {}),
    				dirty & /*props*/ 4096 && /*props*/ ctx[12],
    				dirty & /*className, activated, selected, disabled, role*/ 484 && {
    					class: "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n      " + (/*role*/ ctx[6] === "menuitem" && /*selected*/ ctx[7]
    					? "mdc-menu-item--selected"
    					: "") + "\n    "
    				},
    				dirty & /*role*/ 64 && { role: /*role*/ ctx[6] },
    				dirty & /*role, checked*/ 1088 && (/*role*/ ctx[6] === "radio" || /*role*/ ctx[6] === "checkbox"
    				? {
    						"aria-checked": /*checked*/ ctx[10] ? "true" : "false"
    					}
    				: {}),
    				dirty & /*tabindex*/ 1 && { tabindex: /*tabindex*/ ctx[0] }
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);

    			if (Ripple_action && is_function(Ripple_action.update) && dirty & /*ripple, color*/ 24) Ripple_action.update.call(null, {
    				ripple: /*ripple*/ ctx[3],
    				unbounded: false,
    				color: /*color*/ ctx[4]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (default_slot) default_slot.d(detaching);
    			/*li_binding*/ ctx[28](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(40:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:23) 
    function create_if_block_1$4(ctx) {
    	let span;
    	let useActions_action;
    	let forwardEvents_action;
    	let Ripple_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[25].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[24], null);

    	let span_levels = [
    		{
    			class: "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n    "
    		},
    		/*activated*/ ctx[5] ? { "aria-current": "page" } : {},
    		{ tabindex: /*tabindex*/ ctx[0] },
    		/*props*/ ctx[12]
    	];

    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span, span_data);
    			add_location(span, file$w, 21, 2, 547);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			/*span_binding*/ ctx[27](span);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, span, /*use*/ ctx[1])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[13].call(null, span)),
    				action_destroyer(Ripple_action = Ripple.call(null, span, {
    					ripple: /*ripple*/ ctx[3],
    					unbounded: false,
    					color: /*color*/ ctx[4]
    				})),
    				listen_dev(span, "click", /*action*/ ctx[15], false, false, false),
    				listen_dev(span, "keydown", /*handleKeydown*/ ctx[16], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16777216) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[24], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[24], dirty, null));
    				}
    			}

    			set_attributes(span, get_spread_update(span_levels, [
    				dirty & /*className, activated, selected, disabled*/ 420 && {
    					class: "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n    "
    				},
    				dirty & /*activated*/ 32 && (/*activated*/ ctx[5] ? { "aria-current": "page" } : {}),
    				dirty & /*tabindex*/ 1 && { tabindex: /*tabindex*/ ctx[0] },
    				dirty & /*props*/ 4096 && /*props*/ ctx[12]
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);

    			if (Ripple_action && is_function(Ripple_action.update) && dirty & /*ripple, color*/ 24) Ripple_action.update.call(null, {
    				ripple: /*ripple*/ ctx[3],
    				unbounded: false,
    				color: /*color*/ ctx[4]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			/*span_binding*/ ctx[27](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(21:23) ",
    		ctx
    	});

    	return block;
    }

    // (1:0) {#if nav && href}
    function create_if_block$b(ctx) {
    	let a;
    	let useActions_action;
    	let forwardEvents_action;
    	let Ripple_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[25].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[24], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[9] },
    		/*props*/ ctx[12],
    		{
    			class: "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n    "
    		},
    		/*activated*/ ctx[5] ? { "aria-current": "page" } : {},
    		{ tabindex: /*tabindex*/ ctx[0] }
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$w, 1, 2, 20);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			/*a_binding*/ ctx[26](a);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, a, /*use*/ ctx[1])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[13].call(null, a)),
    				action_destroyer(Ripple_action = Ripple.call(null, a, {
    					ripple: /*ripple*/ ctx[3],
    					unbounded: false,
    					color: /*color*/ ctx[4]
    				})),
    				listen_dev(a, "click", /*action*/ ctx[15], false, false, false),
    				listen_dev(a, "keydown", /*handleKeydown*/ ctx[16], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16777216) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[24], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[24], dirty, null));
    				}
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*href*/ 512 && { href: /*href*/ ctx[9] },
    				dirty & /*props*/ 4096 && /*props*/ ctx[12],
    				dirty & /*className, activated, selected, disabled*/ 420 && {
    					class: "\n      mdc-list-item\n      " + /*className*/ ctx[2] + "\n      " + (/*activated*/ ctx[5] ? "mdc-list-item--activated" : "") + "\n      " + (/*selected*/ ctx[7] ? "mdc-list-item--selected" : "") + "\n      " + (/*disabled*/ ctx[8] ? "mdc-list-item--disabled" : "") + "\n    "
    				},
    				dirty & /*activated*/ 32 && (/*activated*/ ctx[5] ? { "aria-current": "page" } : {}),
    				dirty & /*tabindex*/ 1 && { tabindex: /*tabindex*/ ctx[0] }
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);

    			if (Ripple_action && is_function(Ripple_action.update) && dirty & /*ripple, color*/ 24) Ripple_action.update.call(null, {
    				ripple: /*ripple*/ ctx[3],
    				unbounded: false,
    				color: /*color*/ ctx[4]
    			});
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			/*a_binding*/ ctx[26](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(1:0) {#if nav && href}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$z(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$b, create_if_block_1$4, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*nav*/ ctx[14] && /*href*/ ctx[9]) return 0;
    		if (/*nav*/ ctx[14] && !/*href*/ ctx[9]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$z.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let counter$1 = 0;

    function instance$z($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let checked = false;
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { ripple = true } = $$props;
    	let { color = null } = $$props;
    	let { nonInteractive = getContext("SMUI:list:nonInteractive") } = $$props;
    	let { activated = false } = $$props;
    	let { role = getContext("SMUI:list:item:role") } = $$props;
    	let { selected = false } = $$props;
    	let { disabled = false } = $$props;
    	let { tabindex = !nonInteractive && !disabled && (selected || checked) && "0" || "-1" } = $$props;
    	let { href = false } = $$props;
    	let { inputId = "SMUI-form-field-list-" + counter$1++ } = $$props;
    	let element;
    	let addTabindexIfNoItemsSelectedRaf;
    	let nav = getContext("SMUI:list:item:nav");
    	setContext("SMUI:generic:input:props", { id: inputId });
    	setContext("SMUI:generic:input:setChecked", setChecked);

    	onMount(() => {
    		// Tabindex needs to be '0' if this is the first non-disabled list item, and
    		// no other item is selected.
    		if (!selected && !nonInteractive) {
    			let first = true;
    			let el = element;

    			while (el.previousSibling) {
    				el = el.previousSibling;

    				if (el.nodeType === 1 && el.classList.contains("mdc-list-item") && !el.classList.contains("mdc-list-item--disabled")) {
    					first = false;
    					break;
    				}
    			}

    			if (first) {
    				// This is first, so now set up a check that no other items are
    				// selected.
    				addTabindexIfNoItemsSelectedRaf = window.requestAnimationFrame(addTabindexIfNoItemsSelected);
    			}
    		}
    	});

    	onDestroy(() => {
    		if (addTabindexIfNoItemsSelectedRaf) {
    			window.cancelAnimationFrame(addTabindexIfNoItemsSelectedRaf);
    		}
    	});

    	function addTabindexIfNoItemsSelected() {
    		// Look through next siblings to see if none of them are selected.
    		let noneSelected = true;

    		let el = element;

    		while (el.nextSibling) {
    			el = el.nextSibling;

    			if (el.nodeType === 1 && el.classList.contains("mdc-list-item") && el.attributes["tabindex"] && el.attributes["tabindex"].value === "0") {
    				noneSelected = false;
    				break;
    			}
    		}

    		if (noneSelected) {
    			// This is the first element, and no other element is selected, so the
    			// tabindex should be '0'.
    			$$invalidate(0, tabindex = "0");
    		}
    	}

    	function action(e) {
    		if (disabled) {
    			e.preventDefault();
    		} else {
    			dispatch("SMUI:action", e);
    		}
    	}

    	function handleKeydown(e) {
    		const isEnter = e.key === "Enter" || e.keyCode === 13;
    		const isSpace = e.key === "Space" || e.keyCode === 32;

    		if (isEnter || isSpace) {
    			action(e);
    		}
    	}

    	function setChecked(isChecked) {
    		$$invalidate(10, checked = isChecked);
    		$$invalidate(0, tabindex = !nonInteractive && !disabled && (selected || checked) && "0" || "-1");
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Item", $$slots, ['default']);

    	function a_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(11, element = $$value);
    		});
    	}

    	function span_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(11, element = $$value);
    		});
    	}

    	function li_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(11, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(23, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("ripple" in $$new_props) $$invalidate(3, ripple = $$new_props.ripple);
    		if ("color" in $$new_props) $$invalidate(4, color = $$new_props.color);
    		if ("nonInteractive" in $$new_props) $$invalidate(17, nonInteractive = $$new_props.nonInteractive);
    		if ("activated" in $$new_props) $$invalidate(5, activated = $$new_props.activated);
    		if ("role" in $$new_props) $$invalidate(6, role = $$new_props.role);
    		if ("selected" in $$new_props) $$invalidate(7, selected = $$new_props.selected);
    		if ("disabled" in $$new_props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ("tabindex" in $$new_props) $$invalidate(0, tabindex = $$new_props.tabindex);
    		if ("href" in $$new_props) $$invalidate(9, href = $$new_props.href);
    		if ("inputId" in $$new_props) $$invalidate(18, inputId = $$new_props.inputId);
    		if ("$$scope" in $$new_props) $$invalidate(24, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		counter: counter$1,
    		onMount,
    		onDestroy,
    		getContext,
    		setContext,
    		createEventDispatcher,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		Ripple,
    		dispatch,
    		forwardEvents,
    		checked,
    		use,
    		className,
    		ripple,
    		color,
    		nonInteractive,
    		activated,
    		role,
    		selected,
    		disabled,
    		tabindex,
    		href,
    		inputId,
    		element,
    		addTabindexIfNoItemsSelectedRaf,
    		nav,
    		addTabindexIfNoItemsSelected,
    		action,
    		handleKeydown,
    		setChecked,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(23, $$props = assign(assign({}, $$props), $$new_props));
    		if ("checked" in $$props) $$invalidate(10, checked = $$new_props.checked);
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("ripple" in $$props) $$invalidate(3, ripple = $$new_props.ripple);
    		if ("color" in $$props) $$invalidate(4, color = $$new_props.color);
    		if ("nonInteractive" in $$props) $$invalidate(17, nonInteractive = $$new_props.nonInteractive);
    		if ("activated" in $$props) $$invalidate(5, activated = $$new_props.activated);
    		if ("role" in $$props) $$invalidate(6, role = $$new_props.role);
    		if ("selected" in $$props) $$invalidate(7, selected = $$new_props.selected);
    		if ("disabled" in $$props) $$invalidate(8, disabled = $$new_props.disabled);
    		if ("tabindex" in $$props) $$invalidate(0, tabindex = $$new_props.tabindex);
    		if ("href" in $$props) $$invalidate(9, href = $$new_props.href);
    		if ("inputId" in $$props) $$invalidate(18, inputId = $$new_props.inputId);
    		if ("element" in $$props) $$invalidate(11, element = $$new_props.element);
    		if ("addTabindexIfNoItemsSelectedRaf" in $$props) addTabindexIfNoItemsSelectedRaf = $$new_props.addTabindexIfNoItemsSelectedRaf;
    		if ("nav" in $$props) $$invalidate(14, nav = $$new_props.nav);
    		if ("props" in $$props) $$invalidate(12, props = $$new_props.props);
    	};

    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(12, props = exclude($$props, [
    			"use",
    			"class",
    			"ripple",
    			"color",
    			"nonInteractive",
    			"activated",
    			"selected",
    			"disabled",
    			"tabindex",
    			"href",
    			"inputId"
    		]));
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		tabindex,
    		use,
    		className,
    		ripple,
    		color,
    		activated,
    		role,
    		selected,
    		disabled,
    		href,
    		checked,
    		element,
    		props,
    		forwardEvents,
    		nav,
    		action,
    		handleKeydown,
    		nonInteractive,
    		inputId,
    		addTabindexIfNoItemsSelectedRaf,
    		dispatch,
    		addTabindexIfNoItemsSelected,
    		setChecked,
    		$$props,
    		$$scope,
    		$$slots,
    		a_binding,
    		span_binding,
    		li_binding
    	];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$z, create_fragment$z, safe_not_equal, {
    			use: 1,
    			class: 2,
    			ripple: 3,
    			color: 4,
    			nonInteractive: 17,
    			activated: 5,
    			role: 6,
    			selected: 7,
    			disabled: 8,
    			tabindex: 0,
    			href: 9,
    			inputId: 18
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$z.name
    		});
    	}

    	get use() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nonInteractive() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nonInteractive(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activated() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activated(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get role() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set role(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputId() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputId(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    classAdderBuilder({
      class: 'mdc-list-item__text',
      component: Span,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-list-item__primary-text',
      component: Span,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-list-item__secondary-text',
      component: Span,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-list-item__meta',
      component: Span,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-list-group',
      component: Div,
      contexts: {}
    });

    /* node_modules\@smui\common\H3.svelte generated by Svelte v3.20.1 */
    const file$x = "node_modules\\@smui\\common\\H3.svelte";

    function create_fragment$A(ctx) {
    	let h3;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let h3_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let h3_data = {};

    	for (let i = 0; i < h3_levels.length; i += 1) {
    		h3_data = assign(h3_data, h3_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			if (default_slot) default_slot.c();
    			set_attributes(h3, h3_data);
    			add_location(h3, file$x, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, h3, anchor);

    			if (default_slot) {
    				default_slot.m(h3, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, h3, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, h3))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    				}
    			}

    			set_attributes(h3, get_spread_update(h3_levels, [dirty & /*exclude, $$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$A.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$A($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("H3", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, $$slots];
    }

    class H3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$A, create_fragment$A, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "H3",
    			options,
    			id: create_fragment$A.name
    		});
    	}

    	get use() {
    		throw new Error("<H3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<H3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    classAdderBuilder({
      class: 'mdc-list-group__subheader',
      component: H3,
      contexts: {}
    });

    /* src\components\HeaderTopBar.svelte generated by Svelte v3.20.1 */
    const file$y = "src\\components\\HeaderTopBar.svelte";

    // (36:6) <IconButton class="material-icons" on:click={() => menu2.setOpen(true)}>
    function create_default_slot_15(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("menu");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(36:6) <IconButton class=\\\"material-icons\\\" on:click={() => menu2.setOpen(true)}>",
    		ctx
    	});

    	return block;
    }

    // (35:4) <Section>
    function create_default_slot_14(ctx) {
    	let t0;
    	let span;
    	let current;

    	const iconbutton = new IconButton({
    			props: {
    				class: "material-icons",
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	iconbutton.$on("click", /*click_handler*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(iconbutton.$$.fragment);
    			t0 = space();
    			span = element("span");
    			span.textContent = "Lurinfacts beta";
    			attr_dev(span, "class", "pageTitle svelte-1aa9mk1");
    			add_location(span, file$y, 38, 6, 1203);
    		},
    		m: function mount(target, anchor) {
    			mount_component(iconbutton, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const iconbutton_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				iconbutton_changes.$$scope = { dirty, ctx };
    			}

    			iconbutton.$set(iconbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(iconbutton, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(35:4) <Section>",
    		ctx
    	});

    	return block;
    }

    // (34:2) <Row>
    function create_default_slot_13(ctx) {
    	let t;
    	let a;
    	let img;
    	let img_src_value;
    	let current;

    	const section = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(section.$$.fragment);
    			t = space();
    			a = element("a");
    			img = element("img");
    			if (img.src !== (img_src_value = "./../assets/twitter_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Twitter Logo");
    			add_location(img, file$y, 45, 6, 1422);
    			attr_dev(a, "class", "twitterLink svelte-1aa9mk1");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", "https://www.twitter.com/@lurin_tha_one");
    			attr_dev(a, "alt", "follow Lurin on twitter");
    			add_location(a, file$y, 40, 4, 1271);
    		},
    		m: function mount(target, anchor) {
    			mount_component(section, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const section_changes = {};

    			if (dirty & /*$$scope, menu2*/ 2097156) {
    				section_changes.$$scope = { dirty, ctx };
    			}

    			section.$set(section_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(section.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(section.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(section, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(34:2) <Row>",
    		ctx
    	});

    	return block;
    }

    // (33:0) <TopAppBar {dense} {prominent} {variant} color="primary" bind:collapsed>
    function create_default_slot_12(ctx) {
    	let current;

    	const row = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};

    			if (dirty & /*$$scope, menu2*/ 2097156) {
    				row_changes.$$scope = { dirty, ctx };
    			}

    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(33:0) <TopAppBar {dense} {prominent} {variant} color=\\\"primary\\\" bind:collapsed>",
    		ctx
    	});

    	return block;
    }

    // (57:6) <Item on:SMUI:action={() => page('/')}>
    function create_default_slot_11(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Home");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(57:6) <Item on:SMUI:action={() => page('/')}>",
    		ctx
    	});

    	return block;
    }

    // (58:6) <Item on:SMUI:action={() => page('/facts')}>
    function create_default_slot_10(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Facts");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(58:6) <Item on:SMUI:action={() => page('/facts')}>",
    		ctx
    	});

    	return block;
    }

    // (59:6) <Item on:SMUI:action={() => page('/images')}>
    function create_default_slot_9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Images");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(59:6) <Item on:SMUI:action={() => page('/images')}>",
    		ctx
    	});

    	return block;
    }

    // (60:6) <Item on:SMUI:action={() => page('/map')}>
    function create_default_slot_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Map");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(60:6) <Item on:SMUI:action={() => page('/map')}>",
    		ctx
    	});

    	return block;
    }

    // (61:6) <Item on:SMUI:action={() => page('/settings')}>
    function create_default_slot_7$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Settings");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7$2.name,
    		type: "slot",
    		source: "(61:6) <Item on:SMUI:action={() => page('/settings')}>",
    		ctx
    	});

    	return block;
    }

    // (62:6) <Item on:SMUI:action={() => page('/login')}>
    function create_default_slot_6$2(ctx) {
    	let t_value = (/*loggedIn*/ ctx[0] ? "Logout" : "Login") + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*loggedIn*/ 1 && t_value !== (t_value = (/*loggedIn*/ ctx[0] ? "Logout" : "Login") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$2.name,
    		type: "slot",
    		source: "(62:6) <Item on:SMUI:action={() => page('/login')}>",
    		ctx
    	});

    	return block;
    }

    // (65:6) {#if loggedIn}
    function create_if_block$c(ctx) {
    	let t;
    	let current;

    	const item0 = new Item({
    			props: {
    				$$slots: { default: [create_default_slot_4$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	item0.$on("SMUI:action", /*SMUI_action_handler_6*/ ctx[16]);

    	const item1 = new Item({
    			props: {
    				$$slots: { default: [create_default_slot_2$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	item1.$on("SMUI:action", /*SMUI_action_handler_7*/ ctx[17]);

    	const block = {
    		c: function create() {
    			create_component(item0.$$.fragment);
    			t = space();
    			create_component(item1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(item0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(item1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const item0_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				item0_changes.$$scope = { dirty, ctx };
    			}

    			item0.$set(item0_changes);
    			const item1_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				item1_changes.$$scope = { dirty, ctx };
    			}

    			item1.$set(item1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item0.$$.fragment, local);
    			transition_in(item1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item0.$$.fragment, local);
    			transition_out(item1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(item0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(item1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(65:6) {#if loggedIn}",
    		ctx
    	});

    	return block;
    }

    // (67:10) <Icon              class="material-icons"              style="font-size:18px; margin-top: -5px;">
    function create_default_slot_5$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("lock");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$4.name,
    		type: "slot",
    		source: "(67:10) <Icon              class=\\\"material-icons\\\"              style=\\\"font-size:18px; margin-top: -5px;\\\">",
    		ctx
    	});

    	return block;
    }

    // (66:8) <Item on:SMUI:action={() => page('/contributions')}>
    function create_default_slot_4$6(ctx) {
    	let t;
    	let current;

    	const icon = new Icon({
    			props: {
    				class: "material-icons",
    				style: "font-size:18px; margin-top: -5px;",
    				$$slots: { default: [create_default_slot_5$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    			t = text("\r\n          Contributions");
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$6.name,
    		type: "slot",
    		source: "(66:8) <Item on:SMUI:action={() => page('/contributions')}>",
    		ctx
    	});

    	return block;
    }

    // (75:10) <Icon              class="material-icons"              style="font-size:18px; margin-top: -5px;">
    function create_default_slot_3$8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("lock");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$8.name,
    		type: "slot",
    		source: "(75:10) <Icon              class=\\\"material-icons\\\"              style=\\\"font-size:18px; margin-top: -5px;\\\">",
    		ctx
    	});

    	return block;
    }

    // (74:8) <Item on:SMUI:action={() => page('/addImage')}>
    function create_default_slot_2$8(ctx) {
    	let t;
    	let current;

    	const icon = new Icon({
    			props: {
    				class: "material-icons",
    				style: "font-size:18px; margin-top: -5px;",
    				$$slots: { default: [create_default_slot_3$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    			t = text("\r\n          Add image");
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$8.name,
    		type: "slot",
    		source: "(74:8) <Item on:SMUI:action={() => page('/addImage')}>",
    		ctx
    	});

    	return block;
    }

    // (56:4) <List>
    function create_default_slot_1$a(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let if_block_anchor;
    	let current;

    	const item0 = new Item({
    			props: {
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	item0.$on("SMUI:action", /*SMUI_action_handler*/ ctx[10]);

    	const item1 = new Item({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	item1.$on("SMUI:action", /*SMUI_action_handler_1*/ ctx[11]);

    	const item2 = new Item({
    			props: {
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	item2.$on("SMUI:action", /*SMUI_action_handler_2*/ ctx[12]);

    	const item3 = new Item({
    			props: {
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	item3.$on("SMUI:action", /*SMUI_action_handler_3*/ ctx[13]);

    	const item4 = new Item({
    			props: {
    				$$slots: { default: [create_default_slot_7$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	item4.$on("SMUI:action", /*SMUI_action_handler_4*/ ctx[14]);

    	const item5 = new Item({
    			props: {
    				$$slots: { default: [create_default_slot_6$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	item5.$on("SMUI:action", /*SMUI_action_handler_5*/ ctx[15]);
    	let if_block = /*loggedIn*/ ctx[0] && create_if_block$c(ctx);

    	const block = {
    		c: function create() {
    			create_component(item0.$$.fragment);
    			t0 = space();
    			create_component(item1.$$.fragment);
    			t1 = space();
    			create_component(item2.$$.fragment);
    			t2 = space();
    			create_component(item3.$$.fragment);
    			t3 = space();
    			create_component(item4.$$.fragment);
    			t4 = space();
    			create_component(item5.$$.fragment);
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(item0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(item1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(item2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(item3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(item4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(item5, target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const item0_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				item0_changes.$$scope = { dirty, ctx };
    			}

    			item0.$set(item0_changes);
    			const item1_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				item1_changes.$$scope = { dirty, ctx };
    			}

    			item1.$set(item1_changes);
    			const item2_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				item2_changes.$$scope = { dirty, ctx };
    			}

    			item2.$set(item2_changes);
    			const item3_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				item3_changes.$$scope = { dirty, ctx };
    			}

    			item3.$set(item3_changes);
    			const item4_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				item4_changes.$$scope = { dirty, ctx };
    			}

    			item4.$set(item4_changes);
    			const item5_changes = {};

    			if (dirty & /*$$scope, loggedIn*/ 2097153) {
    				item5_changes.$$scope = { dirty, ctx };
    			}

    			item5.$set(item5_changes);

    			if (/*loggedIn*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$c(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item0.$$.fragment, local);
    			transition_in(item1.$$.fragment, local);
    			transition_in(item2.$$.fragment, local);
    			transition_in(item3.$$.fragment, local);
    			transition_in(item4.$$.fragment, local);
    			transition_in(item5.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item0.$$.fragment, local);
    			transition_out(item1.$$.fragment, local);
    			transition_out(item2.$$.fragment, local);
    			transition_out(item3.$$.fragment, local);
    			transition_out(item4.$$.fragment, local);
    			transition_out(item5.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(item0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(item1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(item2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(item3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(item4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(item5, detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$a.name,
    		type: "slot",
    		source: "(56:4) <List>",
    		ctx
    	});

    	return block;
    }

    // (51:2) <Menu      bind:this={menu2}      anchor={false}      bind:anchorElement={anchor2}      anchorCorner="BOTTOM_LEFT">
    function create_default_slot$d(ctx) {
    	let current;

    	const list = new List({
    			props: {
    				$$slots: { default: [create_default_slot_1$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(list.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(list, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const list_changes = {};

    			if (dirty & /*$$scope, loggedIn*/ 2097153) {
    				list_changes.$$scope = { dirty, ctx };
    			}

    			list.$set(list_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(list, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$d.name,
    		type: "slot",
    		source: "(51:2) <Menu      bind:this={menu2}      anchor={false}      bind:anchorElement={anchor2}      anchorCorner=\\\"BOTTOM_LEFT\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$B(ctx) {
    	let updating_collapsed;
    	let t;
    	let div;
    	let updating_anchorElement;
    	let Anchor_action;
    	let current;
    	let dispose;

    	function topappbar_collapsed_binding(value) {
    		/*topappbar_collapsed_binding*/ ctx[9].call(null, value);
    	}

    	let topappbar_props = {
    		dense: /*dense*/ ctx[4],
    		prominent: /*prominent*/ ctx[5],
    		variant: /*variant*/ ctx[6],
    		color: "primary",
    		$$slots: { default: [create_default_slot_12] },
    		$$scope: { ctx }
    	};

    	if (/*collapsed*/ ctx[1] !== void 0) {
    		topappbar_props.collapsed = /*collapsed*/ ctx[1];
    	}

    	const topappbar = new TopAppBar({ props: topappbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(topappbar, "collapsed", topappbar_collapsed_binding));

    	function menu_anchorElement_binding(value) {
    		/*menu_anchorElement_binding*/ ctx[19].call(null, value);
    	}

    	let menu_props = {
    		anchor: false,
    		anchorCorner: "BOTTOM_LEFT",
    		$$slots: { default: [create_default_slot$d] },
    		$$scope: { ctx }
    	};

    	if (/*anchor2*/ ctx[3] !== void 0) {
    		menu_props.anchorElement = /*anchor2*/ ctx[3];
    	}

    	const menu = new Menu({ props: menu_props, $$inline: true });
    	/*menu_binding*/ ctx[18](menu);
    	binding_callbacks.push(() => bind(menu, "anchorElement", menu_anchorElement_binding));

    	const block = {
    		c: function create() {
    			create_component(topappbar.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(menu.$$.fragment);
    			add_location(div, file$y, 49, 0, 1519);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			mount_component(topappbar, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(menu, div, null);
    			/*div_binding*/ ctx[20](div);
    			current = true;
    			if (remount) dispose();
    			dispose = action_destroyer(Anchor_action = Anchor.call(null, div));
    		},
    		p: function update(ctx, [dirty]) {
    			const topappbar_changes = {};

    			if (dirty & /*$$scope, menu2*/ 2097156) {
    				topappbar_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_collapsed && dirty & /*collapsed*/ 2) {
    				updating_collapsed = true;
    				topappbar_changes.collapsed = /*collapsed*/ ctx[1];
    				add_flush_callback(() => updating_collapsed = false);
    			}

    			topappbar.$set(topappbar_changes);
    			const menu_changes = {};

    			if (dirty & /*$$scope, loggedIn*/ 2097153) {
    				menu_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_anchorElement && dirty & /*anchor2*/ 8) {
    				updating_anchorElement = true;
    				menu_changes.anchorElement = /*anchor2*/ ctx[3];
    				add_flush_callback(() => updating_anchorElement = false);
    			}

    			menu.$set(menu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(topappbar.$$.fragment, local);
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(topappbar.$$.fragment, local);
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(topappbar, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			/*menu_binding*/ ctx[18](null);
    			destroy_component(menu);
    			/*div_binding*/ ctx[20](null);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$B.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$B($$self, $$props, $$invalidate) {
    	let loggedIn = false;

    	const unsubscribe = userStore.subscribe(user => {
    		$$invalidate(0, loggedIn = user.loggedIn);
    	});

    	let dense = true;
    	let prominent = false;
    	let variant = "standard";
    	let collapsed = false;
    	let menu2;
    	let anchor2;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HeaderTopBar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("HeaderTopBar", $$slots, []);
    	const click_handler = () => menu2.setOpen(true);

    	function topappbar_collapsed_binding(value) {
    		collapsed = value;
    		$$invalidate(1, collapsed);
    	}

    	const SMUI_action_handler = () => page_js("/");
    	const SMUI_action_handler_1 = () => page_js("/facts");
    	const SMUI_action_handler_2 = () => page_js("/images");
    	const SMUI_action_handler_3 = () => page_js("/map");
    	const SMUI_action_handler_4 = () => page_js("/settings");
    	const SMUI_action_handler_5 = () => page_js("/login");
    	const SMUI_action_handler_6 = () => page_js("/contributions");
    	const SMUI_action_handler_7 = () => page_js("/addImage");

    	function menu_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, menu2 = $$value);
    		});
    	}

    	function menu_anchorElement_binding(value) {
    		anchor2 = value;
    		$$invalidate(3, anchor2);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, anchor2 = $$value);
    		});
    	}

    	$$self.$capture_state = () => ({
    		TopAppBar,
    		Row,
    		Section,
    		Title: Title$1,
    		IconButton,
    		Icon,
    		Button: Button_1,
    		Label,
    		Menu,
    		SelectionGroup,
    		SelectionGroupIcon,
    		Anchor,
    		List,
    		Item,
    		page: page_js,
    		login,
    		logout,
    		userStore,
    		loggedIn,
    		unsubscribe,
    		dense,
    		prominent,
    		variant,
    		collapsed,
    		menu2,
    		anchor2
    	});

    	$$self.$inject_state = $$props => {
    		if ("loggedIn" in $$props) $$invalidate(0, loggedIn = $$props.loggedIn);
    		if ("dense" in $$props) $$invalidate(4, dense = $$props.dense);
    		if ("prominent" in $$props) $$invalidate(5, prominent = $$props.prominent);
    		if ("variant" in $$props) $$invalidate(6, variant = $$props.variant);
    		if ("collapsed" in $$props) $$invalidate(1, collapsed = $$props.collapsed);
    		if ("menu2" in $$props) $$invalidate(2, menu2 = $$props.menu2);
    		if ("anchor2" in $$props) $$invalidate(3, anchor2 = $$props.anchor2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		loggedIn,
    		collapsed,
    		menu2,
    		anchor2,
    		dense,
    		prominent,
    		variant,
    		unsubscribe,
    		click_handler,
    		topappbar_collapsed_binding,
    		SMUI_action_handler,
    		SMUI_action_handler_1,
    		SMUI_action_handler_2,
    		SMUI_action_handler_3,
    		SMUI_action_handler_4,
    		SMUI_action_handler_5,
    		SMUI_action_handler_6,
    		SMUI_action_handler_7,
    		menu_binding,
    		menu_anchorElement_binding,
    		div_binding
    	];
    }

    class HeaderTopBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$B, create_fragment$B, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HeaderTopBar",
    			options,
    			id: create_fragment$B.name
    		});
    	}
    }

    /* src\components\ShareApiTest.svelte generated by Svelte v3.20.1 */

    const file$z = "src\\components\\ShareApiTest.svelte";

    function create_fragment$C(ctx) {
    	let div;
    	let br0;
    	let t0;
    	let br1;
    	let t1;
    	let h2;
    	let t3;
    	let form;
    	let label;
    	let t4;
    	let input;
    	let t5;
    	let br2;
    	let t6;
    	let button;

    	const block = {
    		c: function create() {
    			div = element("div");
    			br0 = element("br");
    			t0 = space();
    			br1 = element("br");
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "simulate web share api call";
    			t3 = space();
    			form = element("form");
    			label = element("label");
    			t4 = text("choose image\n      ");
    			input = element("input");
    			t5 = space();
    			br2 = element("br");
    			t6 = space();
    			button = element("button");
    			button.textContent = "send";
    			add_location(br0, file$z, 8, 2, 109);
    			add_location(br1, file$z, 9, 2, 118);
    			add_location(h2, file$z, 10, 2, 127);
    			attr_dev(input, "name", "media");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "size", "50");
    			attr_dev(input, "accept", "image/*");
    			add_location(input, file$z, 14, 6, 278);
    			add_location(label, file$z, 12, 4, 245);
    			add_location(br2, file$z, 16, 4, 357);
    			add_location(button, file$z, 17, 4, 368);
    			attr_dev(form, "method", "post");
    			attr_dev(form, "action", "/_share-target");
    			attr_dev(form, "enctype", "multipart/form-data");
    			add_location(form, file$z, 11, 2, 166);
    			add_location(div, file$z, 7, 0, 101);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, br0);
    			append_dev(div, t0);
    			append_dev(div, br1);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(div, t3);
    			append_dev(div, form);
    			append_dev(form, label);
    			append_dev(label, t4);
    			append_dev(label, input);
    			append_dev(form, t5);
    			append_dev(form, br2);
    			append_dev(form, t6);
    			append_dev(form, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$C.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$C($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ShareApiTest> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ShareApiTest", $$slots, []);
    	return [];
    }

    class ShareApiTest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$C, create_fragment$C, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShareApiTest",
    			options,
    			id: create_fragment$C.name
    		});
    	}
    }

    /* src\components\Contribution.svelte generated by Svelte v3.20.1 */

    const { console: console_1$7 } = globals;
    const file$A = "src\\components\\Contribution.svelte";

    // (64:6) <Label>
    function create_default_slot_1$b(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Send");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$b.name,
    		type: "slot",
    		source: "(64:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (60:4) <Button        disabled={!$contributeForm.valid || factObj.fact.length == 0}        variant="raised"        class="formButton">
    function create_default_slot$e(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_1$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$e.name,
    		type: "slot",
    		source: "(60:4) <Button        disabled={!$contributeForm.valid || factObj.fact.length == 0}        variant=\\\"raised\\\"        class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$D(ctx) {
    	let div2;
    	let h1;
    	let t1;
    	let form_1;
    	let div0;
    	let label0;
    	let t3;
    	let input;
    	let t4;
    	let br;
    	let t5;
    	let div1;
    	let label1;
    	let t7;
    	let textarea;
    	let t8;
    	let t9_value = /*factObj*/ ctx[0].fact.length + "";
    	let t9;
    	let t10;
    	let t11;
    	let current;
    	let dispose;

    	const button = new Button_1({
    			props: {
    				disabled: !/*$contributeForm*/ ctx[1].valid || /*factObj*/ ctx[0].fact.length == 0,
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$e] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Contribute";
    			t1 = space();
    			form_1 = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Contributor";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			br = element("br");
    			t5 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Fact";
    			t7 = space();
    			textarea = element("textarea");
    			t8 = space();
    			t9 = text(t9_value);
    			t10 = text(" / 150");
    			t11 = space();
    			create_component(button.$$.fragment);
    			add_location(h1, file$A, 45, 2, 1329);
    			attr_dev(label0, "for", "contributor");
    			add_location(label0, file$A, 49, 6, 1426);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "contributor");
    			add_location(input, file$A, 50, 6, 1478);
    			add_location(div0, file$A, 48, 4, 1413);
    			add_location(br, file$A, 52, 4, 1569);
    			attr_dev(label1, "for", "fact");
    			add_location(label1, file$A, 54, 6, 1594);
    			attr_dev(textarea, "name", "fact");
    			attr_dev(textarea, "cols", "40");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$A, 55, 6, 1632);
    			add_location(div1, file$A, 53, 4, 1581);
    			attr_dev(form_1, "class", "lurinForm");
    			add_location(form_1, file$A, 46, 2, 1352);
    			attr_dev(div2, "class", "contentpadding");
    			add_location(div2, file$A, 44, 0, 1297);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h1);
    			append_dev(div2, t1);
    			append_dev(div2, form_1);
    			append_dev(form_1, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			set_input_value(input, /*factObj*/ ctx[0].contributor);
    			append_dev(form_1, t4);
    			append_dev(form_1, br);
    			append_dev(form_1, t5);
    			append_dev(form_1, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t7);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*factObj*/ ctx[0].fact);
    			append_dev(div1, t8);
    			append_dev(div1, t9);
    			append_dev(div1, t10);
    			append_dev(form_1, t11);
    			mount_component(button, form_1, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[5]),
    				listen_dev(form_1, "submit", /*sendContribution*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*factObj*/ 1 && input.value !== /*factObj*/ ctx[0].contributor) {
    				set_input_value(input, /*factObj*/ ctx[0].contributor);
    			}

    			if (dirty & /*factObj*/ 1) {
    				set_input_value(textarea, /*factObj*/ ctx[0].fact);
    			}

    			if ((!current || dirty & /*factObj*/ 1) && t9_value !== (t9_value = /*factObj*/ ctx[0].fact.length + "")) set_data_dev(t9, t9_value);
    			const button_changes = {};
    			if (dirty & /*$contributeForm, factObj*/ 3) button_changes.disabled = !/*$contributeForm*/ ctx[1].valid || /*factObj*/ ctx[0].fact.length == 0;

    			if (dirty & /*$$scope*/ 64) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$D.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$D($$self, $$props, $$invalidate) {
    	let $contributeForm;
    	let factObj = { fact: "", contributor: "" };

    	const contributeForm = form(() => ({
    		fact: {
    			value: factObj.fact,
    			validators: ["required", "min:5", "max:150"]
    		},
    		contributor: {
    			value: factObj.contributor,
    			validators: ["required", "min:5", "max:80"]
    		}
    	}));

    	validate_store(contributeForm, "contributeForm");
    	component_subscribe($$self, contributeForm, value => $$invalidate(1, $contributeForm = value));

    	function sendContribution(e) {
    		e.preventDefault();
    		$$invalidate(0, factObj.insertTime = new Date().getTime(), factObj);

    		if (!navigator.onLine) {
    			notify("Your internet connection is lost and lurin couldn't fix it. try later.");
    			return false;
    		}

    		return addFactProposal(factObj).then(
    			function () {
    				$$invalidate(0, factObj.fact = "", factObj);
    				$$invalidate(0, factObj.contributor = "", factObj);
    				notify("fact added, lurin will decide if it's worth it");
    			},
    			function (e) {
    				console.log("error on save:", e);
    				notify("lurin doesn't like this fact, error during save.");
    			}
    		);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$7.warn(`<Contribution> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Contribution", $$slots, []);

    	function input_input_handler() {
    		factObj.contributor = this.value;
    		$$invalidate(0, factObj);
    	}

    	function textarea_input_handler() {
    		factObj.fact = this.value;
    		$$invalidate(0, factObj);
    	}

    	$$self.$capture_state = () => ({
    		addFactProposal,
    		notify,
    		form,
    		Button: Button_1,
    		Label,
    		factObj,
    		contributeForm,
    		sendContribution,
    		$contributeForm
    	});

    	$$self.$inject_state = $$props => {
    		if ("factObj" in $$props) $$invalidate(0, factObj = $$props.factObj);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		factObj,
    		$contributeForm,
    		contributeForm,
    		sendContribution,
    		input_input_handler,
    		textarea_input_handler
    	];
    }

    class Contribution extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$D, create_fragment$D, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contribution",
    			options,
    			id: create_fragment$D.name
    		});
    	}
    }

    /* src\components\ManageContribution.svelte generated by Svelte v3.20.1 */
    const file$B = "src\\components\\ManageContribution.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (46:4) {#each factProposals as fact}
    function create_each_block$4(ctx) {
    	let li;
    	let t;
    	let current;

    	const fact = new Fact({
    			props: {
    				fact: /*fact*/ ctx[2],
    				hasDeleteButton: /*loggedIn*/ ctx[0],
    				hasAcceptButton: /*loggedIn*/ ctx[0],
    				class: "list-content"
    			},
    			$$inline: true
    		});

    	fact.$on("delete", onDeleteFactProposal);
    	fact.$on("accept", onAcceptFactProposal);

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(fact.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "list-item svelte-lraaez");
    			add_location(li, file$B, 46, 6, 1595);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(fact, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fact_changes = {};
    			if (dirty & /*loggedIn*/ 1) fact_changes.hasDeleteButton = /*loggedIn*/ ctx[0];
    			if (dirty & /*loggedIn*/ 1) fact_changes.hasAcceptButton = /*loggedIn*/ ctx[0];
    			fact.$set(fact_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(fact);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(46:4) {#each factProposals as fact}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$E(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let ul;
    	let current;
    	let each_value = /*factProposals*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Manage fact purposals";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$B, 43, 2, 1501);
    			attr_dev(ul, "class", "list svelte-lraaez");
    			add_location(ul, file$B, 44, 2, 1535);
    			attr_dev(div, "class", "contentpadding");
    			add_location(div, file$B, 42, 0, 1469);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*factProposals, loggedIn, onDeleteFactProposal, onAcceptFactProposal*/ 3) {
    				each_value = /*factProposals*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$E.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function onDeleteFactProposal(event) {
    	deleteFactProposal(event.detail.fact).then(success => {
    		if (success) {
    			notify("fact was deleted");
    		} else {
    			notify("something went wrong while deleting the fact");
    		}
    	});
    }

    function onAcceptFactProposal(event) {
    	acceptFactProposal(event.detail.fact).then(success => {
    		if (success) {
    			notify("fact was accepted");
    		} else {
    			notify("something went wrong while accepting the fact");
    		}
    	});
    }

    function instance$E($$self, $$props, $$invalidate) {
    	let factProposals = getFactsProposals();
    	let loggedIn = false;

    	userStore.subscribe(user => {
    		$$invalidate(0, loggedIn = user.loggedIn);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ManageContribution> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ManageContribution", $$slots, []);

    	$$self.$capture_state = () => ({
    		getFactsProposals,
    		deleteFactProposal,
    		acceptFactProposal,
    		Fact,
    		Button: Button_1,
    		Label,
    		notify,
    		userStore,
    		factProposals,
    		loggedIn,
    		onDeleteFactProposal,
    		onAcceptFactProposal
    	});

    	$$self.$inject_state = $$props => {
    		if ("factProposals" in $$props) $$invalidate(1, factProposals = $$props.factProposals);
    		if ("loggedIn" in $$props) $$invalidate(0, loggedIn = $$props.loggedIn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loggedIn, factProposals];
    }

    class ManageContribution extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$E, create_fragment$E, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ManageContribution",
    			options,
    			id: create_fragment$E.name
    		});
    	}
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$a = {
        CLOSING: 'mdc-snackbar--closing',
        OPEN: 'mdc-snackbar--open',
        OPENING: 'mdc-snackbar--opening',
    };
    var strings$c = {
        ACTION_SELECTOR: '.mdc-snackbar__action',
        ARIA_LIVE_LABEL_TEXT_ATTR: 'data-mdc-snackbar-label-text',
        CLOSED_EVENT: 'MDCSnackbar:closed',
        CLOSING_EVENT: 'MDCSnackbar:closing',
        DISMISS_SELECTOR: '.mdc-snackbar__dismiss',
        LABEL_SELECTOR: '.mdc-snackbar__label',
        OPENED_EVENT: 'MDCSnackbar:opened',
        OPENING_EVENT: 'MDCSnackbar:opening',
        REASON_ACTION: 'action',
        REASON_DISMISS: 'dismiss',
        SURFACE_SELECTOR: '.mdc-snackbar__surface',
    };
    var numbers$6 = {
        DEFAULT_AUTO_DISMISS_TIMEOUT_MS: 5000,
        MAX_AUTO_DISMISS_TIMEOUT_MS: 10000,
        MIN_AUTO_DISMISS_TIMEOUT_MS: 4000,
        // These variables need to be kept in sync with the values in _variables.scss.
        SNACKBAR_ANIMATION_CLOSE_TIME_MS: 75,
        SNACKBAR_ANIMATION_OPEN_TIME_MS: 150,
        /**
         * Number of milliseconds to wait between temporarily clearing the label text
         * in the DOM and subsequently restoring it. This is necessary to force IE 11
         * to pick up the `aria-live` content change and announce it to the user.
         */
        ARIA_LIVE_DELAY_MS: 1000,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var ARIA_LIVE_DELAY_MS = numbers$6.ARIA_LIVE_DELAY_MS;
    var ARIA_LIVE_LABEL_TEXT_ATTR = strings$c.ARIA_LIVE_LABEL_TEXT_ATTR;
    function announce(ariaEl, labelEl) {
        if (labelEl === void 0) { labelEl = ariaEl; }
        var priority = ariaEl.getAttribute('aria-live');
        // Trim text to ignore `&nbsp;` (see below).
        // textContent is only null if the node is a document, DOCTYPE, or notation.
        var labelText = labelEl.textContent.trim();
        if (!labelText || !priority) {
            return;
        }
        // Temporarily disable `aria-live` to prevent JAWS+Firefox from announcing the message twice.
        ariaEl.setAttribute('aria-live', 'off');
        // Temporarily clear `textContent` to force a DOM mutation event that will be detected by screen readers.
        // `aria-live` elements are only announced when the element's `textContent` *changes*, so snackbars
        // sent to the browser in the initial HTML response won't be read unless we clear the element's `textContent` first.
        // Similarly, displaying the same snackbar message twice in a row doesn't trigger a DOM mutation event,
        // so screen readers won't announce the second message unless we first clear `textContent`.
        //
        // We have to clear the label text two different ways to make it work in all browsers and screen readers:
        //
        //   1. `textContent = ''` is required for IE11 + JAWS
        //   2. `innerHTML = '&nbsp;'` is required for Chrome + JAWS and NVDA
        //
        // All other browser/screen reader combinations support both methods.
        //
        // The wrapper `<span>` visually hides the space character so that it doesn't cause jank when added/removed.
        // N.B.: Setting `position: absolute`, `opacity: 0`, or `height: 0` prevents Chrome from detecting the DOM change.
        //
        // This technique has been tested in:
        //
        //   * JAWS 2019:
        //       - Chrome 70
        //       - Firefox 60 (ESR)
        //       - IE 11
        //   * NVDA 2018:
        //       - Chrome 70
        //       - Firefox 60 (ESR)
        //       - IE 11
        //   * ChromeVox 53
        labelEl.textContent = '';
        labelEl.innerHTML = '<span style="display: inline-block; width: 0; height: 1px;">&nbsp;</span>';
        // Prevent visual jank by temporarily displaying the label text in the ::before pseudo-element.
        // CSS generated content is normally announced by screen readers
        // (except in IE 11; see https://tink.uk/accessibility-support-for-css-generated-content/);
        // however, `aria-live` is turned off, so this DOM update will be ignored by screen readers.
        labelEl.setAttribute(ARIA_LIVE_LABEL_TEXT_ATTR, labelText);
        setTimeout(function () {
            // Allow screen readers to announce changes to the DOM again.
            ariaEl.setAttribute('aria-live', priority);
            // Remove the message from the ::before pseudo-element.
            labelEl.removeAttribute(ARIA_LIVE_LABEL_TEXT_ATTR);
            // Restore the original label text, which will be announced by screen readers.
            labelEl.textContent = labelText;
        }, ARIA_LIVE_DELAY_MS);
    }
    //# sourceMappingURL=util.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var OPENING = cssClasses$a.OPENING, OPEN = cssClasses$a.OPEN, CLOSING = cssClasses$a.CLOSING;
    var REASON_ACTION = strings$c.REASON_ACTION, REASON_DISMISS = strings$c.REASON_DISMISS;
    var MDCSnackbarFoundation = /** @class */ (function (_super) {
        __extends(MDCSnackbarFoundation, _super);
        function MDCSnackbarFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCSnackbarFoundation.defaultAdapter, adapter)) || this;
            _this.isOpen_ = false;
            _this.animationFrame_ = 0;
            _this.animationTimer_ = 0;
            _this.autoDismissTimer_ = 0;
            _this.autoDismissTimeoutMs_ = numbers$6.DEFAULT_AUTO_DISMISS_TIMEOUT_MS;
            _this.closeOnEscape_ = true;
            return _this;
        }
        Object.defineProperty(MDCSnackbarFoundation, "cssClasses", {
            get: function () {
                return cssClasses$a;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbarFoundation, "strings", {
            get: function () {
                return strings$c;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbarFoundation, "numbers", {
            get: function () {
                return numbers$6;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbarFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    announce: function () { return undefined; },
                    notifyClosed: function () { return undefined; },
                    notifyClosing: function () { return undefined; },
                    notifyOpened: function () { return undefined; },
                    notifyOpening: function () { return undefined; },
                    removeClass: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCSnackbarFoundation.prototype.destroy = function () {
            this.clearAutoDismissTimer_();
            cancelAnimationFrame(this.animationFrame_);
            this.animationFrame_ = 0;
            clearTimeout(this.animationTimer_);
            this.animationTimer_ = 0;
            this.adapter_.removeClass(OPENING);
            this.adapter_.removeClass(OPEN);
            this.adapter_.removeClass(CLOSING);
        };
        MDCSnackbarFoundation.prototype.open = function () {
            var _this = this;
            this.clearAutoDismissTimer_();
            this.isOpen_ = true;
            this.adapter_.notifyOpening();
            this.adapter_.removeClass(CLOSING);
            this.adapter_.addClass(OPENING);
            this.adapter_.announce();
            // Wait a frame once display is no longer "none", to establish basis for animation
            this.runNextAnimationFrame_(function () {
                _this.adapter_.addClass(OPEN);
                _this.animationTimer_ = setTimeout(function () {
                    _this.handleAnimationTimerEnd_();
                    _this.adapter_.notifyOpened();
                    _this.autoDismissTimer_ = setTimeout(function () {
                        _this.close(REASON_DISMISS);
                    }, _this.getTimeoutMs());
                }, numbers$6.SNACKBAR_ANIMATION_OPEN_TIME_MS);
            });
        };
        /**
         * @param reason Why the snackbar was closed. Value will be passed to CLOSING_EVENT and CLOSED_EVENT via the
         *     `event.detail.reason` property. Standard values are REASON_ACTION and REASON_DISMISS, but custom
         *     client-specific values may also be used if desired.
         */
        MDCSnackbarFoundation.prototype.close = function (reason) {
            var _this = this;
            if (reason === void 0) { reason = ''; }
            if (!this.isOpen_) {
                // Avoid redundant close calls (and events), e.g. repeated interactions as the snackbar is animating closed
                return;
            }
            cancelAnimationFrame(this.animationFrame_);
            this.animationFrame_ = 0;
            this.clearAutoDismissTimer_();
            this.isOpen_ = false;
            this.adapter_.notifyClosing(reason);
            this.adapter_.addClass(cssClasses$a.CLOSING);
            this.adapter_.removeClass(cssClasses$a.OPEN);
            this.adapter_.removeClass(cssClasses$a.OPENING);
            clearTimeout(this.animationTimer_);
            this.animationTimer_ = setTimeout(function () {
                _this.handleAnimationTimerEnd_();
                _this.adapter_.notifyClosed(reason);
            }, numbers$6.SNACKBAR_ANIMATION_CLOSE_TIME_MS);
        };
        MDCSnackbarFoundation.prototype.isOpen = function () {
            return this.isOpen_;
        };
        MDCSnackbarFoundation.prototype.getTimeoutMs = function () {
            return this.autoDismissTimeoutMs_;
        };
        MDCSnackbarFoundation.prototype.setTimeoutMs = function (timeoutMs) {
            // Use shorter variable names to make the code more readable
            var minValue = numbers$6.MIN_AUTO_DISMISS_TIMEOUT_MS;
            var maxValue = numbers$6.MAX_AUTO_DISMISS_TIMEOUT_MS;
            if (timeoutMs <= maxValue && timeoutMs >= minValue) {
                this.autoDismissTimeoutMs_ = timeoutMs;
            }
            else {
                throw new Error("timeoutMs must be an integer in the range " + minValue + "\u2013" + maxValue + ", but got '" + timeoutMs + "'");
            }
        };
        MDCSnackbarFoundation.prototype.getCloseOnEscape = function () {
            return this.closeOnEscape_;
        };
        MDCSnackbarFoundation.prototype.setCloseOnEscape = function (closeOnEscape) {
            this.closeOnEscape_ = closeOnEscape;
        };
        MDCSnackbarFoundation.prototype.handleKeyDown = function (evt) {
            var isEscapeKey = evt.key === 'Escape' || evt.keyCode === 27;
            if (isEscapeKey && this.getCloseOnEscape()) {
                this.close(REASON_DISMISS);
            }
        };
        MDCSnackbarFoundation.prototype.handleActionButtonClick = function (_evt) {
            this.close(REASON_ACTION);
        };
        MDCSnackbarFoundation.prototype.handleActionIconClick = function (_evt) {
            this.close(REASON_DISMISS);
        };
        MDCSnackbarFoundation.prototype.clearAutoDismissTimer_ = function () {
            clearTimeout(this.autoDismissTimer_);
            this.autoDismissTimer_ = 0;
        };
        MDCSnackbarFoundation.prototype.handleAnimationTimerEnd_ = function () {
            this.animationTimer_ = 0;
            this.adapter_.removeClass(cssClasses$a.OPENING);
            this.adapter_.removeClass(cssClasses$a.CLOSING);
        };
        /**
         * Runs the given logic on the next animation frame, using setTimeout to factor in Firefox reflow behavior.
         */
        MDCSnackbarFoundation.prototype.runNextAnimationFrame_ = function (callback) {
            var _this = this;
            cancelAnimationFrame(this.animationFrame_);
            this.animationFrame_ = requestAnimationFrame(function () {
                _this.animationFrame_ = 0;
                clearTimeout(_this.animationTimer_);
                _this.animationTimer_ = setTimeout(callback, 0);
            });
        };
        return MDCSnackbarFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var SURFACE_SELECTOR = strings$c.SURFACE_SELECTOR, LABEL_SELECTOR = strings$c.LABEL_SELECTOR, ACTION_SELECTOR = strings$c.ACTION_SELECTOR, DISMISS_SELECTOR = strings$c.DISMISS_SELECTOR, OPENING_EVENT = strings$c.OPENING_EVENT, OPENED_EVENT = strings$c.OPENED_EVENT, CLOSING_EVENT = strings$c.CLOSING_EVENT, CLOSED_EVENT = strings$c.CLOSED_EVENT;
    var MDCSnackbar = /** @class */ (function (_super) {
        __extends(MDCSnackbar, _super);
        function MDCSnackbar() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCSnackbar.attachTo = function (root) {
            return new MDCSnackbar(root);
        };
        MDCSnackbar.prototype.initialize = function (announcerFactory) {
            if (announcerFactory === void 0) { announcerFactory = function () { return announce; }; }
            this.announce_ = announcerFactory();
        };
        MDCSnackbar.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.surfaceEl_ = this.root_.querySelector(SURFACE_SELECTOR);
            this.labelEl_ = this.root_.querySelector(LABEL_SELECTOR);
            this.actionEl_ = this.root_.querySelector(ACTION_SELECTOR);
            this.handleKeyDown_ = function (evt) { return _this.foundation_.handleKeyDown(evt); };
            this.handleSurfaceClick_ = function (evt) {
                var target = evt.target;
                if (_this.isActionButton_(target)) {
                    _this.foundation_.handleActionButtonClick(evt);
                }
                else if (_this.isActionIcon_(target)) {
                    _this.foundation_.handleActionIconClick(evt);
                }
            };
            this.registerKeyDownHandler_(this.handleKeyDown_);
            this.registerSurfaceClickHandler_(this.handleSurfaceClick_);
        };
        MDCSnackbar.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.deregisterKeyDownHandler_(this.handleKeyDown_);
            this.deregisterSurfaceClickHandler_(this.handleSurfaceClick_);
        };
        MDCSnackbar.prototype.open = function () {
            this.foundation_.open();
        };
        /**
         * @param reason Why the snackbar was closed. Value will be passed to CLOSING_EVENT and CLOSED_EVENT via the
         *     `event.detail.reason` property. Standard values are REASON_ACTION and REASON_DISMISS, but custom
         *     client-specific values may also be used if desired.
         */
        MDCSnackbar.prototype.close = function (reason) {
            if (reason === void 0) { reason = ''; }
            this.foundation_.close(reason);
        };
        MDCSnackbar.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                announce: function () { return _this.announce_(_this.labelEl_); },
                notifyClosed: function (reason) { return _this.emit(CLOSED_EVENT, reason ? { reason: reason } : {}); },
                notifyClosing: function (reason) { return _this.emit(CLOSING_EVENT, reason ? { reason: reason } : {}); },
                notifyOpened: function () { return _this.emit(OPENED_EVENT, {}); },
                notifyOpening: function () { return _this.emit(OPENING_EVENT, {}); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
            };
            return new MDCSnackbarFoundation(adapter);
        };
        Object.defineProperty(MDCSnackbar.prototype, "timeoutMs", {
            get: function () {
                return this.foundation_.getTimeoutMs();
            },
            set: function (timeoutMs) {
                this.foundation_.setTimeoutMs(timeoutMs);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbar.prototype, "closeOnEscape", {
            get: function () {
                return this.foundation_.getCloseOnEscape();
            },
            set: function (closeOnEscape) {
                this.foundation_.setCloseOnEscape(closeOnEscape);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbar.prototype, "isOpen", {
            get: function () {
                return this.foundation_.isOpen();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbar.prototype, "labelText", {
            get: function () {
                // This property only returns null if the node is a document, DOCTYPE, or notation.
                // On Element nodes, it always returns a string.
                return this.labelEl_.textContent;
            },
            set: function (labelText) {
                this.labelEl_.textContent = labelText;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbar.prototype, "actionButtonText", {
            get: function () {
                return this.actionEl_.textContent;
            },
            set: function (actionButtonText) {
                this.actionEl_.textContent = actionButtonText;
            },
            enumerable: true,
            configurable: true
        });
        MDCSnackbar.prototype.registerKeyDownHandler_ = function (handler) {
            this.listen('keydown', handler);
        };
        MDCSnackbar.prototype.deregisterKeyDownHandler_ = function (handler) {
            this.unlisten('keydown', handler);
        };
        MDCSnackbar.prototype.registerSurfaceClickHandler_ = function (handler) {
            this.surfaceEl_.addEventListener('click', handler);
        };
        MDCSnackbar.prototype.deregisterSurfaceClickHandler_ = function (handler) {
            this.surfaceEl_.removeEventListener('click', handler);
        };
        MDCSnackbar.prototype.isActionButton_ = function (target) {
            return Boolean(closest(target, ACTION_SELECTOR));
        };
        MDCSnackbar.prototype.isActionIcon_ = function (target) {
            return Boolean(closest(target, DISMISS_SELECTOR));
        };
        return MDCSnackbar;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules\@smui\snackbar\Snackbar.svelte generated by Svelte v3.20.1 */
    const file$C = "node_modules\\@smui\\snackbar\\Snackbar.svelte";

    function create_fragment$F(ctx) {
    	let div1;
    	let div0;
    	let useActions_action;
    	let useActions_action_1;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[23].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[22], null);

    	let div0_levels = [
    		{
    			class: "mdc-snackbar__surface " + /*surface$class*/ ctx[4]
    		},
    		prefixFilter(/*$$props*/ ctx[9], "surface$")
    	];

    	let div0_data = {};

    	for (let i = 0; i < div0_levels.length; i += 1) {
    		div0_data = assign(div0_data, div0_levels[i]);
    	}

    	let div1_levels = [
    		{
    			class: "\n    mdc-snackbar\n    " + /*className*/ ctx[1] + "\n    " + (/*variant*/ ctx[2] === "stacked"
    			? "mdc-snackbar--stacked"
    			: "") + "\n    " + (/*leading*/ ctx[3] ? "mdc-snackbar--leading" : "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[9], ["use", "class", "variant", "leading", "surface$"])
    	];

    	let div1_data = {};

    	for (let i = 0; i < div1_levels.length; i += 1) {
    		div1_data = assign(div1_data, div1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div0, div0_data);
    			add_location(div0, file$C, 13, 2, 340);
    			set_attributes(div1, div1_data);
    			add_location(div1, file$C, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div1_binding*/ ctx[24](div1);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div0, /*surface$use*/ ctx[5])),
    				action_destroyer(useActions_action_1 = useActions.call(null, div1, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[7].call(null, div1)),
    				listen_dev(div1, "MDCSnackbar:closed", /*handleClosed*/ ctx[8], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4194304) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[22], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[22], dirty, null));
    				}
    			}

    			set_attributes(div0, get_spread_update(div0_levels, [
    				dirty & /*surface$class*/ 16 && {
    					class: "mdc-snackbar__surface " + /*surface$class*/ ctx[4]
    				},
    				dirty & /*prefixFilter, $$props*/ 512 && prefixFilter(/*$$props*/ ctx[9], "surface$")
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*surface$use*/ 32) useActions_action.update.call(null, /*surface$use*/ ctx[5]);

    			set_attributes(div1, get_spread_update(div1_levels, [
    				dirty & /*className, variant, leading*/ 14 && {
    					class: "\n    mdc-snackbar\n    " + /*className*/ ctx[1] + "\n    " + (/*variant*/ ctx[2] === "stacked"
    					? "mdc-snackbar--stacked"
    					: "") + "\n    " + (/*leading*/ ctx[3] ? "mdc-snackbar--leading" : "") + "\n  "
    				},
    				dirty & /*exclude, $$props*/ 512 && exclude(/*$$props*/ ctx[9], ["use", "class", "variant", "leading", "surface$"])
    			]));

    			if (useActions_action_1 && is_function(useActions_action_1.update) && dirty & /*use*/ 1) useActions_action_1.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			/*div1_binding*/ ctx[24](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$F.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let waiting = Promise.resolve();

    function instance$F($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, [
    		"MDCSnackbar:opening",
    		"MDCSnackbar:opened",
    		"MDCSnackbar:closing",
    		"MDCSnackbar:closed"
    	]);

    	const uninitializedValue = () => {
    		
    	};

    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { variant = "" } = $$props;
    	let { leading = false } = $$props;
    	let { timeoutMs = 5000 } = $$props;
    	let { closeOnEscape = true } = $$props;
    	let { labelText = uninitializedValue } = $$props;
    	let { actionButtonText = uninitializedValue } = $$props;
    	let { surface$class = "" } = $$props;
    	let { surface$use = [] } = $$props;
    	let element;
    	let snackbar;
    	let closeResolve;
    	let closePromise = new Promise(resolve => closeResolve = resolve);
    	setContext("SMUI:button:context", "snackbar");
    	setContext("SMUI:icon-button:context", "snackbar");
    	setContext("SMUI:label:context", "snackbar");

    	onMount(() => {
    		$$invalidate(18, snackbar = new MDCSnackbar(element));
    	});

    	onDestroy(() => {
    		snackbar && snackbar.destroy();
    	});

    	function handleClosed() {
    		closeResolve();
    		closePromise = new Promise(resolve => closeResolve = resolve);
    	}

    	function open(...args) {
    		waiting = waiting.then(() => {
    			snackbar.open(...args);
    			return closePromise;
    		});
    	}

    	function forceOpen(...args) {
    		return snackbar.open(...args);
    	}

    	function close(...args) {
    		return snackbar.close(...args);
    	}

    	function isOpen() {
    		return snackbar.isOpen;
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Snackbar", $$slots, ['default']);

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(6, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("variant" in $$new_props) $$invalidate(2, variant = $$new_props.variant);
    		if ("leading" in $$new_props) $$invalidate(3, leading = $$new_props.leading);
    		if ("timeoutMs" in $$new_props) $$invalidate(10, timeoutMs = $$new_props.timeoutMs);
    		if ("closeOnEscape" in $$new_props) $$invalidate(11, closeOnEscape = $$new_props.closeOnEscape);
    		if ("labelText" in $$new_props) $$invalidate(12, labelText = $$new_props.labelText);
    		if ("actionButtonText" in $$new_props) $$invalidate(13, actionButtonText = $$new_props.actionButtonText);
    		if ("surface$class" in $$new_props) $$invalidate(4, surface$class = $$new_props.surface$class);
    		if ("surface$use" in $$new_props) $$invalidate(5, surface$use = $$new_props.surface$use);
    		if ("$$scope" in $$new_props) $$invalidate(22, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		waiting,
    		MDCSnackbar,
    		onMount,
    		onDestroy,
    		setContext,
    		current_component,
    		forwardEventsBuilder,
    		exclude,
    		prefixFilter,
    		useActions,
    		forwardEvents,
    		uninitializedValue,
    		use,
    		className,
    		variant,
    		leading,
    		timeoutMs,
    		closeOnEscape,
    		labelText,
    		actionButtonText,
    		surface$class,
    		surface$use,
    		element,
    		snackbar,
    		closeResolve,
    		closePromise,
    		handleClosed,
    		open,
    		forceOpen,
    		close,
    		isOpen
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("variant" in $$props) $$invalidate(2, variant = $$new_props.variant);
    		if ("leading" in $$props) $$invalidate(3, leading = $$new_props.leading);
    		if ("timeoutMs" in $$props) $$invalidate(10, timeoutMs = $$new_props.timeoutMs);
    		if ("closeOnEscape" in $$props) $$invalidate(11, closeOnEscape = $$new_props.closeOnEscape);
    		if ("labelText" in $$props) $$invalidate(12, labelText = $$new_props.labelText);
    		if ("actionButtonText" in $$props) $$invalidate(13, actionButtonText = $$new_props.actionButtonText);
    		if ("surface$class" in $$props) $$invalidate(4, surface$class = $$new_props.surface$class);
    		if ("surface$use" in $$props) $$invalidate(5, surface$use = $$new_props.surface$use);
    		if ("element" in $$props) $$invalidate(6, element = $$new_props.element);
    		if ("snackbar" in $$props) $$invalidate(18, snackbar = $$new_props.snackbar);
    		if ("closeResolve" in $$props) closeResolve = $$new_props.closeResolve;
    		if ("closePromise" in $$props) closePromise = $$new_props.closePromise;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*snackbar, timeoutMs*/ 263168) {
    			 if (snackbar && snackbar.timeoutMs !== timeoutMs) {
    				$$invalidate(18, snackbar.timeoutMs = timeoutMs, snackbar);
    			}
    		}

    		if ($$self.$$.dirty & /*snackbar, closeOnEscape*/ 264192) {
    			 if (snackbar && snackbar.closeOnEscape !== closeOnEscape) {
    				$$invalidate(18, snackbar.closeOnEscape = closeOnEscape, snackbar);
    			}
    		}

    		if ($$self.$$.dirty & /*snackbar, labelText*/ 266240) {
    			 if (snackbar && labelText !== uninitializedValue && snackbar.labelText !== labelText) {
    				$$invalidate(18, snackbar.labelText = labelText, snackbar);
    			}
    		}

    		if ($$self.$$.dirty & /*snackbar, actionButtonText*/ 270336) {
    			 if (snackbar && actionButtonText !== uninitializedValue && snackbar.actionButtonText !== actionButtonText) {
    				$$invalidate(18, snackbar.actionButtonText = actionButtonText, snackbar);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		variant,
    		leading,
    		surface$class,
    		surface$use,
    		element,
    		forwardEvents,
    		handleClosed,
    		$$props,
    		timeoutMs,
    		closeOnEscape,
    		labelText,
    		actionButtonText,
    		open,
    		forceOpen,
    		close,
    		isOpen,
    		snackbar,
    		closeResolve,
    		closePromise,
    		uninitializedValue,
    		$$scope,
    		$$slots,
    		div1_binding
    	];
    }

    class Snackbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$F, create_fragment$F, safe_not_equal, {
    			use: 0,
    			class: 1,
    			variant: 2,
    			leading: 3,
    			timeoutMs: 10,
    			closeOnEscape: 11,
    			labelText: 12,
    			actionButtonText: 13,
    			surface$class: 4,
    			surface$use: 5,
    			open: 14,
    			forceOpen: 15,
    			close: 16,
    			isOpen: 17
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snackbar",
    			options,
    			id: create_fragment$F.name
    		});
    	}

    	get use() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get leading() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leading(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeoutMs() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeoutMs(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeOnEscape() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeOnEscape(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get actionButtonText() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set actionButtonText(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get surface$class() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set surface$class(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get surface$use() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set surface$use(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		return this.$$.ctx[14];
    	}

    	set open(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forceOpen() {
    		return this.$$.ctx[15];
    	}

    	set forceOpen(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[16];
    	}

    	set close(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpen() {
    		return this.$$.ctx[17];
    	}

    	set isOpen(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Actions$1 = classAdderBuilder({
      class: 'mdc-snackbar__actions',
      component: Div,
      contexts: {}
    });

    /* node_modules\@smui\snackbar\kitchen\Kitchen.svelte generated by Svelte v3.20.1 */

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (1:0) {#if config}
    function create_if_block$d(ctx) {
    	let current;

    	const snackbar_spread_levels = [
    		{ labelText: /*config*/ ctx[1].label },
    		/*config*/ ctx[1] && /*config*/ ctx[1].props || {},
    		prefixFilter(/*$$props*/ ctx[3], "snackbar$")
    	];

    	let snackbar_props = {
    		$$slots: { default: [create_default_slot$f] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < snackbar_spread_levels.length; i += 1) {
    		snackbar_props = assign(snackbar_props, snackbar_spread_levels[i]);
    	}

    	const snackbar = new Snackbar({ props: snackbar_props, $$inline: true });
    	/*snackbar_binding*/ ctx[9](snackbar);
    	snackbar.$on("MDCSnackbar:closed", /*handleClosed*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(snackbar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(snackbar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const snackbar_changes = (dirty & /*config, prefixFilter, $$props*/ 10)
    			? get_spread_update(snackbar_spread_levels, [
    					dirty & /*config*/ 2 && { labelText: /*config*/ ctx[1].label },
    					dirty & /*config*/ 2 && get_spread_object(/*config*/ ctx[1] && /*config*/ ctx[1].props || {}),
    					dirty & /*prefixFilter, $$props*/ 8 && get_spread_object(prefixFilter(/*$$props*/ ctx[3], "snackbar$"))
    				])
    			: {};

    			if (dirty & /*$$scope, config*/ 8194) {
    				snackbar_changes.$$scope = { dirty, ctx };
    			}

    			snackbar.$set(snackbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(snackbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(snackbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*snackbar_binding*/ ctx[9](null);
    			destroy_component(snackbar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(1:0) {#if config}",
    		ctx
    	});

    	return block;
    }

    // (12:4) {#if config.actions || config.dismissButton}
    function create_if_block_1$5(ctx) {
    	let current;

    	const actions = new Actions$1({
    			props: {
    				$$slots: { default: [create_default_slot_1$c] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(actions.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(actions, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const actions_changes = {};

    			if (dirty & /*$$scope, config*/ 8194) {
    				actions_changes.$$scope = { dirty, ctx };
    			}

    			actions.$set(actions_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(actions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(actions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(actions, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(12:4) {#if config.actions || config.dismissButton}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if config.actions}
    function create_if_block_3$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*config*/ ctx[1].actions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prefixFilter, $$props, config*/ 10) {
    				each_value = /*config*/ ctx[1].actions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(14:8) {#if config.actions}",
    		ctx
    	});

    	return block;
    }

    // (16:12) <Button               on:click={e => action.onClick && action.onClick(e)}               {...prefixFilter($$props, 'action$')}             >
    function create_default_slot_3$9(ctx) {
    	let t_value = /*action*/ ctx[10].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*config*/ 2 && t_value !== (t_value = /*action*/ ctx[10].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$9.name,
    		type: "slot",
    		source: "(16:12) <Button               on:click={e => action.onClick && action.onClick(e)}               {...prefixFilter($$props, 'action$')}             >",
    		ctx
    	});

    	return block;
    }

    // (15:10) {#each config.actions as action}
    function create_each_block$5(ctx) {
    	let current;
    	const button_spread_levels = [prefixFilter(/*$$props*/ ctx[3], "action$")];

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[7](/*action*/ ctx[10], ...args);
    	}

    	let button_props = {
    		$$slots: { default: [create_default_slot_3$9] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < button_spread_levels.length; i += 1) {
    		button_props = assign(button_props, button_spread_levels[i]);
    	}

    	const button = new Button_1({ props: button_props, $$inline: true });
    	button.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const button_changes = (dirty & /*prefixFilter, $$props*/ 8)
    			? get_spread_update(button_spread_levels, [get_spread_object(prefixFilter(/*$$props*/ ctx[3], "action$"))])
    			: {};

    			if (dirty & /*$$scope, config*/ 8194) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(15:10) {#each config.actions as action}",
    		ctx
    	});

    	return block;
    }

    // (22:8) {#if config.dismissButton}
    function create_if_block_2$2(ctx) {
    	let current;

    	const iconbutton_spread_levels = [
    		{
    			title: /*config*/ ctx[1].dismissTitle || "Dismiss"
    		},
    		prefixFilter(/*$$props*/ ctx[3], "dismiss$")
    	];

    	let iconbutton_props = {
    		$$slots: { default: [create_default_slot_2$9] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < iconbutton_spread_levels.length; i += 1) {
    		iconbutton_props = assign(iconbutton_props, iconbutton_spread_levels[i]);
    	}

    	const iconbutton = new IconButton({ props: iconbutton_props, $$inline: true });
    	iconbutton.$on("click", /*click_handler_1*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(iconbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(iconbutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const iconbutton_changes = (dirty & /*config, prefixFilter, $$props*/ 10)
    			? get_spread_update(iconbutton_spread_levels, [
    					dirty & /*config*/ 2 && {
    						title: /*config*/ ctx[1].dismissTitle || "Dismiss"
    					},
    					dirty & /*prefixFilter, $$props*/ 8 && get_spread_object(prefixFilter(/*$$props*/ ctx[3], "dismiss$"))
    				])
    			: {};

    			if (dirty & /*$$scope, config*/ 8194) {
    				iconbutton_changes.$$scope = { dirty, ctx };
    			}

    			iconbutton.$set(iconbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(iconbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(22:8) {#if config.dismissButton}",
    		ctx
    	});

    	return block;
    }

    // (23:10) <IconButton             on:click={e => config.onDismiss && config.onDismiss(e)}             title="{config.dismissTitle || 'Dismiss'}"             {...prefixFilter($$props, 'dismiss$')}           >
    function create_default_slot_2$9(ctx) {
    	let t_value = (/*config*/ ctx[1].dismissText || "close") + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*config*/ 2 && t_value !== (t_value = (/*config*/ ctx[1].dismissText || "close") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$9.name,
    		type: "slot",
    		source: "(23:10) <IconButton             on:click={e => config.onDismiss && config.onDismiss(e)}             title=\\\"{config.dismissTitle || 'Dismiss'}\\\"             {...prefixFilter($$props, 'dismiss$')}           >",
    		ctx
    	});

    	return block;
    }

    // (13:6) <Actions>
    function create_default_slot_1$c(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*config*/ ctx[1].actions && create_if_block_3$2(ctx);
    	let if_block1 = /*config*/ ctx[1].dismissButton && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*config*/ ctx[1].actions) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_3$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*config*/ ctx[1].dismissButton) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$c.name,
    		type: "slot",
    		source: "(13:6) <Actions>",
    		ctx
    	});

    	return block;
    }

    // (2:2) <Snackbar     bind:this={component}     on:MDCSnackbar:closed={handleClosed}     labelText={config.label}     {...(config && config.props || {})}     {...prefixFilter($$props, 'snackbar$')}   >
    function create_default_slot$f(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;
    	const label_spread_levels = [prefixFilter(/*$$props*/ ctx[3], "label$")];
    	let label_props = {};

    	for (let i = 0; i < label_spread_levels.length; i += 1) {
    		label_props = assign(label_props, label_spread_levels[i]);
    	}

    	const label = new Label({ props: label_props, $$inline: true });
    	let if_block = (/*config*/ ctx[1].actions || /*config*/ ctx[1].dismissButton) && create_if_block_1$5(ctx);

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = (dirty & /*prefixFilter, $$props*/ 8)
    			? get_spread_update(label_spread_levels, [get_spread_object(prefixFilter(/*$$props*/ ctx[3], "label$"))])
    			: {};

    			label.$set(label_changes);

    			if (/*config*/ ctx[1].actions || /*config*/ ctx[1].dismissButton) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$f.name,
    		type: "slot",
    		source: "(2:2) <Snackbar     bind:this={component}     on:MDCSnackbar:closed={handleClosed}     labelText={config.label}     {...(config && config.props || {})}     {...prefixFilter($$props, 'snackbar$')}   >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$G(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*config*/ ctx[1] && create_if_block$d(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*config*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$d(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$G.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$G($$self, $$props, $$invalidate) {
    	let snackbars = [];
    	let component;
    	let config = null;
    	let waiting = false;

    	function handleClosed(e) {
    		if (config.onClose) {
    			config.onClose(e);
    		}

    		snackbars.splice(0, 1);
    		$$invalidate(5, snackbars);
    		$$invalidate(1, config = null);
    	}

    	function push(config) {
    		snackbars.push(config);
    		$$invalidate(5, snackbars);
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Kitchen", $$slots, []);
    	const click_handler = (action, e) => action.onClick && action.onClick(e);
    	const click_handler_1 = e => config.onDismiss && config.onDismiss(e);

    	function snackbar_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, component = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$self.$capture_state = () => ({
    		tick,
    		Label,
    		Button: Button_1,
    		IconButton,
    		prefixFilter,
    		Snackbar,
    		Actions: Actions$1,
    		snackbars,
    		component,
    		config,
    		waiting,
    		handleClosed,
    		push
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("snackbars" in $$props) $$invalidate(5, snackbars = $$new_props.snackbars);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("config" in $$props) $$invalidate(1, config = $$new_props.config);
    		if ("waiting" in $$props) $$invalidate(6, waiting = $$new_props.waiting);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*snackbars, config*/ 34) {
    			 if (snackbars.length && !config) {
    				$$invalidate(1, config = snackbars[0]);
    				$$invalidate(6, waiting = true);
    			}
    		}

    		if ($$self.$$.dirty & /*component, waiting*/ 65) {
    			 if (component && waiting && !component.isOpen()) {
    				component.open();
    				$$invalidate(6, waiting = false);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		config,
    		handleClosed,
    		$$props,
    		push,
    		snackbars,
    		waiting,
    		click_handler,
    		click_handler_1,
    		snackbar_binding
    	];
    }

    class Kitchen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$G, create_fragment$G, safe_not_equal, { push: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kitchen",
    			options,
    			id: create_fragment$G.name
    		});
    	}

    	get push() {
    		return this.$$.ctx[4];
    	}

    	set push(value) {
    		throw new Error("<Kitchen>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Notification.svelte generated by Svelte v3.20.1 */

    // (53:0) <Snackbar bind:this={mySnackbar} labelText={mySnackbarText}>
    function create_default_slot$g(ctx) {
    	let current;
    	const label = new Label({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$g.name,
    		type: "slot",
    		source: "(53:0) <Snackbar bind:this={mySnackbar} labelText={mySnackbarText}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$H(ctx) {
    	let t;
    	let current;

    	let snackbar_props = {
    		labelText: /*mySnackbarText*/ ctx[2],
    		$$slots: { default: [create_default_slot$g] },
    		$$scope: { ctx }
    	};

    	const snackbar = new Snackbar({ props: snackbar_props, $$inline: true });
    	/*snackbar_binding*/ ctx[4](snackbar);
    	let kitchen_1_props = { dismiss$class: "material-icons" };
    	const kitchen_1 = new Kitchen({ props: kitchen_1_props, $$inline: true });
    	/*kitchen_1_binding*/ ctx[5](kitchen_1);

    	const block = {
    		c: function create() {
    			create_component(snackbar.$$.fragment);
    			t = space();
    			create_component(kitchen_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(snackbar, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(kitchen_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const snackbar_changes = {};
    			if (dirty & /*mySnackbarText*/ 4) snackbar_changes.labelText = /*mySnackbarText*/ ctx[2];

    			if (dirty & /*$$scope*/ 64) {
    				snackbar_changes.$$scope = { dirty, ctx };
    			}

    			snackbar.$set(snackbar_changes);
    			const kitchen_1_changes = {};
    			kitchen_1.$set(kitchen_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(snackbar.$$.fragment, local);
    			transition_in(kitchen_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(snackbar.$$.fragment, local);
    			transition_out(kitchen_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*snackbar_binding*/ ctx[4](null);
    			destroy_component(snackbar, detaching);
    			if (detaching) detach_dev(t);
    			/*kitchen_1_binding*/ ctx[5](null);
    			destroy_component(kitchen_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$H.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$H($$self, $$props, $$invalidate) {
    	let kitchen;
    	let mySnackbar;
    	let mySnackbarText;

    	onMount(async () => {
    		notificationStore.subscribe(x => {
    			$$invalidate(2, mySnackbarText = x.msg);
    			mySnackbarText && mySnackbar.open();
    		});

    		questionStore.subscribe(x => {
    			if (!x.msg) {
    				return;
    			}

    			pushToKitchen(x.msg, x.resolve, x.reject);
    		});
    	});

    	function pushToKitchen(msg, reslove, reject) {
    		if (!kitchen) {
    			reject();
    		}

    		kitchen.push({
    			props: { variant: "stacked" },
    			label: msg,
    			actions: [
    				{
    					onClick: () => reslove(true),
    					text: "Yes, please"
    				},
    				{
    					text: "Nope",
    					onClick: () => reslove(false)
    				}
    			],
    			dismissButton: false
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notification> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Notification", $$slots, []);

    	function snackbar_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, mySnackbar = $$value);
    		});
    	}

    	function kitchen_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, kitchen = $$value);
    		});
    	}

    	$$self.$capture_state = () => ({
    		notificationStore,
    		questionStore,
    		Label,
    		onMount,
    		Snackbar,
    		Actions: Actions$1,
    		Kitchen,
    		kitchen,
    		mySnackbar,
    		mySnackbarText,
    		pushToKitchen
    	});

    	$$self.$inject_state = $$props => {
    		if ("kitchen" in $$props) $$invalidate(0, kitchen = $$props.kitchen);
    		if ("mySnackbar" in $$props) $$invalidate(1, mySnackbar = $$props.mySnackbar);
    		if ("mySnackbarText" in $$props) $$invalidate(2, mySnackbarText = $$props.mySnackbarText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		kitchen,
    		mySnackbar,
    		mySnackbarText,
    		pushToKitchen,
    		snackbar_binding,
    		kitchen_1_binding
    	];
    }

    class Notification$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$H, create_fragment$H, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment$H.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.20.1 */
    const file$D = "src\\App.svelte";

    function create_fragment$I(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let current;
    	const headertopbar = new HeaderTopBar({ $$inline: true });
    	var switch_value = /*page*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*params*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const notification = new Notification$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(headertopbar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t1 = space();
    			create_component(notification.$$.fragment);
    			attr_dev(main, "class", "mainContainer svelte-1wabyb9");
    			attr_dev(main, "densefixedadjust", "");
    			add_location(main, file$D, 63, 0, 2369);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(headertopbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			insert_dev(target, t1, anchor);
    			mount_component(notification, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*page*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headertopbar.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headertopbar.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(headertopbar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    			if (detaching) detach_dev(t1);
    			destroy_component(notification, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$I.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$I($$self, $$props, $$invalidate) {
    	let page;
    	let params = {};
    	page_js("/login", () => $$invalidate(0, page = Login));
    	page_js("/home", () => $$invalidate(0, page = Home));
    	page_js("/settings", () => $$invalidate(0, page = Settings));
    	page_js("/contribute", () => $$invalidate(0, page = Contribution));
    	page_js("/contributions", () => $$invalidate(0, page = ManageContribution));
    	page_js("/addImage", () => $$invalidate(0, page = AddPlaceToBe));
    	page_js("/shareApiTest", () => $$invalidate(0, page = ShareApiTest));
    	page_js("/facts", () => $$invalidate(0, page = Facts));

    	page_js(
    		"/facts?key=:factKey",
    		(ctx, next) => {
    			$$invalidate(1, params = ctx.params);
    			next();
    		},
    		() => $$invalidate(0, page = Facts)
    	);

    	page_js("/map", () => $$invalidate(0, page = Map$1));
    	page_js("/images", () => $$invalidate(0, page = Images));

    	page_js(
    		"/slideShow",
    		(ctx, next) => {
    			$$invalidate(1, params = ctx.querystring.split("&").reduce(
    				(red, keyval) => {
    					let [key, val] = keyval.split("=");
    					red[key] = val;
    					return red;
    				},
    				{}
    			));

    			next();
    		},
    		() => $$invalidate(0, page = ImageFullScreenSwipe)
    	);

    	page_js("/*", () => $$invalidate(0, page = Home));
    	page_js.start();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Facts,
    		Images,
    		Map: Map$1,
    		Home,
    		Settings,
    		AddPlaceToBe,
    		Login,
    		ImageFullScreenSwipe,
    		HeaderTopBar,
    		ShareApiTest,
    		Contribution,
    		ManageContribution,
    		Notification: Notification$1,
    		router: page_js,
    		DenseFixedAdjust,
    		page,
    		params
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, params];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$I, create_fragment$I, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$I.name
    		});
    	}
    }

    //import "./main.pcss";

    const app = new App({
      target: document.body,
    });

}());
//# sourceMappingURL=main.js.map
