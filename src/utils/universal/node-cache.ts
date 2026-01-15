import NodeCache from "node-cache";
const clientCache = new NodeCache({stdTTL: 300, deleteOnExpire: true})
export default clientCache;