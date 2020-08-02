# dryvue
**Complex model validation for server and client made easy.**

Dryv client-side components for Vue.js.

[![NuGet version](https://badge.fury.io/npm/dryvue.svg)](https://badge.fury.io/npm/dryvue) 

Write complex model validation rules in C# once.
_Dryv_ will generate JavaScript for client-side validation.

# Installation
```
npm install --save dryvue
```
# Usage
```JavaScript
import Dryvue from "dryvue"
import axios from "axios"
import * as moment from "moment"

Vue.use(Dryvue, {
    get: axios.get,
    post: axios.post,
    valueOfDate: (value, locale, format) => 
        typeof value === "string" 
            ? moment(value, format).valueOf()
            : value
})

```
# Options
Option | Type |Description | Default Value
-------|------|------------|--------------
get|function(url)|A method that performs an HTTP GET operation and returns the result or a promise.|fetch API
post|function(url, dataObject)|A method that performs an HTTP POST operation and returns the result or a promise.|fetch API
valueOfDate|function(dateString, locale, format)|A function that returns a numeric representation of the specified date. The date is formatted as a string with it's locale and format pattern given with the respective arguments.|```new Date(value).getTime()``` 
errorField|string|The name of the data field on the component to write error messages to. |```"error"``` 
warningField|string|The name of the data field on the component to write warning messages to.|```"warning"``` 
hasErrorField|string|The name of the data field on the component that indicates whether a validation error has ocurred.|```"hasError"``` 

The `dryv-set` directive is used to mark a component as a form to validate with Dryvue. This directive can be placed on any Vue component that contains further form field components. The form field component must be marked with the `dryv` directive. As a minimum, `dryv-set` takes the name of the validation set as argument.
```html
<template>

    <div v-dryv>
        <div>
            <label>{{ label }}</label>
            <input v-bind:value="value" v-on:input="$emit('input', $event.target.value)">
        </div>
        <div v-if="warning">{{ warning }}</div>
        <div v-if="error">{{ error }}</div>
    </div>

</template>
<script>

export default {
    props: ['value', 'label'],
    data() {
        return {
            error: null,
            warning: null
        };
    }
}

</script>
```
```html
<template>

    <div dryv-set="my-form">
        <form-input label="First name" v-model="firstName"/>
        <form-input label="Last name" v-model="lastName"/>
        <form-input label="Passwort" v-model="password"/>
        <form-input label="Confirm password" v-model="passwordConfirmation"/>
    </div>

</template>
<script>

export default {
    data() {
        return {
            firstName: null,
            lastName: null,
            password: null,
            passwordConfirmation: null,
        }
    }
}

</script>
```

## Directive *dryv-set*

Option | Type |Description | Default Value
-------|------|------------|--------------
name|string|The name of the validation set. This name must match the name used when generating the validation rule on the server. Referr to the `dryv-client-rules` tag in Dryv.AspNetCore for details.|
path|string|The path of the model to validate, relative to the component's data object. If the data object equals the form model, this option should be left unspecified. If the form model is contained in a child of the data object, this option's value must match the model path. TODO: complete this.| (undefined) 

### Validation
Components that have the `dryv-set` directive automatically get extended with an object exposing the Dryv functionaliy for this component. For instance, it contains a method name `validate` that triggers the validation and returns validation results.

```JavaScript
Vue.component('my-form', {
    data() {
        return {
            // ...
        }
    },
    methods: {
        async validateForm() {
            const result = await this.$dryv.validate();
            if (!result.hasErrors) {
                const result = await axios.post(form.action, this.$data);
                this.$dryv.setValidationResult(result.data.messages);            
            }
        }
    }
})
```

- `validate()`: Executes the validation rules for the current component's data object. The returned object has the folloing properties:
    
    Property | Type | Description
    -------|-------|-----
    hasErrors|boolean|A value indicating whether a validation error occrred.
    hasWarnings|boolean|A value indicating whether a validation warning occrred.
    errorHash|string|A value uniquely identifying the combination of the validation errors that occurred.
    warningHash|string|A value uniquely identifying the combination of the validation warnings that occurred.
- `setValidationResult(result: string|object)`: Sets the error and warning messages according to the specified validation result. The arument `result` may either be a string (i.e. an error), or an object with the following properties: 
- 
    Property | Type | Description
    -------|-------|-----
    type|string|The type of the result. Possible values: `error|warning|success`, while null or empty value will count as success.
    text|string|The error message to show to the user. If this value is empty, the result is treated as succed, regardless of the type field's value.
    group|string|An optional name of the validation group to dislplay this error in.
    data|object|An optional object that may contain custom data to send back to the client.

## Directive *dryv*
Option | Type |Description | Default Value
-------|------|------------|--------------
path|string|The path of the property to validate, relative to the component's data object.|Whatever value the `v-model` directive on the same component has. If neither are specified, an error will be thrown.
errorField|string|The name of the data field on the component to write error messages to. |```"error"``` 
warningField|string|The name of the data field on the component to write warning messages to.|```"warning"``` 
hasErrorField|string|The name of the data field on the component that indicates whether a validation error has ocurred.|```"hasError"``` 
## Component *dryv-group*

# Parameters
# Validation Groups
# Dealing with dates
# Custom validation data