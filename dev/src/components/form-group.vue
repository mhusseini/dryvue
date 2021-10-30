<template>
  <div>
    <slot/>
    <hr>
    <span v-if="error">{{ error }} </span>
    <span v-if="warning">{{ warning }} </span>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import DryvueGroup from "../dryvue/DryvueGroup";

export default Vue.extend({
  mixins: [DryvueGroup]
});
</script>
