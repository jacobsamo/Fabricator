import { get, post } from "@/api/client";
import { playitStatusSchema } from "@/api/schemas";

export async function getPlayitStatus() {
  return playitStatusSchema.parse(await get("/api/playit/status"));
}

export async function startPlayit() {
  return playitStatusSchema.parse(await post("/api/playit/start"));
}

export async function stopPlayit() {
  return playitStatusSchema.parse(await post("/api/playit/stop"));
}

export async function resetPlayit() {
  return playitStatusSchema.parse(await post("/api/playit/reset"));
}
