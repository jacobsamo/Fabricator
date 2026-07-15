import type { ServerDetail } from "@/api/schemas";

export type ServerProperties = {
  name: string;
  port: number;
  serverIp: string;
  motd: string;
  bugReportLink: string;
  maxPlayers: number;
  difficulty: string;
  gamemode: string;
  forceGamemode: boolean;
  hardcore: boolean;
  allowFlight: boolean;
  pvp: boolean;
  spawnProtection: number;
  commandBlocks: boolean;
  whitelist: boolean;
  enforceWhitelist: boolean;
  functionPermissionLevel: number;
  opPermissionLevel: number;
  playerIdleTimeout: number;
  pauseWhenEmptySeconds: number;
  onlineMode: boolean;
  enforceSecureProfile: boolean;
  hideOnlinePlayers: boolean;
  preventProxyConnections: boolean;
  logIps: boolean;
  acceptsTransfers: boolean;
  enableStatus: boolean;
  statusHeartbeatInterval: number;
  broadcastConsoleToOps: boolean;
  broadcastRconToOps: boolean;
  enableCodeOfConduct: boolean;
  enableJmxMonitoring: boolean;
  enableQuery: boolean;
  queryPort: number;
  enableRcon: boolean;
  rconPort: number;
  rconPassword: string;
  rateLimit: number;
  networkCompressionThreshold: number;
  resourcePack: string;
  resourcePackPrompt: string;
  resourcePackSha1: string;
  resourcePackId: string;
  requireResourcePack: boolean;
  initialEnabledPacks: string;
  initialDisabledPacks: string;
  textFilteringConfig: string;
  textFilteringVersion: number;
  viewDistance: number;
  simulationDistance: number;
  memory: number;
  levelName: string;
  levelType: string;
  seed: string;
  generatorSettings: string;
  maxWorldSize: number;
  generateStructures: boolean;
  spawnAnimals: boolean;
  spawnMonsters: boolean;
  spawnNpcs: boolean;
  entityBroadcastRangePercentage: number;
  maxChainedNeighborUpdates: number;
  maxTickTime: number;
  syncChunkWrites: boolean;
  useNativeTransport: boolean;
  regionFileCompression: string;
};

type ServerLike = ServerDetail & Record<string, unknown>;

function text(data: ServerLike, key: string, fallback = "") {
  const value = data[key];
  return typeof value === "string" ? value : fallback;
}

