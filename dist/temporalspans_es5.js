'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _temporalstate = require('temporalstate');

var _temporalstate2 = _interopRequireDefault(_temporalstate);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var temporalspans = function (_event_emitter) {
    _inherits(temporalspans, _event_emitter);

    function temporalspans() {
        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, temporalspans);

        var _this = _possibleConstructorReturn(this, (temporalspans.__proto__ || Object.getPrototypeOf(temporalspans)).call(this));

        var valeqf = function valeqf(a, b) {
            if (a === null && b === null) return true;
            if (a === null || b === null) return false;
            return a.id === b.id && a.val === b.val;
        };

        if (params.valeqf) valeqf = function valeqf(a, b) {
            if (a === null && b === null) return true;
            if (a === null || b === null) return false;
            return a.id === b.id && params.valeqf(a.val, b.val);
        };

        var ts = new _temporalstate2.default({
            'valeqf': valeqf
        });

        ts.on('new_var', function (name) {
            _this.emit('new_var', name);
        }).on('rm_var', function (name) {
            _this.emit('rm_var', name);
        });

        _this._ts = ts;
        _this._ids = {};
        _this._valeqf = valeqf;

        return _this;
    }

    _createClass(temporalspans, [{
        key: 'id_lookup',
        value: function id_lookup(id) {

            return this._ids[id];
        }
    }, {
        key: 'list',
        value: function list() {
            var _this2 = this;

            return Object.keys(this._ids).map(function (k) {
                return _this2._ids[k];
            }).sort(temporalspans.cmp);
        }
    }, {
        key: 'add',
        value: function add(span) {

            var ts = this._ts;

            var sd = ts.state_detail(span.from, span.name);
            if (sd.from === null || sd.from.val === null) {
                if (sd.to === null || sd.to.timestamp > span.to) {
                    span.id = (0, _uuid2.default)();
                    ts.add_change({ 'timestamp': span.from, 'name': span.name, 'val': { 'id': span.id, 'val': span.val } });
                    ts.add_change({ 'timestamp': span.to, 'name': span.name, 'val': null });
                    this._ids[span.id] = span;
                    this.emit('add', span);
                    return span;
                } else if (sd.to.timestamp === span.to) {
                    span.id = (0, _uuid2.default)();
                    ts.add_change({ 'timestamp': span.from, 'name': span.name, 'val': { 'id': span.id, 'val': span.val } });
                    this._ids[span.id] = span;
                    this.emit('add', span);
                    return span;
                }
            }

            return null;
        }
    }, {
        key: 'remove',
        value: function remove(span) {

            var ts = this._ts;

            var sd = ts.state_detail(span.from, span.name);
            var tst_val = { 'id': span.id, 'val': span.val };

            if (sd.from.timestamp === span.from && sd.from.val.id === tst_val.id && sd.to.timestamp === span.to) {
                if (sd.to.val === null) {
                    ts.remove_change({ 'timestamp': span.from, 'name': span.name, 'val': tst_val });
                    ts.remove_change({ 'timestamp': span.to, 'name': span.name, 'val': null });
                    delete this._ids[span.id];
                    this.emit('remove', span);
                } else {
                    ts.remove_change({ 'timestamp': span.from, 'name': span.name, 'val': tst_val });
                    delete this._ids[span.id];
                    this.emit('remove', span);
                }
                return true;
            }

            return false;
        }
    }, {
        key: 'vars',
        value: function vars() {

            return this._ts.var_list();
        }
    }, {
        key: 'remove_var',
        value: function remove_var(var_name) {

            return this._ts.remove_var(var_name);
        }
    }, {
        key: 'state',
        value: function state(ts, name) {

            var ts_val = this._ts.state(ts, name);

            if (name === undefined) {
                for (var vn in ts_val) {
                    ts_val[vn] = ts_val[vn].val;
                }
            } else if (ts_val !== null) {
                ts_val = ts_val.val;
            }

            return ts_val;
        }
    }, {
        key: 'state_detail',
        value: function state_detail(when, name) {

            var ts = this._ts;

            var sd = {};
            if (name === undefined) {
                var var_names = ts.var_list();
                for (var i = 0; i < var_names.length; i++) {
                    var vn = var_names[i];
                    var ts_sd = ts.state_detail(when, vn);
                    var from = ts_sd.from;
                    var to = ts_sd.to;
                    var in_span = from !== null && from.val !== null && from.val.val !== null;
                    var current = in_span ? { 'from': from.timestamp, 'to': to.timestamp, 'name': vn, 'val': from.val.val, 'id': from.val.id } : null;
                    var next = null;
                    if (!in_span && to !== null) {
                        var to_next_change = ts.next(to, vn);
                        var next_to = to_next_change.timestamp;
                        next = { 'from': to.timestamp, 'to': next_to, vn: vn, 'name': vn, 'val': to.val.val, 'id': to.val.id };
                    }
                    sd[vn] = {
                        'current': current,
                        'next': next
                    };
                }
            } else {
                var _ts_sd = ts.state_detail(when, name);
                var _from = _ts_sd.from;
                var _to = _ts_sd.to;
                var _in_span = _from !== null && _from.val !== null && _from.val.val !== null;
                var _current = _in_span ? { 'from': _from.timestamp, 'to': _to.timestamp, 'name': name, 'val': _from.val.val, 'id': _from.val.id } : null;
                var _next = null;
                if (!_in_span && _to !== null) {
                    var _to_next_change = ts.next(_to, name);
                    var _next_to = _to_next_change.timestamp;
                    _next = { 'from': _to.timestamp, 'to': _next_to, 'name': name, 'val': _to.val.val, 'id': _to.val.id };
                }
                sd.current = _current;
                sd.next = _next;
            }

            return sd;
        }
    }, {
        key: 'modify',
        value: function modify(span, new_span) {

            var ts = this._ts;

            if (span.name !== new_span.name) return null;
            if (span.id !== new_span.id) return null;
            if (new_span.from >= new_span.to) return null;

            var prev_change = ts.prev({ 'timestamp': span.from, 'name': span.name, val: { 'id': span.id, 'val': span.val } }, span.name);
            if (new_span.from < span.from && prev_change !== null && new_span.from < prev_change.timestamp) return null;

            var end_change = ts.next({ 'timestamp': span.from, 'name': span.name, val: { 'id': span.id, 'val': span.val } }, span.name);
            var next_change = end_change === null ? null : ts.next(end_change, span.name);
            if (new_span.to > span.to && next_change !== null && new_span.to > next_change.timestamp) return null;

            var real_span = this._ids[span.id];

            var modified = false;
            if (new_span.from !== span.from) {
                if (new_span.from > span.from) ts.add_change({ 'timestamp': span.from, 'name': span.name, 'val': null });
                ts.add_change({ 'timestamp': new_span.from, 'name': span.name, 'val': { 'id': span.id, 'val': span.val } });
                real_span.from = new_span.from;
                modified = true;
            }
            if (new_span.to !== span.to) {
                if (new_span.to > span.to) ts.add_change({ 'timestamp': span.to, 'name': span.name, 'val': { 'id': span.id, 'val': span.val } });
                if (next_change === null || new_span.to < next_change.timestamp) ts.add_change({ 'timestamp': new_span.to, 'name': span.name, 'val': null });
                real_span.to = new_span.to;
                modified = true;
            }
            if (!this._valeqf({ 'id': span.id, 'val': span.val }, { 'id': span.id, 'val': new_span.val })) {
                ts.add_change({ 'timestamp': new_span.from, 'name': span.name, 'val': { 'id': span.id, 'val': new_span.val } });
                real_span.val = new_span.val;
                modified = true;
            }

            if (modified) this.emit('modify', span, new_span);

            return new_span;
        }
    }], [{
        key: 'cmp',
        value: function cmp(a, b) {

            return a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        }
    }]);

    return temporalspans;
}(_events2.default);

