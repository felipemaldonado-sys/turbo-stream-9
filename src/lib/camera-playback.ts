import { relayHlsPlaybackUrl } from "@/lib/media-config";
import {
  buildTwitchPlayerUrl,
  collectParentHostsForEmbed,
  parseTwitchChannelFromUrl,
} from "@/lib/twitch-embed";
import type { CameraRecord, PlaybackPayload } from "@/lib/types/camera";

/** Construye el JSON de reproducción para una cámara (misma lógica en público y admin). */
export function buildPlaybackPayload(c: CameraRecord, request: Request): PlaybackPayload {
  const useRelay = Boolean(c.ingestKey?.trim());
  if (useRelay) {
    return {
      playbackUrl: relayHlsPlaybackUrl(c.ingestKey!),
      streamType: "hls",
    };
  }

  const twitchChannel = parseTwitchChannelFromUrl(c.sourceUrl);
  if (twitchChannel) {
    const parents = collectParentHostsForEmbed(request);
    return {
      playbackUrl: buildTwitchPlayerUrl(twitchChannel, parents),
      streamType: "iframe",
      twitchChannel,
    };
  }

  return {
    playbackUrl: c.sourceUrl,
    streamType: c.streamType,
  };
}
