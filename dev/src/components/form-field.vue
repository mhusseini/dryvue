<template>
  <div>
    <input :value="value" @change="changed" ref="input" />
    <p v-if="error && showValidationResult">{{ error }} </p>
    <p v-if="warning && showValidationResult">{{ warning }} </p>
    <p v-if="success && isValidated">&#x2713;</p>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import DryvueField from "../dryvue/DryvueField";

export default Vue.extend({
  mixins: [DryvueField],
  props: ["value"],
  watch: {
    async value() {
      await (this as any).validate();
    },
  },
  methods: {
    async changed() {
      this.$emit("input", (this.$refs.input as any).value);
    },
  },
});
</script>
