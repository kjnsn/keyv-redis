'use strict';

const EventEmitter = require('events').EventEmitter;
const redis = require('redis');
const pify = require('pify');

class KeyvRedis extends EventEmitter {
	constructor(opts) {
		super();
		this.ttlSupport = true;
		if (opts && opts.uri) {
			opts = Object.assign({}, { url: opts.uri }, opts);
		}
		const client = redis.createClient(opts);
		client.on('error', err => this.emit('error', err));
		this.redis = ['get', 'set', 'del', 'flushdb'].reduce((obj, method) => {
			obj[method] = pify(client[method].bind(client));
			return obj;
		}, {});
	}

	get(key) {
		return this.redis.get(key)
			.then(value => {
				if (value === null) {
					return undefined;
				}
				return JSON.parse(value);
			});
	}

	set(key, value, ttl) {
		return Promise.resolve()
			.then(() => {
				value = JSON.stringify(value);
				if (typeof ttl === 'number') {
					return this.redis.set(key, value, 'PX', ttl);
				}
				return this.redis.set(key, value);
			});
	}

	delete(key) {
		return this.redis.del(key)
			.then(items => items > 0);
	}

	clear() {
		return this.redis.flushdb()
			.then(() => undefined);
	}
}

module.exports = KeyvRedis;
