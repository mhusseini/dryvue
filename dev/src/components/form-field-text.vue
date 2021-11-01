<template>
  <form-field :value="value" :label="label" :debounce="debounce" @input="changed">
    <template slot-scope="{value, changed, error}">
      <input :value="value" @input="changed($event.target.value)" v-bind:class="{error}"/>
    </template>
  </form-field>
</template>
<script lang="ts">
import Vue from "vue";
import {FormFieldMixin} from "./mixins/form-field"

export default Vue.extend({mixins: [FormFieldMixin]})
</script>