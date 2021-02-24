import readSet from "../validationSetReader"
import config from "../config"
import Vue from "vue"

function handleValidationResult(component, result, directiveOptions, groupComponent) {
    let type = null;
    let group = null;
    let text = null;

    if (result) {
        switch (typeof result) {
            case "object":
                type = result.type;
                group = result.group;
                text = result.text;
                break;
            case "string":
                type = "error";
                text = result;
                break;
        }
    }

    const error = type === "error" && text;
    const warning = type === "warning" && text;

    if (!component.$dryv._lastGroups) {
        component.$dryv._lastGroups = [];
    }

    const lastGroups = component.$dryv._lastGroups;

    if (group && groupComponent) {
        error && groupComponent.addError(error, group);
        warning && groupComponent.addWarning(warning, group, this);
        Vue.set(component, directiveOptions.errorField, null);
        Vue.set(component, directiveOptions.warningField, null);
        Vue.set(component, directiveOptions.hasErrorField, true);

        if (lastGroups.indexOf(group) < 0) {
            lastGroups.push(group);
        }
    } else {
        Vue.set(component, directiveOptions.errorField, error);
        Vue.set(component, directiveOptions.warningField, warning);
        Vue.set(component, directiveOptions.hasErrorField, false);

        lastGroups.forEach(g => groupComponent.clear(g));
        component.$dryv._lastGroups = [];
    }

    return text && {
        type,
        text,
        group
    };
}

function runValidation(v, m, context) {
    return v.reduce(function (promiseChain, currentTask) {
        return promiseChain.then(function (r) {
            return r || currentTask(m, context);
        });
    }, Promise.resolve());
}

function initializeFieldComponent(formComponent, component, path, localPath) {
    if (component.$dryv) {
        return;
    }

    component.$dryv = {
        path,
        formValidators: []
    };
    formComponent.$watch(localPath, (newValue, oldValue) => {
        const d = formComponent.$dryv;
        if (d._lastDisabledFields === undefined) {
            return;
        }

        component.$dryv.formValidators
            .filter(v => !v.isValidating && v.path === path)
            .forEach(v => v.validate(d._lastDisabledFields, d._lastContext, true));
    });
}

function findFormComponent(vnode) {
    let component = vnode.context;
    let formComponent = null;
    let groupComponent = null;

    while (component) {
        if (!formComponent &&
            component._vnode && component._vnode.data &&
            component._vnode.data.directives &&
            component._vnode.data.directives.filter(d => d.name === config.dryvSetDirective).length > 0) {
            formComponent = component;
        } else if (!groupComponent && component.$vnode && component.$vnode.componentOptions.tag === config.dryvGroupTag) {
            groupComponent = component;
        }

        if (groupComponent && formComponent) {
            break;
        }

        component = component.$parent;
    }

    return {
        groupComponent,
        formComponent
    };
}

function findModelExpression(vnode) {
    let n = vnode;

    while (n) {
        if (n.data && n.data.model && n.data.model.expression) {
            return n.data.model.expression;
        }
        n = n.parent;
    }

    return null;
}

function readConfigurationFromBinding(binding, options, $dryv) {
    let path = null;
    let errorField = options.errorField;
    let warningField = options.warningField;
    let hasErrorField = options.hasErrorField;

    if (binding.value) {
        switch (typeof binding.value) {
            case "object":
                errorField = binding.value.errorField || errorField;
                warningField = binding.value.warningField || warningField;
                hasErrorField = binding.value.hasErrorField || hasErrorField;
                path = binding.value.path;
                break;
            case "string":
                path = binding.value;
                break;
        }
    } else if (binding.expression) {
        path = binding.expression;
    }

    return {
        path,
        errorField,
        warningField,
        hasErrorField
    };
}

function copyRules($dryv, name, options) {
    const validationSet = readSet(name, options);

    $dryv.v = validationSet;
    $dryv.params = validationSet.parameters;
}

