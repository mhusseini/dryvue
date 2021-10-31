<template>
  <div>
    <input :value="value" @change="changed" ref="input" v-bind:class="{error}"/>
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
  props: ["value"],
  watch: {
    async value() {
      await this.$dryv.validate();
    },
  },
  methods: {
    async changed() {
      this.$emit("input", (this.$refs.input as HTMLInputElement).value);
    },
  },
});
</script>

<style>
input.error {
  border: 1px solid red;
}
</style>
