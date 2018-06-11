import temporalstate from 'temporalstate';
import event_emitter from 'events';
import uuid from 'uuid';


class temporalspans extends event_emitter {

    constructor (params = {}) {

        super();

        let valeqf = function (a, b) {
            if (a === null && b === null)
                return true;
            if (a === null || b === null)
                return false;
            return a.id === b.id && a.val === b.val;
        };

        if (params.valeqf)
            valeqf = function (a, b) {
                if (a === null && b === null)
                    return true;
                if (a === null || b === null)
                    return false;
                return a.id === b.id && params.valeqf(a.val, b.val);
            };

        let ts = new temporalstate({
            'valeqf': valeqf
        });

        ts.on('new_var', (name) => {
            this.emit('new_var', name);
        }).on('rm_var', (name) => {
            this.emit('rm_var', name);
        });

        this._ts     = ts;
        this._ids    = {};
        this._valeqf = valeqf;

    }

    id_lookup (id) {

        return this._ids[id];

    }

    list () {

        return Object.keys(this._ids)
            .map((k) => this._ids[k])
            .sort(temporalspans.cmp);

    }

    add (span) {

        let ts = this._ts;

        let sd = ts.state_detail(span.from, span.name);
        if (sd.from === null || sd.from.val === null) {
            if (sd.to === null || sd.to.timestamp > span.to) {
                span.id = uuid();
                ts.add_change({'timestamp': span.from, 'name': span.name, 'val': {'id': span.id, 'val': span.val}});
                ts.add_change({'timestamp': span.to, 'name': span.name, 'val': null});
                this._ids[span.id] = span;
                this.emit('add', span);
                return span;
            } else if (sd.to.timestamp === span.to) {
                span.id = uuid();
                ts.add_change({'timestamp': span.from, 'name': span.name, 'val': {'id': span.id, 'val': span.val}});
                this._ids[span.id] = span;
                this.emit('add', span);
                return span;
            }
        }

        return null;

    }

    remove (span) {

        let ts = this._ts;

        let sd = ts.state_detail(span.from, span.name);
        let tst_val = {'id': span.id, 'val': span.val};

        if (sd.from.timestamp === span.from && sd.from.val.id === tst_val.id && sd.to.timestamp === span.to) {
            if  (sd.to.val === null) {
                ts.remove_change({'timestamp': span.from, 'name': span.name, 'val': tst_val});
                ts.remove_change({'timestamp': span.to, 'name': span.name, 'val': null});
                delete this._ids[span.id];
                this.emit('remove', span);
            } else {
                ts.remove_change({'timestamp': span.from, 'name': span.name, 'val': tst_val});
                delete this._ids[span.id];
                this.emit('remove', span);
            }
            return true;
        }

        return false;

    }

    vars () {

        return this._ts.var_list();

    }

    remove_var (var_name) {

        return this._ts.remove_var(var_name);

    }

    state (ts, name) {

        let ts_val = this._ts.state(ts, name);

        if (name === undefined) {
            for (let vn in ts_val)
                ts_val[vn] = ts_val[vn].val;
        } else if (ts_val !== null) {
            ts_val = ts_val.val;
        }

        return ts_val;

    }

    state_detail (when, name) {

        let ts = this._ts;

        let sd = {};
        if (name === undefined) {
            let var_names = ts.var_list();
            for (let i = 0; i < var_names.length; i++) {
                let vn = var_names[i];
                let ts_sd = ts.state_detail(when, vn);
                let from = ts_sd.from;
                let to = ts_sd.to;
                let in_span = from !== null && from.val !== null && from.val.val !== null;
                let current = in_span
                    ? {'from': from.timestamp, 'to': to.timestamp, 'name': vn, 'val': from.val.val, 'id': from.val.id}
                    : null;
                let next = null;
                if (!in_span && to !== null) {
                    let to_next_change = ts.next(to, vn);
                    let next_to = to_next_change.timestamp;
                    next = {'from': to.timestamp, 'to': next_to, vn, 'name': vn, 'val': to.val.val, 'id': to.val.id};
                }
                sd[vn] = {
                    'current': current,
                    'next':    next,
                };
            }
        } else {
            let ts_sd = ts.state_detail(when, name);
            let from = ts_sd.from;
            let to = ts_sd.to;
            let in_span = from !== null && from.val !== null && from.val.val !== null;
            let current = in_span
                ? {'from': from.timestamp, 'to': to.timestamp, 'name': name, 'val': from.val.val, 'id': from.val.id}
                : null;
            let next = null;
            if (!in_span && to !== null) {
                let to_next_change = ts.next(to, name);
                let next_to = to_next_change.timestamp;
                next = {'from': to.timestamp, 'to': next_to, 'name': name, 'val': to.val.val, 'id': to.val.id};
            }
            sd.current = current;
            sd.next    = next;
        }

        return sd;

    }

    modify (span, new_span) {

        let ts = this._ts;

        if (span.name !== new_span.name)
            return null;
        if (span.id !== new_span.id)
            return null;
        if (new_span.from >= new_span.to)
            return null;

        let prev_change = ts.prev(
            {'timestamp': span.from, 'name': span.name, val: {'id': span.id, 'val': span.val}},
            span.name
        );
        if (new_span.from < span.from && prev_change !== null && new_span.from < prev_change.timestamp)
            return null;

        let end_change = ts.next(
            {'timestamp': span.from, 'name': span.name, val: {'id': span.id, 'val': span.val}},
            span.name
        );
        let next_change = end_change === null
            ? null
            : ts.next(end_change, span.name);
        if (new_span.to > span.to && next_change !== null && new_span.to > next_change.timestamp)
            return null;

        let real_span = this._ids[span.id];

        let modified = false;
        if (new_span.from !== span.from) {
            if (new_span.from > span.from)
                ts.add_change({'timestamp': span.from, 'name': span.name, 'val': null});
            ts.add_change({'timestamp': new_span.from, 'name': span.name, 'val': {'id': span.id, 'val': span.val}});
            real_span.from = new_span.from;
            modified = true;
        }
        if (new_span.to !== span.to) {
            if (new_span.to > span.to)
                ts.add_change({'timestamp': span.to, 'name': span.name, 'val': {'id': span.id, 'val': span.val}});
            if (next_change === null || new_span.to < next_change.timestamp)
                ts.add_change({'timestamp': new_span.to, 'name': span.name, 'val': null});
            real_span.to = new_span.to;
            modified = true;
        }
        if (!this._valeqf({'id': span.id, 'val': span.val}, {'id': span.id, 'val': new_span.val})) {
            ts.add_change({'timestamp': new_span.from, 'name': span.name, 'val': {'id': span.id, 'val': new_span.val}});
            real_span.val = new_span.val;
            modified = true;
        }

        if (modified)
            this.emit('modify', span, new_span);

        return new_span;

    }

    static cmp (a, b) {

        return a.from < b.from ? -1
            : a.from > b.from ? 1
            : a.to < b.to ? -1
            : a.to > b.to ? 1
            : a.name < b.name ? -1
            : a.name > b.name ? 1
            : 0;

    }

}


export default temporalspans;
