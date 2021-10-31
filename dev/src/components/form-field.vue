<template>
  <div>
    <span>{{ label }}</span><span v-if="annotations.required">*</span>
    <input :value="value" @input="changed" ref="input" v-bind:class="{error}"/>
    <p v-if="error && showValidationResult">{{ error }} </p>
    <p v-if="warning && showValidationResult">{{ warning }} </p>
    <p v-if="success && isValidated">&#x2713;</p>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import {DryvueField} from "@/dryvue";

export default Vue.extend({
  mixins: [DryvueField],
  props: {
    value: {},
    label: String,
    debounce: {
      default: 100
    }
  },
  created() {
    this.configureDryv({debounce: this.debounce});
  },
  methods: {
    async changed() {
      this.$emit("input", (this.$refs.input as HTMLInputElement).value);
      this.$dryv.validate();
    },
  },
});
</script>

<style>
input.error {
  border: 1px solid red;
}
</style>
