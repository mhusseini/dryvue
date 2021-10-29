import DryvForm from "../dryv/DryvForm";
import {DryvValidationContext} from "@/dryv";

export interface DryvueFormVue extends Vue {
    $dryvForm?: DryvForm | null;
}
