import { database } from "../../../storage/database";
import { BaseRepository } from "../../../storage/repositories/base.repository";
import { ChannelPlaylist, CreatePlaylistInput, UpdatePlaylistInput, PlaylistVideo } from "../youtube.types";
import { StringUtil } from "../../../../shared/utils/string";

interface ChannelPlaylistRow {
  id: string;
  channel_id: string;
  playlist_id: string | null;
  name: string;
  description: string | null;
  video_count: number;
  is_public: number;
  created_at: string;
  updated_at: string;
}

interface PlaylistVideoRow {
  id: string;
  playlist_id: string;
  video_id: string;
  position: number | null;
  added_at: string;
}

/**
 * Repository for ChannelPlaylist entities
 */
export class ChannelPlaylistRepository extends BaseRepository<ChannelPlaylist> {
  constructor() {
    super("channel_playlists", database.getSQLiteDatabase());
  }

  protected rowToEntity(row: ChannelPlaylistRow): ChannelPlaylist {
    return {
      id: row.id,
      channelId: row.channel_id,
      playlistId: row.playlist_id || undefined,
      name: row.name,
      description: row.description || undefined,
      videoCount: row.video_count,
      isPublic: row.is_public === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected entityToRow(entity: Partial<ChannelPlaylist>): Partial<ChannelPlaylistRow> {
    const row: Partial<ChannelPlaylistRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.channelId) row.channel_id = entity.channelId;
    if (entity.playlistId !== undefined) row.playlist_id = entity.playlistId || null;
    if (entity.name) row.name = entity.name;
    if (entity.description !== undefined) row.description = entity.description || null;
    if (entity.videoCount !== undefined) row.video_count = entity.videoCount;
    if (entity.isPublic !== undefined) row.is_public = entity.isPublic ? 1 : 0;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  /**
   * Find playlists by channel ID
   */
  async findByChannelId(channelId: string): Promise<ChannelPlaylist[]> {
    const rows = await this.db.all<ChannelPlaylistRow>(
      `SELECT * FROM ${this.tableName} WHERE channel_id = ? ORDER BY created_at DESC`,
      [channelId]
    );
    return rows.map(row => this.rowToEntity(row));
  }

  /**
   * Create new playlist
   */
  async create(input: CreatePlaylistInput): Promise<ChannelPlaylist> {
    const now = new Date();
    const playlist: ChannelPlaylist = {
      id: StringUtil.generateId("playlist"),
      channelId: input.channelId,
      playlistId: input.playlistId,
      name: input.name,
      description: input.description,
      videoCount: 0,
      isPublic: input.isPublic !== undefined ? input.isPublic : true,
      createdAt: now,
      updatedAt: now,
    };

    await this.insert(playlist);
    return playlist;
  }

  /**
   * Update playlist
   */
  async updatePlaylist(id: string, updates: UpdatePlaylistInput): Promise<ChannelPlaylist | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Partial<ChannelPlaylist> = {
      ...updates,
      updatedAt: new Date(),
    };

    await this.update(id, updated);
    return this.findById(id);
  }

  /**
   * Add video to playlist
   */
  async addVideoToPlaylist(playlistId: string, videoId: string, position?: number): Promise<PlaylistVideo> {
    const id = StringUtil.generateId("pv");
    const addedAt = new Date().toISOString();

    await this.db.run(
      `INSERT INTO playlist_videos (id, playlist_id, video_id, position, added_at) VALUES (?, ?, ?, ?, ?)`,
      [id, playlistId, videoId, position || null, addedAt]
    );

    // Update video count
    await this.db.run(
      `UPDATE channel_playlists SET video_count = video_count + 1, updated_at = ? WHERE id = ?`,
      [addedAt, playlistId]
    );

    return {
      id,
      playlistId,
      videoId,
      position,
      addedAt: new Date(addedAt),
    };
  }

  /**
   * Remove video from playlist
   */
  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    const result = await this.db.run(
      `DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ?`,
      [playlistId, videoId]
    );

    if (result.changes && result.changes > 0) {
      // Update video count
      await this.db.run(
        `UPDATE channel_playlists SET video_count = video_count - 1, updated_at = ? WHERE id = ?`,
        [new Date().toISOString(), playlistId]
      );
      return true;
    }

    return false;
  }

  /**
   * Get videos in playlist
   */
  async getPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
    const rows = await this.db.all<PlaylistVideoRow>(
      `SELECT * FROM playlist_videos WHERE playlist_id = ? ORDER BY position, added_at`,
      [playlistId]
    );

    return rows.map(row => ({
      id: row.id,
      playlistId: row.playlist_id,
      videoId: row.video_id,
      position: row.position || undefined,
      addedAt: new Date(row.added_at),
    }));
  }
}

// Export singleton instance
export const channelPlaylistRepository = new ChannelPlaylistRepository();
