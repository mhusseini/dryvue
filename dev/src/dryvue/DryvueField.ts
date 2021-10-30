import Vue, {VNode} from "vue";
import {DryvueFormVue} from "../dryvue";
import {DryvValidationResult} from "@/dryv";
import DryvField from "@/dryv/DryvField";
import DryvForm from "@/dryv/DryvForm";

export default Vue.extend({
    data() {
        return {
            error: undefined as string | undefined,
            warning: undefined as string | undefined,
            isDirty: false,
            isValidated: false,
            showValidationResult: true,
            annotations: [],
            $dryvForm: undefined as DryvForm | undefined,
            $dryvField: undefined as DryvField | undefined,
        };
    },
    computed: {
        success(): boolean {
            return !this.error && !this.warning;
        },
    },
    mounted() {
        let parent = this.$parent as DryvueFormVue;
        while (!parent.$dryvForm) {
            if (!parent.$parent) {
                return;
            }
            parent = parent.$parent as DryvueFormVue;
        }

        const dryvForm = parent.$dryvForm;
        const dryvField = new DryvField(dryvForm);
        dryvField.validated = (r) => this.$onValidated(r);

        let n: VNode | undefined = this.$vnode;
        let path = "";
        let sep = "";
        while (n && n.componentInstance) {
            const parentPath = this.$findPath(n);
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

            if ((n.componentInstance as DryvueFormVue).$dryvForm) {
                break;
            }
            n = p?.$vnode;
        }

        dryvField.path = path;

        this.$dryvForm = dryvForm;
        this.$dryvField = dryvField;

        dryvForm.registerField(dryvField);
    },
    methods: {
        async validate(): Promise<DryvValidationResult | undefined> {
            return !this.$dryvField ? undefined : await this.$dryvField.revalidate();
        },
        $onValidated(result: DryvValidationResult | undefined) {
            this.error = undefined;
            this.warning = undefined;
            this.isValidated = true;
            this.showValidationResult = this.$dryvField?.showValidationResult !== false;
            
            if (!result) {
                return;
            }

            if (result.type === "error") {
                this.error = result.text;
            } else if (result.type === "warning") {
                this.warning = result.text;
            }
        },
        $findPath(vnode: VNode) {
            let n: VNode | undefined = vnode;
            let path = "";

            while (n) {
                const data = n.data as any;
                if (data && data.model && data.model.expression) {
                    path = data.model.expression + (path ? "." + path : "");
                }

                n = n.parent;
            }

            return path;
        },
    },
});
