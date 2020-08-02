// TODO: change data object to something liek:
/*
data(){
    return{
        groups:{
            "group1": {
                warnings: [].
                errors: [].
            },
            ...
        }
    }
},
computed{
    errors(){ return [].concat.apply([], Object.entities(this.groups).map(g=>g.errors)) },
    ..
}
*/

function flattenItems(items) {
    return [].concat.apply([], Object.keys(items).map(k => items[k]));
}

function clearItems(items, group) {
    Object.keys(items).filter(k => !!group || k === group).map(k => items[k]).forEach(l => l.splice(0));
}

function addResultItem(items, text, group) {
    if (!items[group]) {
        Vue.set(items, group, []);
    }

    const texts = items[group];
    if (texts.indexOf(text) < 0) {
        texts.push(text);
    }
}

export default function (options) {
    return {
        data() {
            return {
                errors: {},
                warnings: {}
            };
        },
        computed: {
            allErrors() {
                return flattenItems(this.errors);
            },
            allWarnings() {
                return flattenItems(this.warnings);
            }
        },
        methods: {
            clear(group) {
                clearItems(this.errors, group);
                clearItems(this.warnings, group);
            },
            addError(text, group) {
                addResultItem(this.errors, text, group);
            },
            addWarning(text, group) {
                addResultItem(this.warnings, text, group);
            }
        },
        template: "<div><slot :errors='errors' :warnings='warnings' :allErrors='allErrors' :allWarnings='allWarnings'></slot></div>"
    }
}