export default function (o) {
    const options = config.createOptions(o);
    return {
        inserted: function (el, binding, vnode) {
            const component = vnode.componentInstance || vnode.context;
            if (!component) {
                throw `The '${dryvFieldDirective}' directive can only be applied to components.`;
            }
            const components = findFormComponent(vnode);
            const formComponent = components.formComponent;

            if (!formComponent) {
                Vue.util.warn(`No component found with a ${config.dryvSetDirective} directive.`);
                return;
            }

            if (!formComponent.$dryv) {
                formComponent.$dryv = Object.assign({
                    formValidators: [],
                    namedValidators: {}
                }, options);

                const directive = formComponent._vnode.data.directives.filter(d => d.name === config.dryvSetDirective)[0].value;


                let name = null;
                let path = null;

                switch (typeof directive) {
                    case "object":
                        name = directive.name;
                        path = directive.path;
                        break;
                    case "string":
                        name = directive;
                        break;
                }

                if (!name) {
                    throw `Form name is missing. Please specify a value for the ${config.dryvSetDirective} attribute.`;
                }


                formComponent.$dryv.path = path;

                copyRules(formComponent.$dryv, name, options);
            }

            const $dryv = formComponent.$dryv;

            const groupComponent = components.groupComponent;
            if (groupComponent) {
                if (!$dryv.groupComponents) {
                    $dryv.groupComponents = [];
                }
                if ($dryv.groupComponents.indexOf(groupComponent) < 0) {
                    $dryv.groupComponents.push(groupComponent);
                }
            }

            const directiveOptions = readConfigurationFromBinding(binding, options, $dryv);

            if (!directiveOptions.path) {
                directiveOptions.path = findModelExpression(vnode);
            }

            if (!directiveOptions.path) {
                throw `The property path is missing. Please specify a value for the ${dryvFieldDirective} attribute or use the ${dryvFieldDirective} directive in combination with 'v-model'. Example value: 'firstName' or 'child.firstName'.`;
            }

            const originalPath = directiveOptions.path;

            if ($dryv.path) {
                directiveOptions.path = directiveOptions.path.substr($dryv.path.length + 1);
            }

            initializeFieldComponent(formComponent, component, directiveOptions.path, originalPath);

            const validators = $dryv.v.validators[directiveOptions.path];
            if (!validators) {
                return;
            }

            const v1 = validators.map(v => v.annotations);
            v1.splice(0, 0, {});
            const annotations = v1.reduce((t, s) => Object.assign(t, s));

            for (let annotationName in annotations) {
                if (!component.$data.hasOwnProperty(annotationName)) {
                    continue;
                }

                Vue.set(component, annotationName, annotations[annotationName]);
            }

            if (component.$data.hasOwnProperty(directiveOptions.errorField)) {
                Vue.set(component, directiveOptions.errorField, null);
            } else {
                throw new `Please specify the data property ${directiveOptions.errorField} on the form input component.`;
            }

            if (component.$data.hasOwnProperty(directiveOptions.warningField)) {
                Vue.set(component, directiveOptions.warningField, null);
            } else {
                throw new `Please specify the data property ${directiveOptions.warningField} on the form input component.`;
            }

            const fieldValidator = {
                isValidating: false,
                path: directiveOptions.path,
                validate: async (disabledFields, context, validateRelated) => {
                    if (validators === undefined) {
                        return null;
                    }

                    if (!validators) {
                        return null;
                    }

                    fieldValidator.isValidating = true;

                    try {
                        let data = formComponent.$data;

                        if ($dryv.path) {
                            $dryv.path.split(".").forEach(p => data = data[p]);
                        }

                        const context2 = Object.assign({}, context);
                        context2.component = formComponent;

                        let result = null;
                        const isEnabled = !disabledFields || disabledFields.filter(f => directiveOptions.path.indexOf(f) >= 0).length === 0;
                        if (isEnabled) {
                            const validationFunctions = validators.map(v => v.validate);
                            result = await runValidation(validationFunctions, data, context2);
                            if (validateRelated) {
                                const related = [].concat.apply([], validators.filter(v => !!v.related).map(v => v.related));
                                related.forEach(path => $dryv.namedValidators[path].validate(disabledFields, context));
                            }
                        }

                        return handleValidationResult(component, result, directiveOptions, groupComponent);
                    } finally {
                        fieldValidator.isValidating = false;
                    }
                },
                setResults: results => {
                    const result = results && results[directiveOptions.path];
                    return handleValidationResult(component, result, directiveOptions, groupComponent);
                }
            };

            component.$dryv.formValidators.push(fieldValidator);
            $dryv.namedValidators[directiveOptions.path] = fieldValidator;
            $dryv.formValidators.push(fieldValidator);
        }
    }
}