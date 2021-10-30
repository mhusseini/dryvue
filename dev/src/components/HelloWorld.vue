<template>
  <div data-dryv-path-remove="model">
    <div>
      <form-group name="name-group">
        <container>
          <div class="c1">
            <form-field v-model="model.firstName"></form-field>
          </div>
        </container>
        <div class="c2">
          <form-field v-model="model.lastName"></form-field>
        </div>
      </form-group>
      <button @click="send()">Send</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import FormField from "./form-field.vue";
import FormGroup from "./form-group";
import DryvForm from "../dryvue/DryvueForm";
import Container from "./container.vue";

export default Vue.extend({
  components: {FormField, FormGroup, Container},
  mixins: [DryvForm],
  data() {
    return {
      model: {
        firstName: null,
        lastName: null,
      },
    };
  },
  methods: {
    async send() {
      await (this as any).validate("form1", this.model);
    },
  },
});
</script>
