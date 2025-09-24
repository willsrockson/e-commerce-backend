import NodeCache from "node-cache";
const myCacheSystem = new NodeCache({stdTTL: 300, deleteOnExpire: true})
export default myCacheSystem;