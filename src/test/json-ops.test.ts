const assert: typeof import('assert') = require('assert');
const ops: typeof import('../json-ops') = require('../json-ops');
const { suite, test } = require('mocha') as typeof import('mocha');

suite('json-ops', () => {
	suite('prettify', () => {
		test('formats object with indentation', () => {
			assert.strictEqual(ops.prettify('{"b":1,"a":2}'), '{\n    "b": 1,\n    "a": 2\n}');
		});

		test('formats nested arrays and objects', () => {
			assert.strictEqual(ops.prettify('{"a":[1,{"b":true}]}'), '{\n    "a": [\n        1,\n        {\n            "b": true\n        }\n    ]\n}');
		});

		test('formats primitive null', () => {
			assert.strictEqual(ops.prettify('null'), 'null');
		});

		test('throws for invalid json', () => {
			assert.throws(() => ops.prettify('{]'));
		});
	});

	suite('minify', () => {
		test('minifies object json', () => {
			assert.strictEqual(ops.minify('{\n  "a": 1,\n  "b": 2\n}'), '{"a":1,"b":2}');
		});

		test('minifies nested array json', () => {
			assert.strictEqual(ops.minify('[1, { "b": [true, null] }]'), '[1,{"b":[true,null]}]');
		});

		test('minifies empty array', () => {
			assert.strictEqual(ops.minify('[]'), '[]');
		});

		test('throws for invalid json', () => {
			assert.throws(() => ops.minify('nope'));
		});
	});

	suite('escape', () => {
		test('escapes object json without outer quotes', () => {
			assert.strictEqual(ops.escape('{"a":1}'), '{\\"a\\":1}');
		});

		test('escapes newline, quotes, and chinese characters', () => {
			assert.strictEqual(ops.escape('{"text":"line1\\n\\"hi\\"中文"}'), '{\\"text\\":\\"line1\\\\n\\\\\\"hi\\\\\\"中文\\"}');
		});

		test('escapes arrays', () => {
			assert.strictEqual(ops.escape('[{"a":1}]'), '[{\\"a\\":1}]');
		});

		test('throws for invalid json', () => {
			assert.throws(() => ops.escape('{"a":'));
		});
	});

	suite('unescape', () => {
		test('unescapes quoted escaped object string', () => {
			assert.strictEqual(ops.unescape('"{\\"a\\":1}"'), '{"a":1}');
		});

		test('unescapes bare object content by wrapping first', () => {
			assert.strictEqual(ops.unescape('{\\"a\\":1}'), '{"a":1}');
		});

		test('unescapes bare array content by wrapping first', () => {
			assert.strictEqual(ops.unescape('[{\\"a\\":1}]'), '[{"a":1}]');
		});

		test('preserves newline and unicode content', () => {
			assert.strictEqual(ops.unescape('"{\\"text\\":\\"line1\\\\n中文\\"}"'), '{"text":"line1\\n中文"}');
		});

		test('throws when parsed value is not a string', () => {
			assert.throws(() => ops.unescape('123'), /Unescaped value is not a string/);
		});

		test('throws for invalid json string literal', () => {
			assert.throws(() => ops.unescape('not-json'));
		});
	});

	suite('jsonToUnicode', () => {
		test('converts chinese characters', () => {
			assert.strictEqual(ops.jsonToUnicode('{"text":"中文"}'), '{"text":"\\u4e2d\\u6587"}');
		});

		test('converts emoji surrogate pairs', () => {
			assert.strictEqual(ops.jsonToUnicode('{"face":"😀"}'), '{"face":"\\ud83d\\ude00"}');
		});

		test('keeps ascii unchanged', () => {
			assert.strictEqual(ops.jsonToUnicode('{"text":"ascii"}'), '{"text":"ascii"}');
		});

		test('throws for invalid json', () => {
			assert.throws(() => ops.jsonToUnicode('{'));
		});
	});

	suite('unicodeFromJson', () => {
		test('restores chinese text', () => {
			assert.strictEqual(ops.unicodeFromJson('{"text":"\\u4e2d\\u6587"}'), '{"text":"中文"}');
		});

		test('restores emoji text', () => {
			assert.strictEqual(ops.unicodeFromJson('{"face":"\\ud83d\\ude00"}'), '{"face":"😀"}');
		});

		test('keeps ascii json stable', () => {
			assert.strictEqual(ops.unicodeFromJson('{"a":1}'), '{"a":1}');
		});

		test('throws for invalid json', () => {
			assert.throws(() => ops.unicodeFromJson('bad'));
		});
	});

	suite('sortByKey', () => {
		test('sorts flat object keys', () => {
			assert.strictEqual(ops.sortByKey('{"b":1,"a":2}'), '{\n    "a": 2,\n    "b": 1\n}');
		});

		test('sorts nested object keys recursively', () => {
			assert.strictEqual(
				ops.sortByKey('{"b":{"d":1,"c":2},"a":0}'),
				'{\n    "a": 0,\n    "b": {\n        "c": 2,\n        "d": 1\n    }\n}',
			);
		});

		test('sorts objects inside arrays without reordering array items', () => {
			assert.strictEqual(
				ops.sortByKey('[{"b":1,"a":2},{"d":4,"c":3}]'),
				'[\n    {\n        "a": 2,\n        "b": 1\n    },\n    {\n        "c": 3,\n        "d": 4\n    }\n]',
			);
		});

		test('is stable for already sorted input', () => {
			assert.strictEqual(ops.sortByKey('{"a":1,"b":2}'), '{\n    "a": 1,\n    "b": 2\n}');
		});

		test('throws for invalid json', () => {
			assert.throws(() => ops.sortByKey('{]'));
		});
	});

	suite('isValidJson', () => {
		test('returns true for object json', () => {
			assert.strictEqual(ops.isValidJson('{"a":1}'), true);
		});

		test('returns true for array json', () => {
			assert.strictEqual(ops.isValidJson('[1,2,3]'), true);
		});

		test('returns true for primitive json', () => {
			assert.strictEqual(ops.isValidJson('null'), true);
		});

		test('returns false for invalid json', () => {
			assert.strictEqual(ops.isValidJson('{]'), false);
		});
	});

	suite('wrapIfBareObject', () => {
		test('wraps bare object text', () => {
			assert.strictEqual(ops.wrapIfBareObject('{"a":1}'), '"{"a":1}"');
		});

		test('wraps bare array text', () => {
			assert.strictEqual(ops.wrapIfBareObject('[1,2]'), '"[1,2]"');
		});

		test('leaves quoted string alone', () => {
			assert.strictEqual(ops.wrapIfBareObject('"abc"'), '"abc"');
		});

		test('does not wrap mismatched braces', () => {
			assert.strictEqual(ops.wrapIfBareObject('{"a":1]'), '{"a":1]');
		});

		test('does not wrap numeric text', () => {
			assert.strictEqual(ops.wrapIfBareObject('123'), '123');
		});
	});

	suite('stripOuterQuotes', () => {
		test('strips matching outer quotes', () => {
			assert.strictEqual(ops.stripOuterQuotes('"abc"'), 'abc');
		});

		test('leaves unquoted input alone', () => {
			assert.strictEqual(ops.stripOuterQuotes('abc'), 'abc');
		});

		test('leaves empty string alone', () => {
			assert.strictEqual(ops.stripOuterQuotes(''), '');
		});

		test('strips single character string', () => {
			assert.strictEqual(ops.stripOuterQuotes('"a"'), 'a');
		});
	});
});
