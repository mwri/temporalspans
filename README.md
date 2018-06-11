# temporalspans [![Build Status](https://travis-ci.org/mwri/temporalspans.svg?branch=master)](https://travis-ci.org/mwri/temporalspans) [![Coverage Status](https://coveralls.io/repos/github/mwri/temporalspans/badge.svg?branch=master)](https://coveralls.io/github/mwri/temporalspans?branch=master)

## Quick start

Temporal spams is a library for building, manipulating and deriving the
state of a collection, very like [temporalstate](https://github.com/mwri/temporalstate)
(and using it as a back end), but providing a slightly higher level
abstraction of 'spans', meaning instead of the fundamental unit one
is dealing with being a 'change', it is instead a 'span', a 'change'
occurs at a point in time, but a 'span' has a from and to time. Like
[temporalstate](https://github.com/mwri/temporalstate) it is possible
to derive the value of variables at any given time, but that derivation
is based on a foundation where the value of all variables is null except
during a 'span', when the value of the span takes precedence. This also
means there is never any case of a value (other than null).

In addition, all spans have unique IDs assigned when they are created
and events emitted always feature these IDs, which means that the
complexity for maintaining a GUI based on the data is vastly reduced
as all events are concerned with a particular persistent feature (a
span), where as the more complicated 'change' abstraction might, so
that changes and data is parsimonious, mean that some changes result
in no events, while others result in multiple events! The big picture
is easily lost or difficult to reassert in such cases.

Take the following example:

```javascript
import temporalspans from 'temporalspans';

let db = new temporalspans();

db.add({'from': 5, 'to': 15, 'name': 'weather', 'val': 'raining'});
db.add({'from': 20, 'to': 30, 'name': 'weather', 'val': 'sunny'});
db.add({'from': 40, 'to': 55, 'name': 'weather', 'val': 'foggy'});
db.add({'from': 3, 'to': 7, 'name': 'moon', 'val': 'crescent'});
db.add({'from': 25, 'to': 35, 'name': 'moon', 'val': 'full'});
db.add({'from': 35, 'to': 42, 'name': 'moon', 'val': 'super'});
db.add({'from': 12, 'to': 15, 'name': 'sun', 'val': 'rising'});
db.add({'from': 27, 'to': 33, 'name': 'sun', 'val': 'setting'});
```

It doesn't matter what order the spans are added, as long as they are legal
(not overlapping), the resultant state will be the same.

The state of a single variable at any time can be queried by calling `state()`
with two arguments:

```javascript
db.state(0, 'moon') == null
db.state(2, 'moon') == null
db.state(3, 'moon') == 'crescent'
db.state(4, 'moon') == 'crescent'
db.state(34, 'moon') == 'full'
db.state(35, 'moon') == 'super'
db.state(40, 'moon') == 'super'
db.state(100, 'moon') == null
```

The state of all variables at any time can be queried by calling `state()`
with a single argument:

```javascript
db.state(0) == {}
db.state(10) == { weather: 'raining' }
db.state(20) == { weather: 'sunny' }
db.state(30) == { moon: 'full', sun: 'setting' }
db.state(40) == { weather: 'foggy', moon: 'super' }
db.state(100) == { }
```

You can also list all the spans by calling `list()`:

```javascript
db.list() === [
    {'from': 5, 'to': 15, 'name': 'weather', 'val': 'raining', 'id': '8027d1e2-8ef2-428a-80e3-d9dbe29d8b7b'},
    {'from': 20, 'to': 30, 'name': 'weather', 'val': 'sunny', 'id': '0deee24d-ae8f-401b-9965-f5e1b456a487'},
    {'from': 40, 'to': 55, 'name': 'weather', 'val': 'foggy', 'id': 'e12ba0eb-a83c-47a5-99c9-e6b652193ac5'},
    {'from': 3, 'to': 7, 'name': 'moon', 'val': 'crescent', 'id': 'be5496c8-b391-4fe1-b5b7-44158afc74b5'},
    {'from': 25, 'to': 35, 'name': 'moon', 'val': 'full', 'id': '98b4bb39-d56f-470d-87bb-6cb0c6e45506'},
    {'from': 35, 'to': 42, 'name': 'moon', 'val': 'super', 'id': '4ebfca5c-d7b8-4272-8e7b-06ee6e3d2ed2'},
    {'from': 12, 'to': 15, 'name': 'sun', 'val': 'rising', 'id': '144653ce-407f-48cb-9280-68577b370fff'},
    {'from': 27, 'to': 33, 'name': 'sun', 'val': 'setting', 'id': '8e34f173-2e73-45b7-8f13-15f34ab69f78'}
]
```

## Contents

1. [Quick start](#quick-start).
2. [Contents](#contents).
3. [Full API reference](#full-api-reference).
   1. [Functions](#functions).
      1. [constructor](#constructor).
      2. [id_lookup](#id_lookup).
      3. [list](#list).
      4. [add](#add).
      5. [remove](#remove).
      6. [vars](#vars).
      7. [remove_var](#remove_var).
      8. [state](#state).
      9. [state_detail](#state_detail).
     10. [modify](#modify).
     11. [cmp](#cmp).
   2. [Events](#events).
      1. [new_var](#new_var).
      2. [rm_var](#rm_var).
      3. [add](#add).
      4. [remove](#remove).
      5. [modify](#modify).
4. [Build](#build).

## Full API reference

Import the `temporalspans` constructor with import:

```javascript
import temporalspans from 'temporalspans';
```

Or with require:

```javascript
let temporalspans = require('temporalspans').default;
```

### Functions

#### constructor

Constructs a `temporalspans` object.

```javascript
let db = new temporalspans();
```

NOTE in the examples of this documentation, simple scalar values
are employed; strings such as `'raining'` and `'super'`. There is
nothing to stop you from using complex structures instead EXCEPT
that `temporalspans` needs to know how to determine their
equality! So, if you use complex structures you must provide
an equality checking function, like this:

```javascript
let db = new temporalspans({
    'valeqf': function (a, b) {
        // return true if the values are equal, otherwise false
        return JSON.stringify(a) === JSON.stringify(b);
    }
});
```

This one is a bit of a get out of jail free card because it is
highly likely to work for almost any structure you employ. Use
this if it is appropriate, but an equality function more
specific to your data might be more efficient (for example the
function `function (a, b) { return a.complex === b.complex; }`
is used in the unit tests), if that is possible.

### id_lookup

Lookup a span from its ID. For example:

```javascript
let span = db.id_lookup('316e4ca0-db55-48b2-a5ec-720f61c9ea8d');
```

#### list

Returns the set of all known spans.

```javascript
let spans = db.list();
```

#### add

Adds a span.

A single object parameter with 'from', 'to', 'name' and 'val' keys
is required, these being the start and end times of the span, the
name of the variable changing and the value it takes during the span.

```javascript
let span1 = db.add({'from': 20, 'to': 40, 'name': 'weather', 'val': 'sunny'});
let span2 = db.add({'from': 40, 'to': 60, 'name': 'weather', 'val': 'foggy'});
```

#### remove

Removes a span. Takes the span returned by add() as a parameter.

```javascript
db.remove(span);
```

#### vars

Returns a list of known variables. This will include variables
without states, if there are any. The result is sorted.

```javascript
let vars = db.vars();
```

Here, `vars` will be a list of variable names, like this:

```javascript
[
  'moon',
  'sun',
  'weather',
]
```

#### remove_var

When removing a span (explicitly or implicitly), if it is the last
remaining span in the database, though there will be no spans
for that variable any more, the variable will still exist; calling
`var_list()` will list it.

If it is desirable to get rid of it entirely, call `remove_var`
and provide the variable name as a parameter. For example:

```javascript
db.remove_var('weather');
```

If a variable is removed `true` is returned, or else `false`.

A variable is not removed if it does not exist, or if it has
spans (i.e. it must be unused).

#### state

Returns the state at any given time. Takes either one or two
arguments, the first, compulsory parameter, is the time, and
the second is the name of a state. If no state name is given
then all states will be returned as an object, with the keys
being state names and the values being the state values.
Where a state name is given the return value will be the
states value, or null if it does not have a value at that
time.

With a single argument:

```javascript
all_states_at_20_time = db.state(20);
```

Here `all_states_at_20_time` will contain something like this:

```javascript
{ weather: 'sunny', moon: 'crescent', sun: null }
```

With a second argument:

```javascript
weather_at_20_time = db.state(20, 'weather');
```

Here `weather_at_20_time` will contain something like this:

```javascript
'sunny'
```

#### state_detail

State detail, like [state](#state) takes one or two arguments, the
time, and optionally a variable name. It also similarly returns
state data, but instead of just the state values at the specified
time it returns current and next span data.

The return value when a second argument (state name) is passed
is of the form `{'current': current_span, 'next': next_span}`.
If a span is prevailing at the requested time then `current_span`
will be set to that span and `next_span` will be null. If a span
is not prevailing then `current_span` will be `null` and
`next_span` will be the next span (unless there are no more, in
which case it will also be `null`).

If no variable name second argument is specified, the return value
is an object with a key for each variable name, and each value will
be an object of the form `{'current': current_span, 'next': next_span}`
as above.

#### modify

The `from`, `to` or `val` of a span may be modified, as long as
the new changes do not cause the span to become illegal. Examples
of illegality would be a `to` before a `from`, or any overlapping
of other spans of the same name.

Two parameters must be given, the existing span, and the new
span:

```javascript
let new_span = db.modify(span, new_span);
```

If the modify is not allowed then `null` is returned.

#### cmp

This is a static function, not a class method, it takes two
arguments and provides the sort order for spans (as returned
by [list](#list)), by returning 1, 0 or -1, like all sort
element comparison functions.

The order of spans is determined first by the span `from`
value, then `to`, and `name`.

### Events

Events are emitted before changes actually takes effect.

#### new_var

The **new_var** event is emitted when a new variable is realised.
Adding an span with a variable name not seen before will cause
this.

```javascript
db.on('new_var', (name) => {
    console.log('added "'+name+'", not seen before');
});
```

#### rm_var

The **rm_var** event is emitted when a new variable is removed.
This can only happen as a result of a call to `remove_var`.

```javascript
db.on('rm_var', (name) => {
    console.log('removed "'+name+'" variable');
});
```

#### add

The **add** event is emitted when a span is added to the database.

```javascript
db.on('add', (span) => {
    console.log('added a span (at '+span.from+' to '+span.to', '+span.name+' = '+span.val+')');
});
```

#### remove

The **remove** event is emitted when a span is eliminated from the
database.

```javascript
db.on('remove', (span) => {
    console.log('removed a span (at '+span.from+' to '+span.to+', '+span.name+' = '+span.val+')');
});
```

#### modify

The **modify** event is emitted when a span is modified by calling
[modify](#modify).

```javascript
db.on('modify', (span, new_span) => {
    console.log('changed', span, 'to', new_span);
});
```

## Build

run `npm install` to install the dependencies, and `grunt build` to
build (or `./node_modules/.bin/grunt build` if you do not have
grunt, grunt CLI locally installed.

This will run code checkers and linters and the test suite, report on
coverage and build build `dist/temporalspans_es5.js`, an ES5 babel
transpile of the ES6 source.

Running `grunt watch:build` will watch for changes to the source or
tests and invoke the full build cycle when they are detected. Running
`grunt watch:test` will again watch for changes, and invoke the most
light weight possible file test cycle.

Note that in the event of stack traces being output during the full
build, with coverage reports, the stack trace line numbers will be
broken. Run `test` or `watch:test` for valid stack traces instead
of `build`.
