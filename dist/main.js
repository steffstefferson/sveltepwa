
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
    			add_location(div, file$9, 29, 6, 977);
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
    			add_location(div0, file$9, 26, 2, 851);
    			set_style(div1, "display", "flex");
    			set_style(div1, "flex-wrap", "wrap");
    			set_style(div1, "width", "100%");
    			add_location(div1, file$9, 25, 0, 793);
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

    	function deleteFact(e) {
    		e.stopPropagation();
    		dispatch("delete", { fact });
    	}

    	function acceptFact(e) {
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

    class Image extends SvelteComponentDev {
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

    	const image = new Image({
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
    		Image,
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

    	const image = new Image({
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
    		Image,
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

    /* src\components\Login.svelte generated by Svelte v3.20.1 */

    const { console: console_1$2 } = globals;
    const file$h = "src\\components\\Login.svelte";

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
    				$$slots: { default: [create_default_slot_4$2] },
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
    			add_location(h1, file$h, 92, 4, 2508);
    			add_location(h3, file$h, 93, 4, 2531);
    			add_location(form_1, file$h, 94, 4, 2562);
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
    function create_if_block$6(ctx) {
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
    				$$slots: { default: [create_default_slot_2$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button_1({
    			props: {
    				disabled: !/*$loginForm*/ ctx[3].email.valid || /*loginObj*/ ctx[0].email.length == 0,
    				variant: "raised",
    				class: "formButton",
    				$$slots: { default: [create_default_slot$7] },
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
    			add_location(h1, file$h, 66, 4, 1636);
    			attr_dev(label0, "for", "email");
    			add_location(label0, file$h, 69, 8, 1725);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "email");
    			add_location(input0, file$h, 70, 8, 1775);
    			add_location(div0, file$h, 68, 6, 1710);
    			add_location(br, file$h, 72, 6, 1859);
    			attr_dev(label1, "for", "password");
    			add_location(label1, file$h, 74, 8, 1888);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "name", "password");
    			add_location(input1, file$h, 75, 8, 1936);
    			add_location(div1, file$h, 73, 6, 1873);
    			attr_dev(form_1, "class", "lurinForm");
    			add_location(form_1, file$h, 67, 4, 1656);
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(66:2) {#if showLogin}",
    		ctx
    	});

    	return block;
    }

    // (97:8) <Label>
    function create_default_slot_5$1(ctx) {
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
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(97:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (96:6) <Button class="formButton" variant="raised">
    function create_default_slot_4$2(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_5$1] },
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
    		id: create_default_slot_4$2.name,
    		type: "slot",
    		source: "(96:6) <Button class=\\\"formButton\\\" variant=\\\"raised\\\">",
    		ctx
    	});

    	return block;
    }

    // (82:8) <Label>
    function create_default_slot_3$4(ctx) {
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
    		id: create_default_slot_3$4.name,
    		type: "slot",
    		source: "(82:8) <Label>",
    		ctx
    	});

    	return block;
    }

    // (78:6) <Button          disabled={!$loginForm.valid || loginObj.email.length == 0 || loginObj.password.length == 0}          variant="raised"          class="formButton">
    function create_default_slot_2$4(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_3$4] },
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
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(78:6) <Button          disabled={!$loginForm.valid || loginObj.email.length == 0 || loginObj.password.length == 0}          variant=\\\"raised\\\"          class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    // (90:6) <Label>
    function create_default_slot_1$5(ctx) {
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
    		id: create_default_slot_1$5.name,
    		type: "slot",
    		source: "(90:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (85:4) <Button        on:click={sendPasswordResetLink}        disabled={!$loginForm.email.valid || loginObj.email.length == 0}        variant="raised"        class="formButton">
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
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(85:4) <Button        on:click={sendPasswordResetLink}        disabled={!$loginForm.email.valid || loginObj.email.length == 0}        variant=\\\"raised\\\"        class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block$2];
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
    			add_location(div, file$h, 64, 0, 1583);
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Login> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\components\FullScreenMenu.svelte generated by Svelte v3.20.1 */
    const file$i = "src\\components\\FullScreenMenu.svelte";

    // (44:4) {#if minimized}
    function create_if_block_4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Lurinfacts beta";
    			attr_dev(div, "class", "pageTitle svelte-12yqv7w");
    			add_location(div, file$i, 44, 6, 1780);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(44:4) {#if minimized}",
    		ctx
    	});

    	return block;
    }

    // (70:6) {#if loggedIn}
    function create_if_block_1$2(ctx) {
    	let li0;
    	let a0;
    	let t0;
    	let t1;
    	let li1;
    	let a1;
    	let t2;
    	let current;
    	let dispose;
    	let if_block0 = !/*minimized*/ ctx[1] && create_if_block_3(ctx);
    	let if_block1 = !/*minimized*/ ctx[1] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			li0 = element("li");
    			a0 = element("a");
    			if (if_block0) if_block0.c();
    			t0 = text("\r\n            Contributions");
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			if (if_block1) if_block1.c();
    			t2 = text("\r\n            Add image");
    			attr_dev(a0, "href", "/contributions");
    			attr_dev(a0, "class", "svelte-12yqv7w");
    			add_location(a0, file$i, 71, 10, 2474);
    			attr_dev(li0, "class", "svelte-12yqv7w");
    			add_location(li0, file$i, 70, 8, 2458);
    			attr_dev(a1, "href", "/addImage");
    			attr_dev(a1, "class", "svelte-12yqv7w");
    			add_location(a1, file$i, 79, 10, 2713);
    			attr_dev(li1, "class", "svelte-12yqv7w");
    			add_location(li1, file$i, 78, 8, 2697);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, li0, anchor);
    			append_dev(li0, a0);
    			if (if_block0) if_block0.m(a0, null);
    			append_dev(a0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, li1, anchor);
    			append_dev(li1, a1);
    			if (if_block1) if_block1.m(a1, null);
    			append_dev(a1, t2);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(a0, "click", /*checkIsOpened*/ ctx[2], false, false, false),
    				listen_dev(a1, "click", /*checkIsOpened*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (!/*minimized*/ ctx[1]) {
    				if (!if_block0) {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(a0, t0);
    				} else {
    					transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*minimized*/ ctx[1]) {
    				if (!if_block1) {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(a1, t2);
    				} else {
    					transition_in(if_block1, 1);
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
    			if (detaching) detach_dev(li0);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(li1);
    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(70:6) {#if loggedIn}",
    		ctx
    	});

    	return block;
    }

    // (73:12) {#if !minimized}
    function create_if_block_3(ctx) {
    	let current;

    	const icon = new Icon({
    			props: {
    				class: "material-icons",
    				$$slots: { default: [create_default_slot_1$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
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
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(73:12) {#if !minimized}",
    		ctx
    	});

    	return block;
    }

    // (74:14) <Icon class="material-icons">
    function create_default_slot_1$6(ctx) {
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
    		id: create_default_slot_1$6.name,
    		type: "slot",
    		source: "(74:14) <Icon class=\\\"material-icons\\\">",
    		ctx
    	});

    	return block;
    }

    // (81:12) {#if !minimized}
    function create_if_block_2(ctx) {
    	let current;

    	const icon = new Icon({
    			props: {
    				class: "material-icons",
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
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
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(81:12) {#if !minimized}",
    		ctx
    	});

    	return block;
    }

    // (82:14) <Icon class="material-icons">
    function create_default_slot$8(ctx) {
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
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(82:14) <Icon class=\\\"material-icons\\\">",
    		ctx
    	});

    	return block;
    }

    // (90:2) {#if minimized}
    function create_if_block$7(ctx) {
    	let div;
    	let a;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			img = element("img");
    			if (img.src !== (img_src_value = "./../assets/twitter_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Twitter Logo");
    			add_location(img, file$i, 97, 8, 3179);
    			attr_dev(a, "class", "twitterLink svelte-12yqv7w");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", "https://www.twitter.com/@lurin_tha_one");
    			attr_dev(a, "alt", "follow Lurin on twitter");
    			add_location(a, file$i, 92, 6, 3018);
    			set_style(div, "justify-self", "end");
    			add_location(div, file$i, 90, 4, 2976);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, img);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(90:2) {#if minimized}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let nav;
    	let div0;
    	let t0;
    	let div1;
    	let ul;
    	let li0;
    	let a0;
    	let t2;
    	let li1;
    	let a1;
    	let t4;
    	let li2;
    	let a2;
    	let t6;
    	let li3;
    	let a3;
    	let t8;
    	let li4;
    	let a4;
    	let t10;
    	let li5;
    	let a5;
    	let t11_value = (/*loggedIn*/ ctx[0] ? "Logout" : "Login") + "";
    	let t11;
    	let t12;
    	let t13;
    	let nav_class_value;
    	let current;
    	let dispose;
    	let if_block0 = /*minimized*/ ctx[1] && create_if_block_4(ctx);
    	let if_block1 = /*loggedIn*/ ctx[0] && create_if_block_1$2(ctx);
    	let if_block2 = /*minimized*/ ctx[1] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Home";
    			t2 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Facts";
    			t4 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Images";
    			t6 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Map";
    			t8 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "Settings";
    			t10 = space();
    			li5 = element("li");
    			a5 = element("a");
    			t11 = text(t11_value);
    			t12 = space();
    			if (if_block1) if_block1.c();
    			t13 = space();
    			if (if_block2) if_block2.c();
    			add_location(div0, file$i, 42, 2, 1746);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-12yqv7w");
    			add_location(a0, file$i, 50, 8, 1886);
    			attr_dev(li0, "class", "svelte-12yqv7w");
    			add_location(li0, file$i, 49, 6, 1872);
    			attr_dev(a1, "href", "/facts");
    			attr_dev(a1, "class", "svelte-12yqv7w");
    			add_location(a1, file$i, 53, 8, 1966);
    			attr_dev(li1, "class", "svelte-12yqv7w");
    			add_location(li1, file$i, 52, 6, 1952);
    			attr_dev(a2, "href", "/images");
    			attr_dev(a2, "class", "svelte-12yqv7w");
    			add_location(a2, file$i, 56, 8, 2052);
    			attr_dev(li2, "class", "svelte-12yqv7w");
    			add_location(li2, file$i, 55, 6, 2038);
    			attr_dev(a3, "href", "/map");
    			attr_dev(a3, "class", "svelte-12yqv7w");
    			add_location(a3, file$i, 59, 8, 2140);
    			attr_dev(li3, "class", "svelte-12yqv7w");
    			add_location(li3, file$i, 58, 6, 2126);
    			attr_dev(a4, "href", "/settings");
    			attr_dev(a4, "class", "svelte-12yqv7w");
    			add_location(a4, file$i, 62, 8, 2222);
    			attr_dev(li4, "class", "svelte-12yqv7w");
    			add_location(li4, file$i, 61, 6, 2208);
    			attr_dev(a5, "href", "/login");
    			attr_dev(a5, "class", "svelte-12yqv7w");
    			add_location(a5, file$i, 65, 8, 2314);
    			attr_dev(li5, "class", "svelte-12yqv7w");
    			add_location(li5, file$i, 64, 6, 2300);
    			attr_dev(ul, "class", "svelte-12yqv7w");
    			add_location(ul, file$i, 48, 4, 1860);
    			add_location(div1, file$i, 47, 2, 1849);
    			attr_dev(nav, "class", nav_class_value = "" + (null_to_empty(/*minimized*/ ctx[1] ? "minimized" : "") + " svelte-12yqv7w"));
    			add_location(nav, file$i, 41, 0, 1678);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(nav, t0);
    			append_dev(nav, div1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t4);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t6);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(ul, t8);
    			append_dev(ul, li4);
    			append_dev(li4, a4);
    			append_dev(ul, t10);
    			append_dev(ul, li5);
    			append_dev(li5, a5);
    			append_dev(a5, t11);
    			append_dev(ul, t12);
    			if (if_block1) if_block1.m(ul, null);
    			append_dev(nav, t13);
    			if (if_block2) if_block2.m(nav, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(a0, "click", /*checkIsOpened*/ ctx[2], false, false, false),
    				listen_dev(a1, "click", /*checkIsOpened*/ ctx[2], false, false, false),
    				listen_dev(a2, "click", /*checkIsOpened*/ ctx[2], false, false, false),
    				listen_dev(a3, "click", /*checkIsOpened*/ ctx[2], false, false, false),
    				listen_dev(a4, "click", /*checkIsOpened*/ ctx[2], false, false, false),
    				listen_dev(a5, "click", /*checkIsOpened*/ ctx[2], false, false, false),
    				listen_dev(nav, "click", /*toggleMenu*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*minimized*/ ctx[1]) {
    				if (!if_block0) {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((!current || dirty & /*loggedIn*/ 1) && t11_value !== (t11_value = (/*loggedIn*/ ctx[0] ? "Logout" : "Login") + "")) set_data_dev(t11, t11_value);

    			if (/*loggedIn*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(ul, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*minimized*/ ctx[1]) {
    				if (!if_block2) {
    					if_block2 = create_if_block$7(ctx);
    					if_block2.c();
    					if_block2.m(nav, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (!current || dirty & /*minimized*/ 2 && nav_class_value !== (nav_class_value = "" + (null_to_empty(/*minimized*/ ctx[1] ? "minimized" : "") + " svelte-12yqv7w"))) {
    				attr_dev(nav, "class", nav_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
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

    function instance$k($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	function deleteLocation(e) {
    		e.stopPropagation();
    		dispatch("delete", image);
    	}

    	let loggedIn = false;

    	const unsubscribe = userStore.subscribe(user => {
    		$$invalidate(0, loggedIn = user.loggedIn);
    	});

    	let minimized = true;

    	function checkIsOpened(e) {
    		if (minimized) {
    			toggleMenu();
    			e.preventDefault();
    		}

    		return false;
    	}

    	function toggleMenu() {
    		$$invalidate(1, minimized = !minimized);
    		dispatch("message", minimized);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FullScreenMenu> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("FullScreenMenu", $$slots, []);

    	$$self.$capture_state = () => ({
    		page: page_js,
    		IconButton,
    		Icon,
    		createEventDispatcher,
    		login,
    		logout,
    		userStore,
    		dispatch,
    		deleteLocation,
    		loggedIn,
    		unsubscribe,
    		minimized,
    		checkIsOpened,
    		toggleMenu
    	});

    	$$self.$inject_state = $$props => {
    		if ("loggedIn" in $$props) $$invalidate(0, loggedIn = $$props.loggedIn);
    		if ("minimized" in $$props) $$invalidate(1, minimized = $$props.minimized);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loggedIn, minimized, checkIsOpened, toggleMenu];
    }

    class FullScreenMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FullScreenMenu",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\components\ImageFullScreen.svelte generated by Svelte v3.20.1 */

    const { console: console_1$3 } = globals;
    const file$j = "src\\components\\ImageFullScreen.svelte";

    // (73:6) <IconButton         on:click={() => page('/' + backUrl + '#:~:text=' + encodeURIComponent(image.imageTitle))}         class="lurinsnavicons material-icons"         aria-label="Open map">
    function create_default_slot_4$3(ctx) {
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
    		id: create_default_slot_4$3.name,
    		type: "slot",
    		source: "(73:6) <IconButton         on:click={() => page('/' + backUrl + '#:~:text=' + encodeURIComponent(image.imageTitle))}         class=\\\"lurinsnavicons material-icons\\\"         aria-label=\\\"Open map\\\">",
    		ctx
    	});

    	return block;
    }

    // (80:6) <IconButton         on:click={() => page('/map?key=' + image.key)}         class="lurinsnavicons material-icons"         aria-label="Open map">
    function create_default_slot_3$5(ctx) {
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
    		id: create_default_slot_3$5.name,
    		type: "slot",
    		source: "(80:6) <IconButton         on:click={() => page('/map?key=' + image.key)}         class=\\\"lurinsnavicons material-icons\\\"         aria-label=\\\"Open map\\\">",
    		ctx
    	});

    	return block;
    }

    // (86:6) <IconButton         on:click={toggleZoom}         class="lurinsnavicons material-icons"         aria-label="Toggle zoom">
    function create_default_slot_2$5(ctx) {
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
    		id: create_default_slot_2$5.name,
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
    				$$slots: { default: [create_default_slot_1$7] },
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
    function create_if_block$8(ctx) {
    	let current;

    	const iconbutton = new IconButton({
    			props: {
    				class: "lurinsnavicons material-icons",
    				"aria-label": "Back",
    				$$slots: { default: [create_default_slot$9] },
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
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(93:6) {#if canShare}",
    		ctx
    	});

    	return block;
    }

    // (101:8) <IconButton           class="lurinsnavicons material-icons"           aria-label="placeholder">
    function create_default_slot_1$7(ctx) {
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
    		id: create_default_slot_1$7.name,
    		type: "slot",
    		source: "(101:8) <IconButton           class=\\\"lurinsnavicons material-icons\\\"           aria-label=\\\"placeholder\\\">",
    		ctx
    	});

    	return block;
    }

    // (94:8) <IconButton           on:click={shareImage}           class="lurinsnavicons material-icons"           aria-label="Back">
    function create_default_slot$9(ctx) {
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
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(94:8) <IconButton           on:click={shareImage}           class=\\\"lurinsnavicons material-icons\\\"           aria-label=\\\"Back\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
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
    				$$slots: { default: [create_default_slot_4$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	iconbutton0.$on("click", /*click_handler*/ ctx[10]);

    	const iconbutton1 = new IconButton({
    			props: {
    				class: "lurinsnavicons material-icons",
    				"aria-label": "Open map",
    				$$slots: { default: [create_default_slot_3$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	iconbutton1.$on("click", /*click_handler_1*/ ctx[11]);

    	const iconbutton2 = new IconButton({
    			props: {
    				class: "lurinsnavicons material-icons",
    				"aria-label": "Toggle zoom",
    				$$slots: { default: [create_default_slot_2$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	iconbutton2.$on("click", /*toggleZoom*/ ctx[7]);
    	const if_block_creators = [create_if_block$8, create_else_block$3];
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
    			add_location(div0, file$j, 55, 2, 2239);
    			attr_dev(span, "class", "title svelte-hppwgu");
    			add_location(span, file$j, 66, 8, 2525);
    			attr_dev(div1, "class", "svelte-hppwgu");
    			add_location(div1, file$j, 65, 6, 2511);
    			attr_dev(div2, "class", "text svelte-hppwgu");
    			add_location(div2, file$j, 68, 6, 2590);
    			attr_dev(div3, "class", "text svelte-hppwgu");
    			add_location(div3, file$j, 69, 6, 2636);
    			attr_dev(div4, "class", "svelte-hppwgu");
    			add_location(div4, file$j, 64, 4, 2499);
    			attr_dev(div5, "class", "svelte-hppwgu");
    			add_location(div5, file$j, 71, 4, 2710);
    			attr_dev(div6, "class", "textContainer svelte-hppwgu");
    			set_style(div6, "visibility", /*showTextContainer*/ ctx[2] ? "inherit" : "hidden");
    			add_location(div6, file$j, 61, 2, 2396);
    			attr_dev(div7, "class", "container svelte-hppwgu");
    			attr_dev(div7, "style", div7_style_value = "background-image: url('" + /*image*/ ctx[0].url + "'); " + /*backgroundSize*/ ctx[3]);
    			add_location(div7, file$j, 52, 0, 2146);
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
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<ImageFullScreen> was created with unknown prop '${key}'`);
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

    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {
    			image: 0,
    			backUrl: 1,
    			imageRatioContain: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageFullScreen",
    			options,
    			id: create_fragment$l.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[0] === undefined && !("image" in props)) {
    			console_1$3.warn("<ImageFullScreen> was created without expected prop 'image'");
    		}

    		if (/*backUrl*/ ctx[1] === undefined && !("backUrl" in props)) {
    			console_1$3.warn("<ImageFullScreen> was created without expected prop 'backUrl'");
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

    const { Object: Object_1, console: console_1$4 } = globals;
    const file$k = "src\\components\\ImageFullScreenSwipe.svelte";

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
    			add_location(div, file$k, 99, 4, 2776);
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

    function create_fragment$m(ctx) {
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
    			add_location(div, file$k, 97, 0, 2679);
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
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<ImageFullScreenSwipe> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageFullScreenSwipe",
    			options,
    			id: create_fragment$m.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
    			console_1$4.warn("<ImageFullScreenSwipe> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<ImageFullScreenSwipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<ImageFullScreenSwipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\HeaderTopBar.svelte generated by Svelte v3.20.1 */

    function create_fragment$n(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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

    function instance$n($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HeaderTopBar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("HeaderTopBar", $$slots, []);
    	return [];
    }

    class HeaderTopBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HeaderTopBar",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\components\ShareApiTest.svelte generated by Svelte v3.20.1 */

    const file$l = "src\\components\\ShareApiTest.svelte";

    function create_fragment$o(ctx) {
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
    			add_location(br0, file$l, 8, 2, 109);
    			add_location(br1, file$l, 9, 2, 118);
    			add_location(h2, file$l, 10, 2, 127);
    			attr_dev(input, "name", "media");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "size", "50");
    			attr_dev(input, "accept", "image/*");
    			add_location(input, file$l, 14, 6, 278);
    			add_location(label, file$l, 12, 4, 245);
    			add_location(br2, file$l, 16, 4, 357);
    			add_location(button, file$l, 17, 4, 368);
    			attr_dev(form, "method", "post");
    			attr_dev(form, "action", "/_share-target");
    			attr_dev(form, "enctype", "multipart/form-data");
    			add_location(form, file$l, 11, 2, 166);
    			add_location(div, file$l, 7, 0, 101);
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props) {
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
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShareApiTest",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\components\Contribution.svelte generated by Svelte v3.20.1 */

    const { console: console_1$5 } = globals;
    const file$m = "src\\components\\Contribution.svelte";

    // (64:6) <Label>
    function create_default_slot_1$8(ctx) {
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
    		id: create_default_slot_1$8.name,
    		type: "slot",
    		source: "(64:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (60:4) <Button        disabled={!$contributeForm.valid || factObj.fact.length == 0}        variant="raised"        class="formButton">
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
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(60:4) <Button        disabled={!$contributeForm.valid || factObj.fact.length == 0}        variant=\\\"raised\\\"        class=\\\"formButton\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
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
    				$$slots: { default: [create_default_slot$a] },
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
    			add_location(h1, file$m, 45, 2, 1329);
    			attr_dev(label0, "for", "contributor");
    			add_location(label0, file$m, 49, 6, 1426);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "contributor");
    			add_location(input, file$m, 50, 6, 1478);
    			add_location(div0, file$m, 48, 4, 1413);
    			add_location(br, file$m, 52, 4, 1569);
    			attr_dev(label1, "for", "fact");
    			add_location(label1, file$m, 54, 6, 1594);
    			attr_dev(textarea, "name", "fact");
    			attr_dev(textarea, "cols", "40");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$m, 55, 6, 1632);
    			add_location(div1, file$m, 53, 4, 1581);
    			attr_dev(form_1, "class", "lurinForm");
    			add_location(form_1, file$m, 46, 2, 1352);
    			attr_dev(div2, "class", "contentpadding");
    			add_location(div2, file$m, 44, 0, 1297);
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
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<Contribution> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contribution",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\components\ManageContribution.svelte generated by Svelte v3.20.1 */
    const file$n = "src\\components\\ManageContribution.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (51:4) {#each facts as fact}
    function create_each_block$4(ctx) {
    	let li;
    	let t;
    	let current;

    	const fact = new Fact({
    			props: {
    				fact: /*fact*/ ctx[2],
    				hasDeleteButton: /*loggedIn*/ ctx[1],
    				hasAcceptButton: /*loggedIn*/ ctx[1],
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
    			add_location(li, file$n, 51, 6, 1678);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(fact, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fact_changes = {};
    			if (dirty & /*facts*/ 1) fact_changes.fact = /*fact*/ ctx[2];
    			if (dirty & /*loggedIn*/ 2) fact_changes.hasDeleteButton = /*loggedIn*/ ctx[1];
    			if (dirty & /*loggedIn*/ 2) fact_changes.hasAcceptButton = /*loggedIn*/ ctx[1];
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
    		source: "(51:4) {#each facts as fact}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let ul;
    	let current;
    	let each_value = /*facts*/ ctx[0];
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

    			add_location(h1, file$n, 48, 2, 1592);
    			attr_dev(ul, "class", "list svelte-lraaez");
    			add_location(ul, file$n, 49, 2, 1626);
    			attr_dev(div, "class", "contentpadding");
    			add_location(div, file$n, 47, 0, 1560);
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
    			if (dirty & /*facts, loggedIn, onDeleteFactProposal, onAcceptFactProposal*/ 3) {
    				each_value = /*facts*/ ctx[0];
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
    		id: create_fragment$q.name,
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

    function instance$q($$self, $$props, $$invalidate) {
    	let facts = [];

    	onMount(async function () {
    		$$invalidate(0, facts = await getFactsProposals());
    	});

    	let loggedIn = false;

    	userStore.subscribe(user => {
    		$$invalidate(1, loggedIn = user.loggedIn);
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
    		onMount,
    		facts,
    		loggedIn,
    		onDeleteFactProposal,
    		onAcceptFactProposal
    	});

    	$$self.$inject_state = $$props => {
    		if ("facts" in $$props) $$invalidate(0, facts = $$props.facts);
    		if ("loggedIn" in $$props) $$invalidate(1, loggedIn = $$props.loggedIn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [facts, loggedIn];
    }

    class ManageContribution extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ManageContribution",
    			options,
    			id: create_fragment$q.name
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
    var cssClasses$3 = {
        CLOSING: 'mdc-snackbar--closing',
        OPEN: 'mdc-snackbar--open',
        OPENING: 'mdc-snackbar--opening',
    };
    var strings$5 = {
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
    var numbers$2 = {
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
    var ARIA_LIVE_DELAY_MS = numbers$2.ARIA_LIVE_DELAY_MS;
    var ARIA_LIVE_LABEL_TEXT_ATTR = strings$5.ARIA_LIVE_LABEL_TEXT_ATTR;
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
    var OPENING = cssClasses$3.OPENING, OPEN = cssClasses$3.OPEN, CLOSING = cssClasses$3.CLOSING;
    var REASON_ACTION = strings$5.REASON_ACTION, REASON_DISMISS = strings$5.REASON_DISMISS;
    var MDCSnackbarFoundation = /** @class */ (function (_super) {
        __extends(MDCSnackbarFoundation, _super);
        function MDCSnackbarFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCSnackbarFoundation.defaultAdapter, adapter)) || this;
            _this.isOpen_ = false;
            _this.animationFrame_ = 0;
            _this.animationTimer_ = 0;
            _this.autoDismissTimer_ = 0;
            _this.autoDismissTimeoutMs_ = numbers$2.DEFAULT_AUTO_DISMISS_TIMEOUT_MS;
            _this.closeOnEscape_ = true;
            return _this;
        }
        Object.defineProperty(MDCSnackbarFoundation, "cssClasses", {
            get: function () {
                return cssClasses$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbarFoundation, "strings", {
            get: function () {
                return strings$5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSnackbarFoundation, "numbers", {
            get: function () {
                return numbers$2;
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
                }, numbers$2.SNACKBAR_ANIMATION_OPEN_TIME_MS);
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
            this.adapter_.addClass(cssClasses$3.CLOSING);
            this.adapter_.removeClass(cssClasses$3.OPEN);
            this.adapter_.removeClass(cssClasses$3.OPENING);
            clearTimeout(this.animationTimer_);
            this.animationTimer_ = setTimeout(function () {
                _this.handleAnimationTimerEnd_();
                _this.adapter_.notifyClosed(reason);
            }, numbers$2.SNACKBAR_ANIMATION_CLOSE_TIME_MS);
        };
        MDCSnackbarFoundation.prototype.isOpen = function () {
            return this.isOpen_;
        };
        MDCSnackbarFoundation.prototype.getTimeoutMs = function () {
            return this.autoDismissTimeoutMs_;
        };
        MDCSnackbarFoundation.prototype.setTimeoutMs = function (timeoutMs) {
            // Use shorter variable names to make the code more readable
            var minValue = numbers$2.MIN_AUTO_DISMISS_TIMEOUT_MS;
            var maxValue = numbers$2.MAX_AUTO_DISMISS_TIMEOUT_MS;
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
            this.adapter_.removeClass(cssClasses$3.OPENING);
            this.adapter_.removeClass(cssClasses$3.CLOSING);
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
    var SURFACE_SELECTOR = strings$5.SURFACE_SELECTOR, LABEL_SELECTOR = strings$5.LABEL_SELECTOR, ACTION_SELECTOR = strings$5.ACTION_SELECTOR, DISMISS_SELECTOR = strings$5.DISMISS_SELECTOR, OPENING_EVENT = strings$5.OPENING_EVENT, OPENED_EVENT = strings$5.OPENED_EVENT, CLOSING_EVENT = strings$5.CLOSING_EVENT, CLOSED_EVENT = strings$5.CLOSED_EVENT;
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

    /* node_modules\@smui\snackbar\Snackbar.svelte generated by Svelte v3.20.1 */
    const file$o = "node_modules\\@smui\\snackbar\\Snackbar.svelte";

    function create_fragment$r(ctx) {
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
    			add_location(div0, file$o, 13, 2, 340);
    			set_attributes(div1, div1_data);
    			add_location(div1, file$o, 0, 0, 0);
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
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    let waiting = Promise.resolve();

    function instance$r($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {
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
    			id: create_fragment$r.name
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
    function create_if_block$9(ctx) {
    	let current;

    	const snackbar_spread_levels = [
    		{ labelText: /*config*/ ctx[1].label },
    		/*config*/ ctx[1] && /*config*/ ctx[1].props || {},
    		prefixFilter(/*$$props*/ ctx[3], "snackbar$")
    	];

    	let snackbar_props = {
    		$$slots: { default: [create_default_slot$b] },
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
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(1:0) {#if config}",
    		ctx
    	});

    	return block;
    }

    // (12:4) {#if config.actions || config.dismissButton}
    function create_if_block_1$3(ctx) {
    	let current;

    	const actions = new Actions$1({
    			props: {
    				$$slots: { default: [create_default_slot_1$9] },
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
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(12:4) {#if config.actions || config.dismissButton}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if config.actions}
    function create_if_block_3$1(ctx) {
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(14:8) {#if config.actions}",
    		ctx
    	});

    	return block;
    }

    // (16:12) <Button               on:click={e => action.onClick && action.onClick(e)}               {...prefixFilter($$props, 'action$')}             >
    function create_default_slot_3$6(ctx) {
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
    		id: create_default_slot_3$6.name,
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
    		$$slots: { default: [create_default_slot_3$6] },
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
    function create_if_block_2$1(ctx) {
    	let current;

    	const iconbutton_spread_levels = [
    		{
    			title: /*config*/ ctx[1].dismissTitle || "Dismiss"
    		},
    		prefixFilter(/*$$props*/ ctx[3], "dismiss$")
    	];

    	let iconbutton_props = {
    		$$slots: { default: [create_default_slot_2$6] },
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(22:8) {#if config.dismissButton}",
    		ctx
    	});

    	return block;
    }

    // (23:10) <IconButton             on:click={e => config.onDismiss && config.onDismiss(e)}             title="{config.dismissTitle || 'Dismiss'}"             {...prefixFilter($$props, 'dismiss$')}           >
    function create_default_slot_2$6(ctx) {
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
    		id: create_default_slot_2$6.name,
    		type: "slot",
    		source: "(23:10) <IconButton             on:click={e => config.onDismiss && config.onDismiss(e)}             title=\\\"{config.dismissTitle || 'Dismiss'}\\\"             {...prefixFilter($$props, 'dismiss$')}           >",
    		ctx
    	});

    	return block;
    }

    // (13:6) <Actions>
    function create_default_slot_1$9(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*config*/ ctx[1].actions && create_if_block_3$1(ctx);
    	let if_block1 = /*config*/ ctx[1].dismissButton && create_if_block_2$1(ctx);

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
    					if_block0 = create_if_block_3$1(ctx);
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
    					if_block1 = create_if_block_2$1(ctx);
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
    		id: create_default_slot_1$9.name,
    		type: "slot",
    		source: "(13:6) <Actions>",
    		ctx
    	});

    	return block;
    }

    // (2:2) <Snackbar     bind:this={component}     on:MDCSnackbar:closed={handleClosed}     labelText={config.label}     {...(config && config.props || {})}     {...prefixFilter($$props, 'snackbar$')}   >
    function create_default_slot$b(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;
    	const label_spread_levels = [prefixFilter(/*$$props*/ ctx[3], "label$")];
    	let label_props = {};

    	for (let i = 0; i < label_spread_levels.length; i += 1) {
    		label_props = assign(label_props, label_spread_levels[i]);
    	}

    	const label = new Label({ props: label_props, $$inline: true });
    	let if_block = (/*config*/ ctx[1].actions || /*config*/ ctx[1].dismissButton) && create_if_block_1$3(ctx);

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
    					if_block = create_if_block_1$3(ctx);
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
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(2:2) <Snackbar     bind:this={component}     on:MDCSnackbar:closed={handleClosed}     labelText={config.label}     {...(config && config.props || {})}     {...prefixFilter($$props, 'snackbar$')}   >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*config*/ ctx[1] && create_if_block$9(ctx);

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
    					if_block = create_if_block$9(ctx);
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, { push: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kitchen",
    			options,
    			id: create_fragment$s.name
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
    function create_default_slot$c(ctx) {
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
    		id: create_default_slot$c.name,
    		type: "slot",
    		source: "(53:0) <Snackbar bind:this={mySnackbar} labelText={mySnackbarText}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let t;
    	let current;

    	let snackbar_props = {
    		labelText: /*mySnackbarText*/ ctx[2],
    		$$slots: { default: [create_default_slot$c] },
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
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.20.1 */
    const file$p = "src\\App.svelte";

    function create_fragment$u(ctx) {
    	let t0;
    	let main;
    	let main_style_value;
    	let t1;
    	let current;
    	const fullscreenmenu = new FullScreenMenu({ $$inline: true });
    	fullscreenmenu.$on("message", /*menuOpen*/ ctx[3]);
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
    			create_component(fullscreenmenu.$$.fragment);
    			t0 = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t1 = space();
    			create_component(notification.$$.fragment);
    			attr_dev(main, "class", "mainContainer");
    			attr_dev(main, "style", main_style_value = /*menuOpened*/ ctx[2] ? "display:none" : "");
    			add_location(main, file$p, 67, 0, 2398);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(fullscreenmenu, target, anchor);
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

    			if (!current || dirty & /*menuOpened*/ 4 && main_style_value !== (main_style_value = /*menuOpened*/ ctx[2] ? "display:none" : "")) {
    				attr_dev(main, "style", main_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fullscreenmenu.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fullscreenmenu.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fullscreenmenu, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    			if (detaching) detach_dev(t1);
    			destroy_component(notification, detaching);
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
    	let menuOpened = false;

    	function menuOpen() {
    		$$invalidate(2, menuOpened = !menuOpened);
    	}

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
    		Login,
    		FullScreenMenu,
    		ImageFullScreenSwipe,
    		HeaderTopBar,
    		ShareApiTest,
    		Contribution,
    		ManageContribution,
    		Notification: Notification$1,
    		router: page_js,
    		page,
    		params,
    		menuOpened,
    		menuOpen
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("menuOpened" in $$props) $$invalidate(2, menuOpened = $$props.menuOpened);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, params, menuOpened, menuOpen];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    //import "./main.pcss";

    const app = new App({
      target: document.body,
    });

}());
//# sourceMappingURL=main.js.map
