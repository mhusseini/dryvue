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
                type = result.type.toLowerCase();
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

function initializeFieldComponent(formComponent, component, path, localPath, debounce) {
    if (component.$dryv) {
        return;
    }

    component.$dryv = {
        path,
        formValidators: []
    };

    var debouncerTimeout = null;
    formComponent.$watch(localPath, (newValue, oldValue) => {
        if (debouncerTimeout) {
            clearTimeout(debouncerTimeout);
        }
        debouncerTimeout = setTimeout(function () {
            const d = formComponent.$dryv;
            if (d._lastDisabledFields === undefined) {
                return;
            }

            component.$dryv.formValidators
                .filter(v => !v.isValidating && v.path === path)
                .forEach(v => v.validate(d._lastDisabledFields, d._lastContext, true));
        }, debounce);
    });
}

function findFormComponent(vnode) {
    let component = vnode.context;
    let formComponent = null;
    let groupComponent = null;
    let fields = [];

    while (component) {
        const directives = component._vnode.data && component._vnode.data.directives;
        if (!formComponent &&
            component._vnode && component._vnode.data &&
            directives &&
            directives.filter(d => d.name === config.dryvSetDirective).length > 0) {
            formComponent = component;
        } else if (!groupComponent && component.$vnode && component.$vnode.componentOptions.tag === config.dryvGroupTag) {
            groupComponent = component;
        }

        if (groupComponent && formComponent) {
            break;
        }

        component = component.$parent;
    }

    let node = vnode;
    
    while (node) {
        const directives = node.data && node.data.directives;
        if (directives) {
            fields = fields.concat(directives
                .filter(d => d.name === config.dryvFieldDirective));
        }

        node = node.parent;
    }

    return {
        groupComponent,
        formComponent,
        directives: fields || []
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

function readConfigurationFromBinding(directives, options, $dryv) {
    const directive = Object.assign({}, ...directives.map(binding => {
        switch (binding.value != null && typeof binding.value) {
            case "object":
                return binding.value;
            default:
                return {
                    path: binding.expression
                };
        }
    }));

    return {
        originalPath: directive.path,
        path: directive.path,
        errorField: directive.errorField || options.errorField,
        warningField: directive.warningField || options.warningField,
        hasErrorField: directive.hasErrorField || options.hasErrorField,
        debounce: directive.debounce || options.debounce
    };
}

function copyRules($dryv, name, options) {
    const validationSet = readSet(name, options);

    $dryv.v = validationSet;
    $dryv.params = validationSet.parameters;
}

function getDirectiveOptions(directives, options, vnode, $dryv) {
    const directiveOptions = readConfigurationFromBinding(directives, options, $dryv);

    if (!directiveOptions.path) {
        directiveOptions.originalPath = directiveOptions.path = findModelExpression(vnode);
    }

    if (!directiveOptions.path) {
        throw `The property path is missing. Please specify a value for the ${config.dryvFieldDirective} attribute or use the ${config.dryvFieldDirective} directive in combination with 'v-model'. Example value: 'firstName' or 'child.firstName'.`;
    }

    if ($dryv.path) {
        directiveOptions.path = directiveOptions.path.substr($dryv.path.length + 1);
    }

    return directiveOptions;
}

function validateGroup(validate, group, model, context) {
    if (!group) {
        return validate(model, context);
    }

    const result = validate(model, context);

    if (typeof result == "string") {
        return {
            type: "error",
            group,
            text: result
        };
    }

    return result;
}

export default function (o) {
    const options = config.createOptions(o);
    return {
        inserted: function (el, binding, vnode) {
            const component = vnode.componentInstance || vnode.context;
            if (!component) {
                throw `The '${config.dryvFieldDirective}' directive can only be applied to components.`;
            }
            const hierarchy = findFormComponent(vnode);
            if(hierarchy.directives.length > 1){
                return;
            }

            const formComponent = hierarchy.formComponent;

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

            const groupComponent = hierarchy.groupComponent;
            if (groupComponent) {
                if (!$dryv.groupComponents) {
                    $dryv.groupComponents = [];
                }
                if ($dryv.groupComponents.indexOf(groupComponent) < 0) {
                    $dryv.groupComponents.push(groupComponent);
                }
            }

            const directiveOptions = getDirectiveOptions(hierarchy.directives, options, vnode, $dryv);

            initializeFieldComponent(formComponent, component, directiveOptions.path, directiveOptions.originalPath, directiveOptions.debounce);

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
                            const validationFunctions = validators.map(v => validateGroup.bind(v, v.validate, v.group));
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
        },
        unbind: function (el, binding, vnode) {
            const component = vnode.componentInstance || vnode.context;
            const hierarchy = findFormComponent(vnode);
            const formComponent = components.formComponent;
            const $dryv = formComponent.$dryv;
            
            const directiveOptions = getDirectiveOptions(hierarchy.directives, options, vnode, $dryv);

            const removeValidatorFromArray = function (array, path) {
                const indexOfRule = array.findIndex(v => v.path == path);
                if (indexOfRule > -1) {
                    array.splice(indexOfRule, 1);
                }
            }

            removeValidatorFromArray($dryv.formValidators, directiveOptions.path);
            removeValidatorFromArray(component.$dryv.formValidators, directiveOptions.path);
            delete $dryv.namedValidators[directiveOptions.path];
        }
    }
}