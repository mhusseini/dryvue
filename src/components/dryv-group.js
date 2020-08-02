import Vue from "vue"
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
    return Object.keys(items).map(k => items[k]);
}

function clearItems(items, group, component) {
    if (items && group && items[group]) {
        component.$set(items, group, null);
    }
}

function addResultItem(items, text, group, component) {
    if (items && group) {
        component.$set(items, group, text);
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
                return Object.entries(this.errors).map(values => values[1]);
            },
            allWarnings() {
                return Object.entries(this.warnings).map(values => values[1]);
            }
        },
        methods: {
            clear(group) {
                clearItems(this.errors, group, this);
                clearItems(this.warnings, group, this);
            },
            addError(text, group) {
                addResultItem(this.errors, text, group, this);
            },
            addWarning(text, group) {
                addResultItem(this.warnings, text, group, this);
            }
        },
        template: "<div><slot :errors='errors' :warnings='warnings' :allErrors='allErrors' :allWarnings='allWarnings'></slot></div>"
    }
}