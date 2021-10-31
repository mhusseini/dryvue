import Vue from "vue";
import {DryvueForm} from "@/dryvue/DryvueForm";

export function findParentForm(vue: Vue) {
    let parent: DryvueForm | undefined = vue.$parent as DryvueForm;
    while (!parent.$dryv?.form) {
        if (!parent.$parent) {
            parent = undefined;
            break;
        }
        parent = parent.$parent as DryvueForm;
    }

    return parent?.$dryv?.form;
}