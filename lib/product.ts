export const product: {
  id: "commitment-pools" | "dispute-court";
  name: string;
  origin: string;
  recordPath: string;
  listMethod: string;
  detailMethod: string;
} = {
  id: "commitment-pools",
  name: "Commitment Pools",
  origin:
    process.env.NEXT_PUBLIC_SITE_ORIGIN ??
    "https://commitment-pools-genlayer.blazekingsley2.chatgpt.site",
  recordPath: "pools",
  listMethod: "list_pools",
  detailMethod: "get_pool",
};
