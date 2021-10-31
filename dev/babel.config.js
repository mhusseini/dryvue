const {NODE_ENV} = process.env;
const prod = NODE_ENV === "production";
const plugins = [];

if (prod) {
    plugins.push(["transform-remove-console", {"exclude": ["error", "warn"]}]);
}

module.exports = {
    plugins,
    presets: [
        '@vue/cli-plugin-babel/preset'
    ]
}
