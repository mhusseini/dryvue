<template>
  <div>
    <input :value="value" @change="changed" ref="input" />
    <span v-if="error">{{ error }} </span>
    <span v-if="warning">{{ warning }} </span>
    <span v-if="success">&#x2713;</span>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import dryvueField from "../dryvue/dryvue-field";

export default Vue.extend({
  mixins: [dryvueField],
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
