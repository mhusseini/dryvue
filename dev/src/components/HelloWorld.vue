<template>
  <div data-dryv-path-remove="model">
    <div>
      <person-form></person-form>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import PersonForm from "./person-form";

export default Vue.extend({
  components: {
    PersonForm
  },
});
</script>
