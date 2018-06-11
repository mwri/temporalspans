import chai_jasmine from 'chai-jasmine';
import temporalspans from './../lib/temporalspans.js';


describe('temporalspans', () => {

    describe('static', () => {

        describe('cmp', () => {

            (function (test_formats) {
                for (let test_format in test_formats) {
                    let format_convert_f = test_formats[test_format];
                    describe('time as '+test_format, () => {
                        (function (tests) {
                            for (let test_descr in tests) {
                                let test = tests[test_descr];
                                let a = test.a;
                                let b = test.b;
                                if (a.from === b.from) {
                                    a.from = format_convert_f(a.from);
                                    b.from = a.from;
                                } else {
                                    a.from = format_convert_f(a.from);
                                    b.from = format_convert_f(b.from);
                                }
                                if (a.to === b.to) {
                                    a.to = format_convert_f(a.to);
                                    b.to = a.to;
                                } else {
                                    a.to = format_convert_f(a.to);
                                    b.to = format_convert_f(b.to);
                                }
                                let a_descr = '{from:'+a.from+',to:a.to,name:'+a.name+',val:'+a.val+'}';
                                let b_descr = '{from:'+b.from+',to:b.to,name:'+b.name+',val:'+b.val+'}';
                                test_descr = test.d
                                    .replace('${a}', a_descr)
                                    .replace('${b}', b_descr)
                                    .replace(/ /g, '');
                                it(test_descr, function () {
                                    expect(test.f(temporalspans.cmp(a, b))).toBe(true);
                                });
                            }
                        })({
                            'sort (a, b) = 0 when from a = b, to a = b, name a = b': {
                                'a': {'from': 10, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'b': {'from': 10, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'f': (r) => r === 0,
                                'd': 'sort(${a},${b}) = 0',
                            },
                            'sort (a, b) < 0 when from a < b, to a = b, name a = b': {
                                'a': {'from': 9, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'b': {'from': 10, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'f': (r) => r < 0,
                                'd': 'sort(${a},${b}) < 0',
                            },
                            'sort (a, b) > 0 when from a > b, to a = b, name a = b': {
                                'a': {'from': 10, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'b': {'from': 9, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'f': (r) => r > 0,
                                'd': 'sort(${a},${b}) > 0',
                            },
                            'sort (a, b) < 0 when from a = b, to a < b, name a = b': {
                                'a': {'from': 10, 'to': 19, 'name': 'nd', 'val': 'vd'},
                                'b': {'from': 10, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'f': (r) => r < 0,
                                'd': 'sort(${a},${b}) < 0',
                            },
                            'sort (a, b) > 0 when from a = b, to a > b, name a = b': {
                                'a': {'from': 10, 'to': 21, 'name': 'nd', 'val': 'vd'},
                                'b': {'from': 10, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'f': (r) => r > 0,
                                'd': 'sort(${a},${b}) > 0',
                            },

                            'sort (a, b) = 0 when from a = b, to a = b, name a < b': {
                                'a': {'from': 10, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'b': {'from': 10, 'to': 20, 'name': 'ne', 'val': 'vd'},
                                'f': (r) => r < 0,
                                'd': 'sort(${a},${b}) < 0',
                            },
                            'sort (a, b) = 0 when from a = b, to a = b, name a > b': {
                                'a': {'from': 10, 'to': 20, 'name': 'ne', 'val': 'vd'},
                                'b': {'from': 10, 'to': 20, 'name': 'nd', 'val': 'vd'},
                                'f': (r) => r > 0,
                                'd': 'sort(${a},${b}) > 0',
                            },
                        });
                    });
                }
            })({
                'integer': (int_val) => {
                    return int_val;
                },
                'float': (int_val) => {
                    return int_val * Math.PI;
                },
                'string': (int_val) => {
                    return String.fromCharCode(97+int_val);
                },
                'Date()': (int_val) => {
                    let timedate = new Date();
                    timedate.setSeconds(timedate.getSeconds()+(int_val*10));
                    return timedate;
                },
            });

        });

    });

    describe('constructor', () => {

        it('does not fail (no param)', () => {
            let db = new temporalspans();
        });

        it('does not fail (empty params)', () => {
            let db = new temporalspans({});
        });

        it('does not fail (valeqf param)', () => {
            let db = new temporalspans({'valeqf': function() { return true; }});
        });

        describe('initial object state', () => {

            beforeEach(function () {
                this.db = new temporalspans();
            });

            it('has empty change list', function () {
                expect(this.db.list()).to.be.an('array').is.lengthOf(0);
            });

        });

    });

    describe('add', () => {

        beforeEach(function () {
            this.db = new temporalspans();
        });

        it('adds span to span list (end of list)', function () {
            let db = this.db;
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(0);
            db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'});
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(1)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}));
            db.add({'from': 30, 'to': 40, 'name': 'weather', 'val': 'sunny'});
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(2)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}))
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'weather', 'val': 'sunny'}));
            backend_integrity_check(db);
        });

        it('adds span to span list (start of list)', function () {
            let db = this.db;
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(0);
            db.add({'from': 30, 'to': 40, 'name': 'weather', 'val': 'sunny'});
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(1)
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'weather', 'val': 'sunny'}));
            db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'});
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(2)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}))
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'weather', 'val': 'sunny'}));
            backend_integrity_check(db);
        });

        it('does not add span to span list when it overlaps other spans', function () {
            let db = this.db;
            expect(db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}))
                .to.be.an('object');
            expect(db.add({'from': 30, 'to': 40, 'name': 'weather', 'val': 'sunny'}))
                .to.be.an('object');
            expect(db.add({'from': 5, 'to': 15, 'name': 'weather', 'val': 'foggy'}))
                .to.equal(null);
            expect(db.add({'from': 15, 'to': 25, 'name': 'weather', 'val': 'foggy'}))
                .to.equal(null);
            expect(db.add({'from': 5, 'to': 25, 'name': 'weather', 'val': 'foggy'}))
                .to.equal(null);
            expect(db.add({'from': 25, 'to': 35, 'name': 'weather', 'val': 'foggy'}))
                .to.equal(null);
            expect(db.add({'from': 15, 'to': 35, 'name': 'weather', 'val': 'foggy'}))
                .to.equal(null);
            expect(db.add({'from': 15, 'to': 45, 'name': 'weather', 'val': 'foggy'}))
                .to.equal(null);
            expect(db.add({'from': 35, 'to': 45, 'name': 'weather', 'val': 'foggy'}))
                .to.equal(null);
            expect(db.add({'from': 5, 'to': 45, 'name': 'weather', 'val': 'foggy'}))
                .to.equal(null);
            backend_integrity_check(db);
        });

        it('joins a span to another span seemlessly', function () {
            let db = this.db;
            expect(db.add({'from': 20, 'to': 30, 'name': 'weather', 'val': 'sunny'}))
                .to.be.an('object');
            expect(db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}))
                .to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(2)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}))
                .to.satisfy(has_matching_span.bind({'from': 20, 'to': 30, 'name': 'weather', 'val': 'sunny'}));
            backend_integrity_check(db);
        });

        it('joins a span from another span seemlessly', function () {

            let db = this.db;
            expect(db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}))
                .to.be.an('object');
            expect(db.add({'from': 20, 'to': 30, 'name': 'weather', 'val': 'sunny'}))
                .to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(2)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}))
                .to.satisfy(has_matching_span.bind({'from': 20, 'to': 30, 'name': 'weather', 'val': 'sunny'}));
            backend_integrity_check(db);
        });

    });

    describe('id_lookup', () => {

        beforeEach(function () {
            let db = new temporalspans();
            this.db = db;
            this.spans = [
                {'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'},
                {'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'},
                {'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'},
                {'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}
            ].map((s) => {
                return db.add(s);
            });
            backend_integrity_check(db);
        });

        it('returns span for id', function () {
            let db = this.db;
            expect(db.id_lookup(this.spans[0].id))
                .to.satisfy(is_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}));
            expect(db.id_lookup(this.spans[1].id))
                .to.satisfy(is_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}));
            expect(db.id_lookup(this.spans[2].id))
                .to.satisfy(is_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}));
            expect(db.id_lookup(this.spans[3].id))
                .to.satisfy(is_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
        });

    });

    describe('remove', () => {

        beforeEach(function () {
            let db = new temporalspans();
            this.db = db;
            this.spans = [
                {'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'},
                {'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'},
                {'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'},
                {'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}
            ].map((s) => {
                return db.add(s);
            });
            backend_integrity_check(db);
        });

        it('does not remove non existing spans', function () {
            let db = this.db;
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
            let span = this.spans[0];
            let bad_span = {'from': 11, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            db.remove(bad_span);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
            backend_integrity_check(db);
        });

        it('removes existing spans', function () {
            let db = this.db;
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
            db.remove(this.spans[0]);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(3)
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}))
                .to.satisfy(has_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}))
                .to.satisfy(has_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            db.remove(this.spans[2]);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(2)
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}))
                .to.satisfy(has_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            db.remove(this.spans[1]);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(1)
                .to.satisfy(has_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            backend_integrity_check(db);
        });

    });

    describe('modify', () => {

        beforeEach(function () {
            let db = new temporalspans();
            this.db = db;
            this.spans = [
                {'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'},
                {'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'},
                {'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'},
                {'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}
            ].map((s) => {
                return db.add(s);
            });
            backend_integrity_check(db);
        });

        it('returns null and does not change a span if the id is changed', function () {
            let db = this.db;
            let span = this.spans[0];
            let bad_span = {'from': span.from, 'to': span.to, 'name': span.name, 'val': span.val, 'id': 'evil'};
            expect(db.modify(span, bad_span)).to.equal(null);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
        });

        it('returns null and does not change a span if the name is changed', function () {
            let db = this.db;
            let span = this.spans[0];
            let bad_span = {'from': span.from, 'to': span.to, 'name': 'naughty', 'val': span.val, 'id': span.id};
            expect(db.modify(span, bad_span)).to.equal(null);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
        });

        it('returns null and does not change a span if to < from', function () {
            let db = this.db;
            let span = this.spans[0];
            let bad_span = {'from': span.from, 'to': 9, 'name': span.name, 'val': span.val, 'id': span.id};
            expect(db.modify(span, bad_span)).to.equal(null);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
        });

        it('returns null and does not change a span if from > to', function () {
            let db = this.db;
            let span = this.spans[0];
            let bad_span = {'from': 21, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            expect(db.modify(span, bad_span)).to.equal(null);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
        });

        it('returns null and does not change a span if from equals to', function () {
            let db = this.db;
            let span = this.spans[0];
            let bad_span = {'from': 20, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            expect(db.modify(span, bad_span)).to.equal(null);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
        });

        it('returns null and does not change a span if new boundaries would overlap other span(s)', function () {
            let db = this.db;
            let span = this.spans[0];
            let bad_span = {'from': span.from, 'to': 31, 'name': span.name, 'val': span.val, 'id': span.id};
            expect(db.modify(span, bad_span)).to.equal(null);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
            span = this.spans[1];
            bad_span = {'from': 19, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            expect(db.modify(span, bad_span)).to.equal(null);
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4);
        });

        it('changes and returns span when no resultant overlapping occurs', function () {
            let db = this.db;
            let span = this.spans[0];
            let mod_span = {'from': 8, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 8, 'to': 20, 'name': 'foo', 'val': 'fooval1'}));
            mod_span = {'from': mod_span.from, 'to': 25, 'name': span.name, 'val': span.val, 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 8, 'to': 25, 'name': 'foo', 'val': 'fooval1'}));

            span = this.spans[1];
            mod_span = {'from': 32, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 32, 'to': 40, 'name': 'foo', 'val': 'fooval2'}));
            mod_span = {'from': mod_span.from, 'to': 35, 'name': span.name, 'val': span.val, 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 8, 'to': 25, 'name': 'foo', 'val': 'fooval1'}))
                .to.satisfy(has_matching_span.bind({'from': 32, 'to': 35, 'name': 'foo', 'val': 'fooval2'}))
                .to.satisfy(has_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}))
                .to.satisfy(has_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            backend_integrity_check(db);
        });

        it('returns new span and changes span when to joins to next span', function () {
            let db = this.db;
            let span = this.spans[0];
            let mod_span = {'from': span.from, 'to': 30, 'name': span.name, 'val': span.val, 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 30, 'name': 'foo', 'val': 'fooval1'}))
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}))
                .to.satisfy(has_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}))
                .to.satisfy(has_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            backend_integrity_check(db);
        });

        it('returns new span and changes span when from joins to previous span', function () {
            let db = this.db;
            let span = this.spans[1];
            let mod_span = {'from': 20, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}))
                .to.satisfy(has_matching_span.bind({'from': 20, 'to': 40, 'name': 'foo', 'val': 'fooval2'}))
                .to.satisfy(has_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}))
                .to.satisfy(has_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            backend_integrity_check(db);
        });

        it('changes and returns span when adjusting to of last span', function () {
            let db = this.db;
            let span = this.spans[1];
            let mod_span = {'from': span.from, 'to': 50, 'name': span.name, 'val': span.val, 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 50, 'name': 'foo', 'val': 'fooval2'}));
            span = this.spans[3];
            mod_span = {'from': span.from, 'to': 60, 'name': span.name, 'val': span.val, 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}))
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 50, 'name': 'foo', 'val': 'fooval2'}))
                .to.satisfy(has_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}))
                .to.satisfy(has_matching_span.bind({'from': 35, 'to': 60, 'name': 'bar', 'val': 'barval2'}));
            backend_integrity_check(db);
        });

        it('changes and returns span when adjusting val', function () {
            let db = this.db;
            let span = this.spans[0];
            let mod_span = {'from': span.from, 'to': span.to, 'name': span.name, 'val': 'fooval3', 'id': span.id};
            span = db.modify(span, mod_span);
            expect(span).to.be.an('object');
            expect(db.list())
                .to.be.an('array')
                .is.lengthOf(4)
                .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval3'}))
                .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}))
                .to.satisfy(has_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}))
                .to.satisfy(has_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            backend_integrity_check(db);
        });

    });

    describe('state', () => {

        beforeEach(function () {
            let db = new temporalspans();
            this.db = db;
            this.spans = [
                {'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'},
                {'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'},
                {'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}
            ].map((s) => {
                return db.add(s);
            });
        });

        describe('without variable name', () => {

            it('returns set variable names and values', function () {
                let db = this.db;
                expect(Object.keys(db.state(2))).to.be.an('array').is.length(0);
                expect(db.state(10)).to.deep.equal({'foo': 'fooval1'});
                expect(db.state(30)).to.deep.equal({'foo': 'fooval2', 'bar': 'barval1'});
                expect(db.state(25)).to.deep.equal({'bar': 'barval1'});
            });

        });

        describe('with variable name', () => {

            it('returns the state of the variable', function () {
                let db = this.db;
                expect(db.state(2, 'foo')).to.equal(null);
                expect(db.state(10, 'foo')).to.equal('fooval1');
                expect(db.state(15, 'foo')).to.equal('fooval1');
                expect(db.state(20, 'foo')).to.equal(null);
                expect(db.state(25, 'foo')).to.equal(null);
                expect(db.state(35, 'foo')).to.equal('fooval2');
                expect(db.state(30, 'bar')).to.equal('barval1');
            });

        });

    });

    describe('state_detail', () => {

        beforeEach(function () {
            let db = new temporalspans();
            this.db = db;
            this.spans = [
                {'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'},
                {'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'},
                {'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'},
                {'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}
            ].map((s) => {
                return db.add(s);
            });
        });

        describe('with variable name', () => {

            it('returns {current: null} when outside span', function () {
                let db = this.db;
                let sd = db.state_detail(5, 'foo');
                expect(sd.current).to.equal(null);
                sd = db.state_detail(5, 'bar');
                expect(sd.current).to.equal(null);
                sd = db.state_detail(12, 'bar');
                expect(sd.current).to.equal(null);
                sd = db.state_detail(25, 'foo');
                expect(sd.current).to.equal(null);
                sd = db.state_detail(70, 'foo');
                expect(sd.current).to.equal(null);
                sd = db.state_detail(70, 'bar');
                expect(sd.current).to.equal(null);
                sd = db.state_detail(85, 'foo');
                expect(sd.current).to.equal(null);
                sd = db.state_detail(85, 'bar');
                expect(sd.current).to.equal(null);
            });

            it('returns {current: span} when inside span', function () {
                let db = this.db;
                let sd = db.state_detail(14, 'foo');
                expect(sd.current).to.satisfy(is_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}));
                sd = db.state_detail(15, 'foo');
                expect(sd.current).to.satisfy(is_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}));
                sd = db.state_detail(15, 'bar');
                expect(sd.current).to.satisfy(is_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}));
                sd = db.state_detail(35, 'foo');
                expect(sd.current).to.satisfy(is_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}));
                sd = db.state_detail(35, 'bar');
                expect(sd.current).to.satisfy(is_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
                sd = db.state_detail(69, 'bar');
                expect(sd.current).to.satisfy(is_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            });

            it('returns {next: span} when outside span', function () {
                let db = this.db;
                let sd = db.state_detail(5, 'foo');
                expect(sd.next).to.satisfy(is_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}));
                sd = db.state_detail(5, 'bar');
                expect(sd.next).to.satisfy(is_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}));
                sd = db.state_detail(12, 'bar');
                expect(sd.next).to.satisfy(is_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}));
                sd = db.state_detail(25, 'foo');
                expect(sd.next).to.satisfy(is_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}));
            });

            it('returns {next: null} when inside span', function () {
                let db = this.db;
                let sd = db.state_detail(14, 'foo');
                expect(sd.next).to.equal(null);
                sd = db.state_detail(15, 'foo');
                expect(sd.next).to.equal(null);
                sd = db.state_detail(15, 'bar');
                expect(sd.next).to.equal(null);
                sd = db.state_detail(35, 'foo');
                expect(sd.next).to.equal(null);
                sd = db.state_detail(35, 'bar');
                expect(sd.next).to.equal(null);
                sd = db.state_detail(69, 'bar');
                expect(sd.next).to.equal(null);
                sd = db.state_detail(70, 'foo');
                expect(sd.next).to.equal(null);
                sd = db.state_detail(70, 'bar');
                expect(sd.next).to.equal(null);
            });

        });

        describe('without variable name', () => {

            it('returns {current: null} when outside span', function () {
                let db = this.db;
                let sd = db.state_detail(5);
                expect(sd.foo.current).to.equal(null);
                expect(sd.bar.current).to.equal(null);
                sd = db.state_detail(12);
                expect(sd.bar.current).to.equal(null);
                sd = db.state_detail(25);
                expect(sd.foo.current).to.equal(null);
                sd = db.state_detail(70);
                expect(sd.foo.current).to.equal(null);
                expect(sd.bar.current).to.equal(null);
                sd = db.state_detail(85);
                expect(sd.foo.current).to.equal(null);
                expect(sd.bar.current).to.equal(null);
            });

            it('returns {current: span} when inside span', function () {
                let db = this.db;
                let sd = db.state_detail(14);
                expect(sd.foo.current).to.satisfy(is_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}));
                sd = db.state_detail(15);
                expect(sd.foo.current).to.satisfy(is_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}));
                expect(sd.bar.current).to.satisfy(is_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}));
                sd = db.state_detail(35);
                expect(sd.foo.current).to.satisfy(is_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}));
                expect(sd.bar.current).to.satisfy(is_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
                sd = db.state_detail(69);
                expect(sd.bar.current).to.satisfy(is_matching_span.bind({'from': 35, 'to': 70, 'name': 'bar', 'val': 'barval2'}));
            });

            it('returns {next: span} when outside span', function () {
                let db = this.db;
                let sd = db.state_detail(5);
                expect(sd.foo.next).to.satisfy(is_matching_span.bind({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'}));
                expect(sd.bar.next).to.satisfy(is_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}));
                sd = db.state_detail(12);
                expect(sd.bar.next).to.satisfy(is_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': 'barval1'}));
                sd = db.state_detail(25);
                expect(sd.foo.next).to.satisfy(is_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'}));
            });

            it('returns {next: null} when inside span', function () {
                let db = this.db;
                let sd = db.state_detail(14);
                expect(sd.foo.next).to.equal(null);
                sd = db.state_detail(15);
                expect(sd.foo.next).to.equal(null);
                expect(sd.bar.next).to.equal(null);
                sd = db.state_detail(35);
                expect(sd.foo.next).to.equal(null);
                expect(sd.bar.next).to.equal(null);
                sd = db.state_detail(69);
                expect(sd.bar.next).to.equal(null);
                sd = db.state_detail(70);
                expect(sd.foo.next).to.equal(null);
                expect(sd.bar.next).to.equal(null);
            });

        });

    });

    describe('vars', () => {

        beforeEach(function () {
            let db = new temporalspans();
            this.db = db;
        });

        it('returns a list of known variable names', function () {
            let db = this.db;
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(0);
            db.add({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'});
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(1)
                .to.include('foo');
            db.add({'from': 30, 'to': 40, 'name': 'foo', 'val': 'fooval2'});
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(1)
                .to.include('foo');
            db.add({'from': 15, 'to': 35, 'name': 'bar', 'val': 'varval1'});
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(2)
                .to.include('foo')
                .to.include('bar');
        });

    });

    describe('remove_var', () => {

        beforeEach(function () {
            let db = new temporalspans();
            this.db = db;
        });

        it('removes an unused variable name', function () {
            let db = this.db;
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(0);
            let span = db.add({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'});
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(1)
                .to.include('foo');
            db.remove(span);
            expect(db.remove_var('foo')).to.equal(true);
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(0);
        });

        it('does not remove a variable name still in use', function () {
            let db = this.db;
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(0);
            db.add({'from': 10, 'to': 20, 'name': 'foo', 'val': 'fooval1'});
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(1)
                .to.include('foo');
            expect(db.remove_var('foo')).to.equal(false);
            expect(db.vars())
                .to.be.an('array')
                .is.lengthOf(1);
        });

    });

    describe('with altenate valeqf', () => {

        describe('add', () => {

            beforeEach(function () {
                this.db = new temporalspans({
                    'valeqf': function (a, b) { return a.complex === b.complex; }
                });
            });

            it('adds span to span list', function () {
                let db = this.db;
                expect(db.list())
                    .to.be.an('array')
                    .is.lengthOf(0);
                db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': {'complex': 'raining'}});
                expect(db.list())
                    .to.be.an('array')
                    .is.lengthOf(1)
                    .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'weather', 'val': {'complex': 'raining'}}));
                db.add({'from': 30, 'to': 40, 'name': 'weather', 'val': {'complex': 'sunny'}});
                expect(db.list())
                    .to.be.an('array')
                    .is.lengthOf(2)
                    .to.satisfy(has_matching_span.bind({'from': 10, 'to': 20, 'name': 'weather', 'val': {'complex': 'raining'}}))
                    .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'weather', 'val': {'complex': 'sunny'}}));
            });

        });

        describe('remove', () => {

            beforeEach(function () {
                let db = new temporalspans({
                    'valeqf': function (a, b) { return a.complex === b.complex; }
                });
                this.spans = [
                    {'from': 10, 'to': 20, 'name': 'foo', 'val': {'complex': 'fooval1'}},
                    {'from': 30, 'to': 40, 'name': 'foo', 'val': {'complex': 'fooval2'}},
                    {'from': 15, 'to': 35, 'name': 'bar', 'val': {'complex': 'barval1'}}
                ].map((s) => {
                    return db.add(s);
                });
                this.db = db;
            });

            it('removes existing spans', function () {
                let db = this.db;
                expect(db.list())
                    .to.be.an('array')
                    .is.lengthOf(3);
                db.remove(this.spans[0]);
                expect(db.list())
                    .to.be.an('array')
                    .is.lengthOf(2)
                    .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': {'complex': 'fooval2'}}))
                    .to.satisfy(has_matching_span.bind({'from': 15, 'to': 35, 'name': 'bar', 'val': {'complex': 'barval1'}}));
                db.remove(this.spans[2]);
                expect(db.list())
                    .to.be.an('array')
                    .is.lengthOf(1)
                    .to.satisfy(has_matching_span.bind({'from': 30, 'to': 40, 'name': 'foo', 'val': {'complex': 'fooval2'}}));
                db.remove(this.spans[1]);
                expect(db.list())
                    .to.be.an('array')
                    .is.lengthOf(0);
            });

        });

    });

    describe('events', () => {

        beforeEach(function () {
            this.db = new temporalspans();
        });

        it('emits "new_var" when adding change with new variable', function () {
            let db = this.db;
            let new_vars_emitted = {};
            db.on('new_var', (name) => {
                new_vars_emitted[name] = true;
            });
            db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'});
            expect(new_vars_emitted.weather).to.eql(true);
            db.add({'from': 60, 'to': 70, 'name': 'moon', 'val': 'full'});
            expect(new_vars_emitted.moon).to.eql(true);
        });

        it('does not emit "new_var" when adding change with previously known variable', function () {
            let db = this.db;
            db.add({'from': 1, 'to': 2, 'name': 'weather', 'val': 'sunny'});
            db.add({'from': 2, 'to': 3, 'name': 'moon', 'val': 'blue'});
            let new_vars_emitted = {};
            db.on('new_var', (name) => {
                new_vars_emitted[name] = true;
            });
            db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'});
            expect(new_vars_emitted.weather).to.eql(undefined);
            db.add({'from': 60, 'to': 70, 'name': 'moon', 'val': 'full'});
            expect(new_vars_emitted.moon).to.eql(undefined);
        });

        it('emits "rm_var" when removing a variable', function () {
            let db = this.db;
            let rm_vars_emitted = {};
            db.on('rm_var', (name) => {
                rm_vars_emitted[name] = true;
            });
            let span = db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'});
            expect(db.remove(span)).to.eql(true);
            expect(rm_vars_emitted.weather).to.eql(undefined);
            expect(db.remove_var('weather')).to.eql(true);
            expect(rm_vars_emitted.weather).to.eql(true);
        });

        it('emits "add" when adding change', function () {
            let db = this.db;
            let emitted_add;
            db.on('add', (change) => {
                emitted_add = change;
            });
            db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'});
            expect(emitted_add).to.satisfy(is_matching_span.bind({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'}));
        });

        it('does not emit "modify" when change occurs', function () {
            let db = this.db;
            let span = db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'});
            let emitted_modify;
            db.on('modify', (from, to) => {
                emitted_modify = [from, to];
            });
            let new_span = {'from': span.from, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            db.modify(span, new_span);
            expect(emitted_modify).to.deep.equal(undefined);
        });

        it('emits "modify" when changes occurs', function () {
            let db = this.db;
            let span = db.add({'from': 10, 'to': 20, 'name': 'weather', 'val': 'raining'});
            let emitted_modify;
            db.on('modify', (from, to) => {
                emitted_modify = [from, to];
            });
            let new_span = {'from': span.from, 'to': span.to+5, 'name': span.name, 'val': span.val, 'id': span.id};
            db.modify(span, new_span);
            expect(emitted_modify).to.deep.equal([span, new_span]);
            span = new_span;
            new_span = {'from': span.from-2, 'to': span.to, 'name': span.name, 'val': span.val, 'id': span.id};
            db.modify(span, new_span);
            expect(emitted_modify).to.deep.equal([span, new_span]);
            span = new_span;
            new_span = {'from': span.from, 'to': span.to, 'name': span.name, 'val': 'sunny', 'id': span.id};
            db.modify(span, new_span);
            expect(emitted_modify).to.deep.equal([span, new_span]);
            span = new_span;
        });

    });

});


function backend_integrity_check (db) {

    let ts = db._ts;

    let firsts = ts.var_list().map((vn) => ts.first(vn));
    let spans = [];
    for (let i = 0; i < firsts.length; i++) {
        let current = firsts[i];
        while (current !== null) {
            let sd = ts.state_detail(current.timestamp, current.name);
            let id = sd.from.val.id;
            let val = sd.from.val.val;
            spans.push({'from': sd.from.timestamp, 'to': sd.to.timestamp, 'name': sd.from.name, 'id': id, 'val': val});
            if (sd.to !== null && sd.to.val !== null)
                current = sd.to;
            else
                current = ts.next(sd.to, sd.from.name);
        }
    }
    spans = spans.sort(temporalspans.cmp);

    expect(db.list()).to.eql(spans);

}


function has_matching_span (list) {
    return list.find((e) => {
        return e.from === this.from && e.to === this.to && e.name === this.name && JSON.stringify(e.val) === JSON.stringify(this.val);
    }) !== undefined;
}


function is_matching_span (span) {
    return span.from === this.from && span.to === this.to && span.name === this.name && JSON.stringify(span.val) === JSON.stringify(this.val);
}
