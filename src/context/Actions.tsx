import { toastService } from "@/lib/toast";
import { ACTION_TYPES } from "@/lib/types";
import user from "./UserActions";
import shipments from "./ShipmentActions";


export const APIURL = "https://temitayo01-001-site1.ktempurl.com/app/v1";
export const position = "bottom-center";
export const vubids_user =
  typeof window !== "undefined"
    ? window.localStorage.getItem("vubids_token")
    : false;
export const main_user =
  typeof window !== "undefined"
    ? window.localStorage.getItem("user_Type")
    : false;

const actions = {
  user,
  shipments,
};

export default actions;