function numberValue(data: ServerLike, key: string, fallback: number) {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(data: ServerLike, key: string, fallback: boolean) {
  const value = data[key];
  return typeof value === "boolean" ? value : fallback;
}

export function defaultServerProperties(data: ServerLike = {} as ServerLike): ServerProperties {
  const port = numberValue(data, "port", 25565);
  return {
    name: text(data, "name", "Minecraft Server"),
    port,
    serverIp: text(data, "serverIp"),
    motd: text(data, "motd", "A Minecraft Server"),
    bugReportLink: text(data, "bugReportLink"),
    maxPlayers: numberValue(data, "maxPlayers", 20),
    difficulty: text(data, "difficulty", "normal"),
    gamemode: text(data, "gamemode", "survival"),
    forceGamemode: booleanValue(data, "forceGamemode", false),
    hardcore: booleanValue(data, "hardcore", false),
    allowFlight: booleanValue(data, "allowFlight", false),
    pvp: booleanValue(data, "pvp", true),
    spawnProtection: numberValue(data, "spawnProtection", 16),
    commandBlocks: booleanValue(data, "commandBlocks", true),
    whitelist: booleanValue(data, "whitelist", false),
    enforceWhitelist: booleanValue(data, "enforceWhitelist", false),
    functionPermissionLevel: numberValue(data, "functionPermissionLevel", 2),
    opPermissionLevel: numberValue(data, "opPermissionLevel", 4),
    playerIdleTimeout: numberValue(data, "playerIdleTimeout", 0),
    pauseWhenEmptySeconds: numberValue(data, "pauseWhenEmptySeconds", 60),
    onlineMode: booleanValue(data, "onlineMode", true),
    enforceSecureProfile: booleanValue(data, "enforceSecureProfile", true),
    hideOnlinePlayers: booleanValue(data, "hideOnlinePlayers", false),
    preventProxyConnections: booleanValue(data, "preventProxyConnections", false),
    logIps: booleanValue(data, "logIps", true),
    acceptsTransfers: booleanValue(data, "acceptsTransfers", false),
    enableStatus: booleanValue(data, "enableStatus", true),
    statusHeartbeatInterval: numberValue(data, "statusHeartbeatInterval", 0),
    broadcastConsoleToOps: booleanValue(data, "broadcastConsoleToOps", true),
    broadcastRconToOps: booleanValue(data, "broadcastRconToOps", true),
    enableCodeOfConduct: booleanValue(data, "enableCodeOfConduct", false),
    enableJmxMonitoring: booleanValue(data, "enableJmxMonitoring", false),
    enableQuery: booleanValue(data, "enableQuery", false),
    queryPort: numberValue(data, "queryPort", port),
    enableRcon: booleanValue(data, "enableRcon", false),
    rconPort: numberValue(data, "rconPort", 25575),
    rconPassword: text(data, "rconPassword"),
    rateLimit: numberValue(data, "rateLimit", 0),
    networkCompressionThreshold: numberValue(data, "networkCompressionThreshold", 256),
    resourcePack: text(data, "resourcePack"),
    resourcePackPrompt: text(data, "resourcePackPrompt"),
    resourcePackSha1: text(data, "resourcePackSha1"),
    resourcePackId: text(data, "resourcePackId"),
    requireResourcePack: booleanValue(data, "requireResourcePack", false),
    initialEnabledPacks: text(data, "initialEnabledPacks", "vanilla"),
    initialDisabledPacks: text(data, "initialDisabledPacks"),
    textFilteringConfig: text(data, "textFilteringConfig"),
    textFilteringVersion: numberValue(data, "textFilteringVersion", 0),
    viewDistance: numberValue(data, "viewDistance", 10),
    simulationDistance: numberValue(data, "simulationDistance", 10),
    memory: numberValue(data, "memory", 4),
    levelName: text(data, "levelName", "world"),
    levelType: text(data, "levelType", "default"),
    seed: text(data, "seed"),
    generatorSettings: text(data, "generatorSettings"),
    maxWorldSize: numberValue(data, "maxWorldSize", 29999984),
    generateStructures: booleanValue(data, "generateStructures", true),
    spawnAnimals: booleanValue(data, "spawnAnimals", true),
    spawnMonsters: booleanValue(data, "spawnMonsters", true),
    spawnNpcs: booleanValue(data, "spawnNpcs", true),
    entityBroadcastRangePercentage: numberValue(data, "entityBroadcastRangePercentage", 100),
    maxChainedNeighborUpdates: numberValue(data, "maxChainedNeighborUpdates", 1000000),
    maxTickTime: numberValue(data, "maxTickTime", 60000),
    syncChunkWrites: booleanValue(data, "syncChunkWrites", true),
    useNativeTransport: booleanValue(data, "useNativeTransport", true),
    regionFileCompression: text(data, "regionFileCompression", "deflate"),
  };
}

export function areServerPropertiesDirty(current: ServerProperties, baseline: ServerProperties) {
  return Object.keys(baseline).some((key) => current[key as keyof ServerProperties] !== baseline[key as keyof ServerProperties]);
}

export function effectiveServerStatus(server: ServerLike | undefined) {
  const status = typeof server?.status === "string" ? server.status : undefined;
  const runtime = server?.runtime;
  const runtimeStatus = runtime && typeof runtime === "object" && "status" in runtime ? runtime.status : undefined;
  if (status && !["running", "stopped"].includes(status)) return status;
  return typeof runtimeStatus === "string" ? runtimeStatus : status || "unknown";
}
