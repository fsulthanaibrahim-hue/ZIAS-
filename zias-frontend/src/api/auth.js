import API from "./api";

export const loginUser = (data) => {
  return API.post("token/", data);
};