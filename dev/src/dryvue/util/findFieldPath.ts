import Vue, {VNode} from "vue";
import {DryvueForm} from "@/dryvue/DryvueForm";

export function findFieldPath(vue: Vue) {
    let n: VNode | undefined = vue.$vnode;
    let path = "";
    let sep = "";

    while (n && n.componentInstance) {
        const parentPath = findNodePath(n);
        if (parentPath) {
            path = parentPath + sep + path;
            sep = ".";
        }
        const p: Vue | null = n.componentInstance.$parent;
        let el: Element | null = n.componentInstance.$el;

        while (el && el != p?.$el) {
            const add = el.getAttribute("data-dryv-path-add");
            if (add) {
                path = parentPath + sep + path;
            }
            const remove = el.getAttribute("data-dryv-path-remove");
            if (remove) {
                path = path.replace(new RegExp("^" + remove + "\\."), "");
            }
            el = el.parentElement;
        }

        if ((n.componentInstance as DryvueForm).$dryv?.form) {
            break;
        }
        n = p?.$vnode;
    }
    return path;
}

function findNodePath(vnode: VNode) {
    let n: VNode | undefined = vnode;
    let path = "";

    while (n && (!n.componentInstance || n.componentInstance === vnode.componentInstance)) {
        const data = n.data as any;
        if (data && data.model && data.model.expression) {
            path = data.model.expression + (path ? "." + path : "");
        }

        n = n.parent;
    }

    return path;
}