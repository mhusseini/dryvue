import Vue, { VNode } from "vue";
import { DryvFormValidationResult } from "../dryv";
import { DryvueFormVue } from "../dryvue";
import { DryvValidationResult } from "../dryv";
import DryvField from "@/dryv/DryvField";

export default Vue.extend({
  data() {
    return {
      hasError: false,
      hasWarning: false,
      error: null as string | null | undefined,
      warning: null as string | null | undefined,
      isDirty: false,
      isValidated: false,
      annotations: [],
      $dryvForm: null,
      $dryvField: null as DryvField | null,
    };
  },
  computed: {
    success(): boolean {
      return !this.hasError && !this.hasWarning;
    },
  },
  created() {
    (this as any).$dryvField = {};
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

    this.$dryvForm = dryvForm as any;
    this.$dryvField = dryvField as any;

    dryvForm.registerField(dryvField);
  },
  methods: {
    async validate(): Promise<DryvValidationResult | null> {
      return !this.$dryvField ? null : await this.$dryvField.revalidate();
    },
    $onValidated(result: DryvValidationResult | null) {
      this.error = null;
      this.warning = null;

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