exports.default = temporalspans;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi90ZW1wb3JhbHNwYW5zLmpzIl0sIm5hbWVzIjpbInRlbXBvcmFsc3BhbnMiLCJwYXJhbXMiLCJ2YWxlcWYiLCJhIiwiYiIsImlkIiwidmFsIiwidHMiLCJ0ZW1wb3JhbHN0YXRlIiwib24iLCJuYW1lIiwiZW1pdCIsIl90cyIsIl9pZHMiLCJfdmFsZXFmIiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsImsiLCJzb3J0IiwiY21wIiwic3BhbiIsInNkIiwic3RhdGVfZGV0YWlsIiwiZnJvbSIsInRvIiwidGltZXN0YW1wIiwiYWRkX2NoYW5nZSIsInRzdF92YWwiLCJyZW1vdmVfY2hhbmdlIiwidmFyX2xpc3QiLCJ2YXJfbmFtZSIsInJlbW92ZV92YXIiLCJ0c192YWwiLCJzdGF0ZSIsInVuZGVmaW5lZCIsInZuIiwid2hlbiIsInZhcl9uYW1lcyIsImkiLCJsZW5ndGgiLCJ0c19zZCIsImluX3NwYW4iLCJjdXJyZW50IiwibmV4dCIsInRvX25leHRfY2hhbmdlIiwibmV4dF90byIsIm5ld19zcGFuIiwicHJldl9jaGFuZ2UiLCJwcmV2IiwiZW5kX2NoYW5nZSIsIm5leHRfY2hhbmdlIiwicmVhbF9zcGFuIiwibW9kaWZpZWQiLCJldmVudF9lbWl0dGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0lBR01BLGE7OztBQUVGLDZCQUEwQjtBQUFBLFlBQWJDLE1BQWEsdUVBQUosRUFBSTs7QUFBQTs7QUFBQTs7QUFJdEIsWUFBSUMsU0FBUyxnQkFBVUMsQ0FBVixFQUFhQyxDQUFiLEVBQWdCO0FBQ3pCLGdCQUFJRCxNQUFNLElBQU4sSUFBY0MsTUFBTSxJQUF4QixFQUNJLE9BQU8sSUFBUDtBQUNKLGdCQUFJRCxNQUFNLElBQU4sSUFBY0MsTUFBTSxJQUF4QixFQUNJLE9BQU8sS0FBUDtBQUNKLG1CQUFPRCxFQUFFRSxFQUFGLEtBQVNELEVBQUVDLEVBQVgsSUFBaUJGLEVBQUVHLEdBQUYsS0FBVUYs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QWhDLEVBQS9DLENBQUwsRUFBMkY7QUFDdkZDLG1CQUFHb0IsVUFBSCxDQUFjLEVBQUMsYUFBYW9CLFNBQVN2QixJQUF2QixFQUE2QixRQUFRSCxLQUFLWCxJQUExQyxFQUFnRCxPQUFPLEVBQUMsTUFBTVcsS0FBS2hCLEVBQVosRUFBZ0IsT0FBTzBDLFNBQVN6QyxHQUFoQyxFQUF2RCxFQUFkO0FBQ0E4QywwQkFBVTlDLEdBQVYsR0FBZ0J5QyxTQUFTekMsR0FBekI7QUFDQStDLDJCQUFXLElBQVg7QUFDSDs7QUFFRCxnQkFBSUEsUUFBSixFQUNJLEtBQUsxQyxJQUFMLENBQVUsUUFBVixFQUFvQlUsSUFBcEIsRUFBMEIwQixRQUExQjs7QUFFSixtQkFBT0EsUUFBUDtBQUVIOzs7NEJBRVc1QyxDLEVBQUdDLEMsRUFBRzs7QUFFZCxtQkFBT0QsRUFBRXFCLElBQUYsR0FBU3BCLEVBQUVvQixJQUFYLEdBQWtCLENBQUMsQ0FBbkIsR0FDRHJCLEVBQUVxQixJQUFGLEdBQVNwQixFQUFFb0IsSUFBWCxHQUFrQixDQUFsQixHQUNBckIsRUFBRXNCLEVBQUYsR0FBT3JCLEVBQUVxQixFQUFULEdBQWMsQ0FBQyxDQUFmLEdBQ0F0QixFQUFFc0IsRUFBRixHQUFPckIsRUFBRXFCLEVBQVQsR0FBYyxDQUFkLEdBQ0F0QixFQUFFTyxJQUFGLEdBQVNOLEVBQUVNLElBQVgsR0FBa0IsQ0FBQyxDQUFuQixHQUNBUCxFQUFFTyxJQUFGLEdBQVNOLEVBQUVNLElBQVgsR0FBa0IsQ0FBbEIsR0FDQSxDQU5OO0FBUUg7Ozs7RUF6UHVCNEMsZ0I7O2tCQThQYnRELGEiLCJmaWxlIjoidGVtcG9yYWxzcGFuc19lczUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdGVtcG9yYWxzdGF0ZSBmcm9tICd0ZW1wb3JhbHN0YXRlJztcbmltcG9ydCBldmVudF9lbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgdXVpZCBmcm9tICd1dWlkJztcblxuXG5jbGFzcyB0ZW1wb3JhbHNwYW5zIGV4dGVuZHMgZXZlbnRfZW1pdHRlciB7XG5cbiAgICBjb25zdHJ1Y3RvciAocGFyYW1zID0ge30pIHtcblxuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIGxldCB2YWxlcWYgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgaWYgKGEgPT09IG51bGwgJiYgYiA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChhID09PSBudWxsIHx8IGIgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGEuaWQgPT09IGIuaWQgJiYgYS52YWwgPT09IGIudmFsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChwYXJhbXMudmFsZXFmKVxuICAgICAgICAgICAgdmFsZXFmID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICBpZiAoYSA9PT0gbnVsbCAmJiBiID09PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoYSA9PT0gbnVsbCB8fCBiID09PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEuaWQgPT09IGIuaWQgJiYgcGFyYW1zLnZhbGVxZihhLnZhbCwgYi52YWwpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBsZXQgdHMgPSBuZXcgdGVtcG9yYWxzdGF0ZSh7XG4gICAgICAgICAgICAndmFsZXFmJzogdmFsZXFmXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRzLm9uKCduZXdfdmFyJywgKG5hbWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbmV3X3ZhcicsIG5hbWUpO1xuICAgICAgICB9KS5vbigncm1fdmFyJywgKG5hbWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncm1fdmFyJywgbmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3RzICAgICA9IHRzO1xuICAgICAgICB0aGlzLl9pZHMgICAgPSB7fTtcbiAgICAgICAgdGhpcy5fdmFsZXFmID0gdmFsZXFmO1xuXG4gICAgfVxuXG4gICAgaWRfbG9va3VwIChpZCkge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9pZHNbaWRdO1xuXG4gICAgfVxuXG4gICAgbGlzdCAoKSB7XG5cbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX2lkcylcbiAgICAgICAgICAgIC5tYXAoKGspID0+IHRoaXMuX2lkc1trXSlcbiAgICAgICAgICAgIC5zb3J0KHRlbXBvcmFsc3BhbnMuY21wKTtcblxuICAgIH1cblxuICAgIGFkZCAoc3Bhbikge1xuXG4gICAgICAgIGxldCB0cyA9IHRoaXMuX3RzO1xuXG4gICAgICAgIGxldCBzZCA9IHRzLnN0YXRlX2RldGFpbChzcGFuLmZyb20sIHNwYW4ubmFtZSk7XG4gICAgICAgIGlmIChzZC5mcm9tID09PSBudWxsIHx8IHNkLmZyb20udmFsID09PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoc2QudG8gPT09IG51bGwgfHwgc2QudG8udGltZXN0YW1wID4gc3Bhbi50bykge1xuICAgICAgICAgICAgICAgIHNwYW4uaWQgPSB1dWlkKCk7XG4gICAgICAgICAgICAgICAgdHMuYWRkX2NoYW5nZSh7J3RpbWVzdGFtcCc6IHNwYW4uZnJvbSwgJ25hbWUnOiBzcGFuLm5hbWUsICd2YWwnOiB7J2lkJzogc3Bhbi5pZCwgJ3ZhbCc6IHNwYW4udmFsfX0pO1xuICAgICAgICAgICAgICAgIHRzLmFkZF9jaGFuZ2Uoeyd0aW1lc3RhbXAnOiBzcGFuLnRvLCAnbmFtZSc6IHNwYW4ubmFtZSwgJ3ZhbCc6IG51bGx9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9pZHNbc3Bhbi5pZF0gPSBzcGFuO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnYWRkJywgc3Bhbik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNwYW47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNkLnRvLnRpbWVzdGFtcCA9PT0gc3Bhbi50bykge1xuICAgICAgICAgICAgICAgIHNwYW4uaWQgPSB1dWlkKCk7XG4gICAgICAgICAgICAgICAgdHMuYWRkX2NoYW5nZSh7J3RpbWVzdGFtcCc6IHNwYW4uZnJvbSwgJ25hbWUnOiBzcGFuLm5hbWUsICd2YWwnOiB7J2lkJzogc3Bhbi5pZCwgJ3ZhbCc6IHNwYW4udmFsfX0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2lkc1tzcGFuLmlkXSA9IHNwYW47XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhZGQnLCBzcGFuKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3BhbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgfVxuXG4gICAgcmVtb3ZlIChzcGFuKSB7XG5cbiAgICAgICAgbGV0IHRzID0gdGhpcy5fdHM7XG5cbiAgICAgICAgbGV0IHNkID0gdHMuc3RhdGVfZGV0YWlsKHNwYW4uZnJvbSwgc3Bhbi5uYW1lKTtcbiAgICAgICAgbGV0IHRzdF92YWwgPSB7J2lkJzogc3Bhbi5pZCwgJ3ZhbCc6IHNwYW4udmFsfTtcblxuICAgICAgICBpZiAoc2QuZnJvbS50aW1lc3RhbXAgPT09IHNwYW4uZnJvbSAmJiBzZC5mcm9tLnZhbC5pZCA9PT0gdHN0X3ZhbC5pZCAmJiBzZC50by50aW1lc3RhbXAgPT09IHNwYW4udG8pIHtcbiAgICAgICAgICAgIGlmICAoc2QudG8udmFsID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdHMucmVtb3ZlX2NoYW5nZSh7J3RpbWVzdGFtcCc6IHNwYW4uZnJvbSwgJ25hbWUnOiBzcGFuLm5hbWUsICd2YWwnOiB0c3RfdmFsfSk7XG4gICAgICAgICAgICAgICAgdHMucmVtb3ZlX2NoYW5nZSh7J3RpbWVzdGFtcCc6IHNwYW4udG8sICduYW1lJzogc3Bhbi5uYW1lLCAndmFsJzogbnVsbH0pO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9pZHNbc3Bhbi5pZF07XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmUnLCBzcGFuKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHMucmVtb3ZlX2NoYW5nZSh7J3RpbWVzdGFtcCc6IHNwYW4uZnJvbSwgJ25hbWUnOiBzcGFuLm5hbWUsICd2YWwnOiB0c3RfdmFsfSk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2lkc1tzcGFuLmlkXTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZScsIHNwYW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICB9XG5cbiAgICB2YXJzICgpIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fdHMudmFyX2xpc3QoKTtcblxuICAgIH1cblxuICAgIHJlbW92ZV92YXIgKHZhcl9uYW1lKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3RzLnJlbW92ZV92YXIodmFyX25hbWUpO1xuXG4gICAgfVxuXG4gICAgc3RhdGUgKHRzLCBuYW1lKSB7XG5cbiAgICAgICAgbGV0IHRzX3ZhbCA9IHRoaXMuX3RzLnN0YXRlKHRzLCBuYW1lKTtcblxuICAgICAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB2biBpbiB0c192YWwpXG4gICAgICAgICAgICAgICAgdHNfdmFsW3ZuXSA9IHRzX3ZhbFt2bl0udmFsO1xuICAgICAgICB9IGVsc2UgaWYgKHRzX3ZhbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdHNfdmFsID0gdHNfdmFsLnZhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0c192YWw7XG5cbiAgICB9XG5cbiAgICBzdGF0ZV9kZXRhaWwgKHdoZW4sIG5hbWUpIHtcblxuICAgICAgICBsZXQgdHMgPSB0aGlzLl90cztcblxuICAgICAgICBsZXQgc2QgPSB7fTtcbiAgICAgICAgaWYgKG5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbGV0IHZhcl9uYW1lcyA9IHRzLnZhcl9saXN0KCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhcl9uYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCB2biA9IHZhcl9uYW1lc1tpXTtcbiAgICAgICAgICAgICAgICBsZXQgdHNfc2QgPSB0cy5zdGF0ZV9kZXRhaWwod2hlbiwgdm4pO1xuICAgICAgICAgICAgICAgIGxldCBmcm9tID0gdHNfc2QuZnJvbTtcbiAgICAgICAgICAgICAgICBsZXQgdG8gPSB0c19zZC50bztcbiAgICAgICAgICAgICAgICBsZXQgaW5fc3BhbiA9IGZyb20gIT09IG51bGwgJiYgZnJvbS52YWwgIT09IG51bGwgJiYgZnJvbS52YWwudmFsICE9PSBudWxsO1xuICAgICAgICAgICAgICAgIGxldCBjdXJyZW50ID0gaW5fc3BhblxuICAgICAgICAgICAgICAgICAgICA/IHsnZnJvbSc6IGZyb20udGltZXN0YW1wLCAndG8nOiB0by50aW1lc3RhbXAsICduYW1lJzogdm4sICd2YWwnOiBmcm9tLnZhbC52YWwsICdpZCc6IGZyb20udmFsLmlkfVxuICAgICAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmICghaW5fc3BhbiAmJiB0byAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdG9fbmV4dF9jaGFuZ2UgPSB0cy5uZXh0KHRvLCB2bik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXh0X3RvID0gdG9fbmV4dF9jaGFuZ2UudGltZXN0YW1wO1xuICAgICAgICAgICAgICAgICAgICBuZXh0ID0geydmcm9tJzogdG8udGltZXN0YW1wLCAndG8nOiBuZXh0X3RvLCB2biwgJ25hbWUnOiB2biwgJ3ZhbCc6IHRvLnZhbC52YWwsICdpZCc6IHRvLnZhbC5pZH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNkW3ZuXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ2N1cnJlbnQnOiBjdXJyZW50LFxuICAgICAgICAgICAgICAgICAgICAnbmV4dCc6ICAgIG5leHQsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0c19zZCA9IHRzLnN0YXRlX2RldGFpbCh3aGVuLCBuYW1lKTtcbiAgICAgICAgICAgIGxldCBmcm9tID0gdHNfc2QuZnJvbTtcbiAgICAgICAgICAgIGxldCB0byA9IHRzX3NkLnRvO1xuICAgICAgICAgICAgbGV0IGluX3NwYW4gPSBmcm9tICE9PSBudWxsICYmIGZyb20udmFsICE9PSBudWxsICYmIGZyb20udmFsLnZhbCAhPT0gbnVsbDtcbiAgICAgICAgICAgIGxldCBjdXJyZW50ID0gaW5fc3BhblxuICAgICAgICAgICAgICAgID8geydmcm9tJzogZnJvbS50aW1lc3RhbXAsICd0byc6IHRvLnRpbWVzdGFtcCwgJ25hbWUnOiBuYW1lLCAndmFsJzogZnJvbS52YWwudmFsLCAnaWQnOiBmcm9tLnZhbC5pZH1cbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICBsZXQgbmV4dCA9IG51bGw7XG4gICAgICAgICAgICBpZiAoIWluX3NwYW4gJiYgdG8gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgdG9fbmV4dF9jaGFuZ2UgPSB0cy5uZXh0KHRvLCBuYW1lKTtcbiAgICAgICAgICAgICAgICBsZXQgbmV4dF90byA9IHRvX25leHRfY2hhbmdlLnRpbWVzdGFtcDtcbiAgICAgICAgICAgICAgICBuZXh0ID0geydmcm9tJzogdG8udGltZXN0YW1wLCAndG8nOiBuZXh0X3RvLCAnbmFtZSc6IG5hbWUsICd2YWwnOiB0by52YWwudmFsLCAnaWQnOiB0by52YWwuaWR9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2QuY3VycmVudCA9IGN1cnJlbnQ7XG4gICAgICAgICAgICBzZC5uZXh0ICAgID0gbmV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZDtcblxuICAgIH1cblxuICAgIG1vZGlmeSAoc3BhbiwgbmV3X3NwYW4pIHtcblxuICAgICAgICBsZXQgdHMgPSB0aGlzLl90cztcblxuICAgICAgICBpZiAoc3Bhbi5uYW1lICE9PSBuZXdfc3Bhbi5uYW1lKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmIChzcGFuLmlkICE9PSBuZXdfc3Bhbi5pZClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBpZiAobmV3X3NwYW4uZnJvbSA+PSBuZXdfc3Bhbi50bylcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgIGxldCBwcmV2X2NoYW5nZSA9IHRzLnByZXYoXG4gICAgICAgICAgICB7J3RpbWVzdGFtcCc6IHNwYW4uZnJvbSwgJ25hbWUnOiBzcGFuLm5hbWUsIHZhbDogeydpZCc6IHNwYW4uaWQsICd2YWwnOiBzcGFuLnZhbH19LFxuICAgICAgICAgICAgc3Bhbi5uYW1lXG4gICAgICAgICk7XG4gICAgICAgIGlmIChuZXdfc3Bhbi5mcm9tIDwgc3Bhbi5mcm9tICYmIHByZXZfY2hhbmdlICE9PSBudWxsICYmIG5ld19zcGFuLmZyb20gPCBwcmV2X2NoYW5nZS50aW1lc3RhbXApXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICBsZXQgZW5kX2NoYW5nZSA9IHRzLm5leHQoXG4gICAgICAgICAgICB7J3RpbWVzdGFtcCc6IHNwYW4uZnJvbSwgJ25hbWUnOiBzcGFuLm5hbWUsIHZhbDogeydpZCc6IHNwYW4uaWQsICd2YWwnOiBzcGFuLnZhbH19LFxuICAgICAgICAgICAgc3Bhbi5uYW1lXG4gICAgICAgICk7XG4gICAgICAgIGxldCBuZXh0X2NoYW5nZSA9IGVuZF9jaGFuZ2UgPT09IG51bGxcbiAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgOiB0cy5uZXh0KGVuZF9jaGFuZ2UsIHNwYW4ubmFtZSk7XG4gICAgICAgIGlmIChuZXdfc3Bhbi50byA+IHNwYW4udG8gJiYgbmV4dF9jaGFuZ2UgIT09IG51bGwgJiYgbmV3X3NwYW4udG8gPiBuZXh0X2NoYW5nZS50aW1lc3RhbXApXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICBsZXQgcmVhbF9zcGFuID0gdGhpcy5faWRzW3NwYW4uaWRdO1xuXG4gICAgICAgIGxldCBtb2RpZmllZCA9IGZhbHNlO1xuICAgICAgICBpZiAobmV3X3NwYW4uZnJvbSAhPT0gc3Bhbi5mcm9tKSB7XG4gICAgICAgICAgICBpZiAobmV3X3NwYW4uZnJvbSA+IHNwYW4uZnJvbSlcbiAgICAgICAgICAgICAgICB0cy5hZGRfY2hhbmdlKHsndGltZXN0YW1wJzogc3Bhbi5mcm9tLCAnbmFtZSc6IHNwYW4ubmFtZSwgJ3ZhbCc6IG51bGx9KTtcbiAgICAgICAgICAgIHRzLmFkZF9jaGFuZ2Uoeyd0aW1lc3RhbXAnOiBuZXdfc3Bhbi5mcm9tLCAnbmFtZSc6IHNwYW4ubmFtZSwgJ3ZhbCc6IHsnaWQnOiBzcGFuLmlkLCAndmFsJzogc3Bhbi52YWx9fSk7XG4gICAgICAgICAgICByZWFsX3NwYW4uZnJvbSA9IG5ld19zcGFuLmZyb207XG4gICAgICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5ld19zcGFuLnRvICE9PSBzcGFuLnRvKSB7XG4gICAgICAgICAgICBpZiAobmV3X3NwYW4udG8gPiBzcGFuLnRvKVxuICAgICAgICAgICAgICAgIHRzLmFkZF9jaGFuZ2Uoeyd0aW1lc3RhbXAnOiBzcGFuLnRvLCAnbmFtZSc6IHNwYW4ubmFtZSwgJ3ZhbCc6IHsnaWQnOiBzcGFuLmlkLCAndmFsJzogc3Bhbi52YWx9fSk7XG4gICAgICAgICAgICBpZiAobmV4dF9jaGFuZ2UgPT09IG51bGwgfHwgbmV3X3NwYW4udG8gPCBuZXh0X2NoYW5nZS50aW1lc3RhbXApXG4gICAgICAgICAgICAgICAgdHMuYWRkX2NoYW5nZSh7J3RpbWVzdGFtcCc6IG5ld19zcGFuLnRvLCAnbmFtZSc6IHNwYW4ubmFtZSwgJ3ZhbCc6IG51bGx9KTtcbiAgICAgICAgICAgIHJlYWxfc3Bhbi50byA9IG5ld19zcGFuLnRvO1xuICAgICAgICAgICAgbW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fdmFsZXFmKHsnaWQnOiBzcGFuLmlkLCAndmFsJzogc3Bhbi52YWx9LCB7J2lkJzogc3Bhbi5pZCwgJ3ZhbCc6IG5ld19zcGFuLnZhbH0pKSB7XG4gICAgICAgICAgICB0cy5hZGRfY2hhbmdlKHsndGltZXN0YW1wJzogbmV3X3NwYW4uZnJvbSwgJ25hbWUnOiBzcGFuLm5hbWUsICd2YWwnOiB7J2lkJzogc3Bhbi5pZCwgJ3ZhbCc6IG5ld19zcGFuLnZhbH19KTtcbiAgICAgICAgICAgIHJlYWxfc3Bhbi52YWwgPSBuZXdfc3Bhbi52YWw7XG4gICAgICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9kaWZpZWQpXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vZGlmeScsIHNwYW4sIG5ld19zcGFuKTtcblxuICAgICAgICByZXR1cm4gbmV3X3NwYW47XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgY21wIChhLCBiKSB7XG5cbiAgICAgICAgcmV0dXJuIGEuZnJvbSA8IGIuZnJvbSA/IC0xXG4gICAgICAgICAgICA6IGEuZnJvbSA+IGIuZnJvbSA/IDFcbiAgICAgICAgICAgIDogYS50byA8IGIudG8gPyAtMVxuICAgICAgICAgICAgOiBhLnRvID4gYi50byA/IDFcbiAgICAgICAgICAgIDogYS5uYW1lIDwgYi5uYW1lID8gLTFcbiAgICAgICAgICAgIDogYS5uYW1lID4gYi5uYW1lID8gMVxuICAgICAgICAgICAgOiAwO1xuXG4gICAgfVxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgdGVtcG9yYWxzcGFucztcbiJdfQ==
//# sourceMappingURL=temporalspans_es5.js.map
