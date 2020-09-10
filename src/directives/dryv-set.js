import config from "../config";
import readSet from "../validationSetReader"

function copyRules($dryv, name, options) {
    const validationSet = readSet(name, options);
    $dryv.v = validationSet;
    $dryv.params = validationSet.parameters;
}

function hashCode(text) {
    let hash = 0, i, chr;
    for (i = 0; i < text.length; i++) {
        chr = text.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

async function validate(component, clientContext) {
    const $dryv = component.$dryv;
    const context = Object.assign({ dryv: $dryv }, clientContext);
    const formValidators = $dryv.formValidators;

    if (!formValidators) {
        return true;
    }

    if ($dryv.groupComponents) {
        $dryv.groupComponents.forEach(c => c.clear());
    }

    const disablers = $dryv.v.disablers;
    const disabledFields = [];

    let data = component.$data;

    if ($dryv.path) {
        $dryv.path.split(".").forEach(p => data = data[p]);
    }

    if (disablers) {
        for (let field of Object.keys(disablers)) {
            const disabler = disablers[field];
            if (!disabler) {
                continue;
            }

            var validationFunctions = disabler.filter(v => v.validate(data));

            if (validationFunctions.length) {
                disabledFields.push(field + ".");
            }
        }
    }

    let errors = "";
    let warnings = "";

    for (let v of formValidators) {
        const result = await v.validate(disabledFields, context);
        if (!result) {
            continue;
        }

        switch (typeof result) {
            case "object":
                switch (result.type) {
                    case "error":
                        errors += `${v.path}=${result.text};`;
                        break;
                    case "warning":
                        warnings += `${v.path}=${result.text};`;
                        break;
                }
                break;
            case "string":
                errors += `${v.path}=${result};`;
                break;
        }
    }

    $dryv._lastDisabledFields = disabledFields || null;
    $dryv._lastContext = context;

    return {
        hasErrors: errors.length > 0,
        errorHash: hashCode(errors),
        hasWarnings: warnings.length > 0,
        warningHash: hashCode(warnings)
    };
}

function setValidationResult(component, results) {
    if (component.$dryv.formValidators) {
        component.$dryv.formValidators.forEach(v => v.setResults(results));
    }

    return !results || results.length === 0;
}

function initializeFormComponent(component, name, path, options) {
    if (!component.$dryv) {
        const $dryv = Object.assign({}, { fieldValidators: [], namedValidators: {} }, options);
        component.$dryv = $dryv;
        (component.methods || (component.methods = {}))["$dryvParam"] = () => $dryv.params || {};
    }

    const d = component.$dryv;
    d.path = path;
    copyRules(d, name, options);

    if (!d.formValidators) {
        d.formValidators = [];
    }

    if (!d.validate) {
        d.validate = validate.bind(component, component);
    }

    if (!d.setValidationResult) {
        d.setValidationResult = setValidationResult.bind(component, component);
    }
}

export default function (o) {
    const options = config.createOptions(o);
    return {
        inserted: function (el, binding, vnode) {
            const component = vnode.context;
            if (!component) {
                throw `The ${config.dryvSetDirective} directive can only be applied to components.`;
            }

            let name;
            let path = null;

            switch (typeof binding.value) {
                case "object":
                    name = binding.value.name;
                    path = binding.value.path;
                    break;
                case "string":
                    name = binding.value;
                    break;
                default:
                    name = null;
            }

            if (!name) {
                throw `Form name is missing. Please specify a value for the ${config.dryvSetDirective} attribute.`;
            }

            initializeFormComponent(component, name, path, options);
        }
    }
}