import Vue from "vue"
// TODO: change data object to something liek:
/*
data(){
    return{
        groups:{
            "group1": {
                groupWarnings: [].
                groupErrors: [].
            },
            ...
        }
    }
},
computed{
    groupErrors(){ return [].concat.apply([], Object.entities(this.groups).map(g=>g.groupErrors)) },
    ..
}
*/

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
                groupErrors: {},
                groupWarnings: {}
            };
        },
        computed: {
            errors() {
                return Object.entries(this.groupErrors).map(values => ({ group: values[0], text: values[1] }));
            },
            warnings() {
                return Object.entries(this.groupWarnings).map(values => ({ group: values[0], text: values[1] }));
            }
        },
        methods: {
            clear(group) {
                clearItems(this.groupErrors, group, this);
                clearItems(this.groupWarnings, group, this);
            },
            addError(text, group) {
                addResultItem(this.groupErrors, text, group, this);
            },
            addWarning(text, group) {
                addResultItem(this.groupWarnings, text, group, this);
            }
        },
        template: "<div><slot :groupErrors='groupErrors' :groupWarnings='groupWarnings' :errors='errors' :warnings='warnings'></slot></div>"
    }
}