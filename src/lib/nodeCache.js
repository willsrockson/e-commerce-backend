import NodeCache from "node-cache";
const myCacheSystem = new NodeCache({stdTTL: 300})

export default myCacheSystem;