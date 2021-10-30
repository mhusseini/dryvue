import Vue from "vue";
import DryvForm from "../dryv/DryvForm";
import { DryvueFormVue } from ".";
import { DryvFormValidationResult } from "@/dryv";

export default Vue.extend({
  data() {
    return {
      hasErrors: false,
      hasWarnings: false,
      $dryvForm: null,
    };
  },
  computed: {
    success(): boolean {
      return !this.hasErrors && !this.hasWarnings;
    },
  },
  created() {
    (this as DryvueFormVue).$dryvForm = new DryvForm();
  },
  methods: {
    async validate(validationSet: string, model: any): Promise<DryvFormValidationResult | null> {
      const dryvForm = (this as DryvueFormVue).$dryvForm;
      if (!dryvForm) {
        this.hasErrors = false;
        this.hasWarnings = false;
      }

      const results = await ((dryvForm as any) as DryvForm).validate(
        validationSet,
        model
      );
      this.hasErrors = (results?.errors?.length ?? 0) > 0;
      this.hasWarnings = (results?.warnings?.length ?? 0) > 0;

      return results;
    },
  },
});
