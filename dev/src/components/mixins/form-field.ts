import Vue from "vue";
import FormField from "../form-field";

export const FormFieldMixin = Vue.extend({
    components: {FormField},
    props: {
        value: {},
        label: String,
        debounce: Number
    },
    methods: {
        async changed(value: any) {
            this.$emit("input", value);
        },
    },
})