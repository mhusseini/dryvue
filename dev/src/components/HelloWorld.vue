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
import {DryvueForm} from "@/dryvue";
import FormField from "./form-field.vue";
import FormGroup from "./form-group";
import Container from "./container.vue";
import axios from "axios"

export default Vue.extend({
  components: {FormField, FormGroup, Container},
  mixins: [DryvueForm],
  data() {
    return {
      warningHash = 0,
      model: {
        firstName: null,
        lastName: null,
      },
    };
  },
  created() {
  },
  methods: {
    async send() {
      const result = await this.$dryv.validate("form1", this.model);

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
