const JOB_STATUSES = {
  QUEUED: "queued",
  IN_BAY: "in-bay",
  WASHING: "washing",
  DRYING: "drying",
  READY: "ready",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

const JOB_STATUS_LIST = [
  "queued",
  "in-bay",
  "washing",
  "drying",
  "ready",
  "delivered",
  "cancelled"
];

module.exports = { JOB_STATUSES, JOB_STATUS_LIST };
