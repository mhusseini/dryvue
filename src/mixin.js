export default {
    data() {
        return { dryv: { params: {} } };
    },
    mounted() {
        if (this.$dryv) {
            this.$set(this.$data, "dryv", { params: this.$dryv.params });
        }
    }
};
