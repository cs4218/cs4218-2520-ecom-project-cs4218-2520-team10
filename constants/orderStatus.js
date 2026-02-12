/**
 * Server-side Order Status Constants
 */
export const ORDER_STATUS = {
  NOT_PROCESS: "Not Processed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_LIST = [
  ORDER_STATUS.NOT_PROCESS,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];

// Default status for new orders
export const DEFAULT_ORDER_STATUS = ORDER_STATUS.NOT_PROCESS;
