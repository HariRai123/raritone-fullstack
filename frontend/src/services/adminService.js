import API from "./api";

export const getUsers = async () => {
  const response = await API.get("/admin/users");
  return response.data.users;
};
