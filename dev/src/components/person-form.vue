<template>
  <div data-dryv-path-remove="model">
    <div>
      <form-group name="name-group">
        <form-field-text v-model="model.anrede"></form-field-text>
        <form-field-text v-model="model.vorname"></form-field-text>
        <form-field-text v-model="model.nachname"></form-field-text>
        <form-field-text v-model="model.geburtsdatum"></form-field-text>
        <form-field-text v-model="model.emailAdresse"></form-field-text>
        <form-field-text v-model="model.telefonNummer"></form-field-text>
      </form-group>
      <button @click="send()">Send</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {DryvueForm} from "@/dryvue";
import FormFieldText from "./form-field-text.vue";
import FormGroup from "./form-group";
import axios from "axios"
import {DryvFormValidationContext, DryvValidationResult} from "@/dryv/types";

export default Vue.extend({
  components: {FormFieldText, FormGroup},
  mixins: [DryvueForm],
  data() {
    return {
      warningHash: 0,
      model: {
        anrede: null,
        vorname: null,
        nachname: null,
        geburtsdatum: null,
        emailAdresse: null,
        telefonNummer: null,
      },
    };
  },
  created() {
    this.configureDryv({
      validationSet: "person",
      handleResult(context: DryvFormValidationContext, model: unknown, path: string, ruleName: string, result: DryvValidationResult): void {
        return result;
      }
    });
  },
  methods: {
    async send() {
      const result = await this.$dryv.validate(this.model);

      if (result.errors || result.warnings && result.warningHash !== this.warningHash) {
        this.warningHash = result.warningHash;
        return;
      }

      this.warningHash = result.warningHash;

      const serverResponse = axios.post("someurl", this.model);
      if (this.$dryv.sync(serverResponse.data.messages)) {
        // success
      }
    },
  },
});
</script>
