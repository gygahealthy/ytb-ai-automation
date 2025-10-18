/**
 * Gems Module Types
 * Types for Gemini Gems (system prompts)
 */

/**
 * Gem object representing a system prompt
 */
export interface Gem {
  id: string;
  name: string;
  description: string;
  prompt: string | null; // System instructions
  predefined: boolean; // Whether it's a system gem or user-created
}

/**
 * Gem collection for filtering and searching
 */
export class GemJar {
  private gemsMap: Map<string, Gem>;

  constructor(gems: Array<[string, Gem]>) {
    this.gemsMap = new Map(gems);
  }

  /**
   * Get all gems as an array
   */
  all(): Gem[] {
    return Array.from(this.gemsMap.values());
  }

  /**
   * Filter gems by predefined status
   */
  filter(options: { predefined?: boolean }): GemJar {
    const filtered: Array<[string, Gem]> = [];

    for (const [id, gem] of this.gemsMap.entries()) {
      if (
        options.predefined === undefined ||
        gem.predefined === options.predefined
      ) {
        filtered.push([id, gem]);
      }
    }

    return new GemJar(filtered);
  }

  /**
   * Get a gem by ID or name
   */
  get(options: { id?: string; name?: string }): Gem | null {
    if (options.id) {
      return this.gemsMap.get(options.id) || null;
    }

    if (options.name) {
      for (const gem of this.gemsMap.values()) {
        if (gem.name.toLowerCase() === options.name.toLowerCase()) {
          return gem;
        }
      }
    }

    return null;
  }

  /**
   * Get count of gems
   */
  get length(): number {
    return this.gemsMap.size;
  }
}

/**
 * Options for creating a gem
 */
export interface CreateGemOptions {
  name: string;
  prompt: string; // System instructions
  description?: string;
}

/**
 * Options for updating a gem
 */
export interface UpdateGemOptions {
  gem: Gem | string; // Gem object or gem ID
  name: string;
  prompt: string;
  description?: string;
}

/**
 * RPC request data for batch execution
 */
export interface RPCData {
  rpcid: string;
  payload: string;
  identifier?: string;
}
