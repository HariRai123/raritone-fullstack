import API from "./api";

export const createOrder = async (items) => {
  const response = await API.post("/orders", { items });
  return response.data;
};

export const getMyOrders = async () => {
  const response = await API.get("/orders");
  return response.data.orders;
};

export const getAllOrders = async () => {
  const response = await API.get("/admin/orders");
  return response.data.orders;
};

export const updateOrderStatus = async (id, status) => {
  const response = await API.patch(`/admin/orders/${id}`, { status });
  return response.data;
};
