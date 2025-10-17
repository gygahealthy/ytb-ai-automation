import { ApiResponse } from "../../../../shared/types";
import { logger } from "../../../utils/logger-backend";
import {
  promptTypesRepository,
  MasterPromptType,
  CreateMasterPromptTypeInput,
  UpdateMasterPromptTypeInput,
} from "../repository/master-prompt-types.repository";

/**
 * Master Prompt Types Service
 * Handles business logic for managing prompt types
 */
export class MasterPromptTypesService {
  /**
   * Get all prompt types
   */
  async getAllTypes(): Promise<ApiResponse<MasterPromptType[]>> {
    try {
      const types = await promptTypesRepository.getAll();
      return { success: true, data: types };
    } catch (error) {
      logger.error("[prompt-types.service] Failed to get all types", error);
      return { success: false, error: "Failed to retrieve prompt types" };
    }
  }

  /**
   * Get prompt type by ID
   */
  async getTypeById(
    id: number
  ): Promise<ApiResponse<MasterPromptType | undefined>> {
    try {
      if (!id || id <= 0) {
        return { success: false, error: "Invalid prompt type ID" };
      }

      const type = await promptTypesRepository.getById(id);
      if (!type) {
        return { success: false, error: "Prompt type not found" };
      }

      return { success: true, data: type };
    } catch (error) {
      logger.error("[prompt-types.service] Failed to get type by ID", error);
      return { success: false, error: "Failed to retrieve prompt type" };
    }
  }

  /**
   * Get prompt type by name
   */
  async getTypeByName(
    typeName: string
  ): Promise<ApiResponse<MasterPromptType | undefined>> {
    try {
      if (!typeName || typeName.trim() === "") {
        return { success: false, error: "Type name is required" };
      }

      const type = await promptTypesRepository.getByName(typeName);
      if (!type) {
        return { success: false, error: "Prompt type not found" };
      }

      return { success: true, data: type };
    } catch (error) {
      logger.error("[prompt-types.service] Failed to get type by name", error);
      return { success: false, error: "Failed to retrieve prompt type" };
    }
  }

  /**
   * Create new prompt type
   */
  async createType(
    input: CreateMasterPromptTypeInput
  ): Promise<ApiResponse<MasterPromptType>> {
    try {
      // Validate input
      if (!input.typeName || input.typeName.trim() === "") {
        return { success: false, error: "Type name is required" };
      }
      if (!input.typeCode || input.typeCode.trim() === "") {
        return { success: false, error: "Type code is required" };
      }

      // Check if type already exists by name
      const existsByName = await promptTypesRepository.exists(input.typeName);
      if (existsByName) {
        return { success: false, error: "Prompt type name already exists" };
      }

      // Check if type code already exists
      const existsByCode = await promptTypesRepository.existsByCode(
        input.typeCode
      );
      if (existsByCode) {
        return { success: false, error: "Type code already exists" };
      }

      // Create the type
      const newType = await promptTypesRepository.create({
        typeName: input.typeName.trim(),
        typeCode: input.typeCode.trim(),
        description: input.description?.trim() || "",
        status: input.status ?? 1,
      });

      logger.info("[prompt-types.service] Created new prompt type", {
        typeName: newType.typeName,
        typeCode: newType.typeCode,
        id: newType.id,
      });
      return { success: true, data: newType };
    } catch (error) {
      logger.error(
        "[prompt-types.service] Failed to create prompt type",
        error
      );
      return { success: false, error: "Failed to create prompt type" };
    }
  }

  /**
   * Update prompt type
   */
  async updateType(
    id: number,
    updates: UpdateMasterPromptTypeInput
  ): Promise<ApiResponse<MasterPromptType>> {
    try {
      // Validate input
      if (!id || id <= 0) {
        return { success: false, error: "Invalid prompt type ID" };
      }

      // Check if type exists
      const existing = await promptTypesRepository.getById(id);
      if (!existing) {
        return { success: false, error: "Prompt type not found" };
      }

      // If updating type name, check if new name already exists
      if (updates.typeName && updates.typeName !== existing.typeName) {
        const nameExists = await promptTypesRepository.exists(updates.typeName);
        if (nameExists) {
          return { success: false, error: "Type name already exists" };
        }
      }

      // If updating type code, check if new code already exists
      if (updates.typeCode && updates.typeCode !== existing.typeCode) {
        const codeExists = await promptTypesRepository.existsByCode(
          updates.typeCode
        );
        if (codeExists) {
          return { success: false, error: "Type code already exists" };
        }
      }

      // Update the type
      const updated = await promptTypesRepository.update(id, {
        typeName: updates.typeName?.trim(),
        typeCode: updates.typeCode?.trim(),
        description: updates.description?.trim(),
        status: updates.status,
      });

      if (!updated) {
        return { success: false, error: "Failed to update prompt type" };
      }

      logger.info("[prompt-types.service] Updated prompt type", {
        id,
        typeName: updated.typeName,
        typeCode: updated.typeCode,
      });
      return { success: true, data: updated };
    } catch (error) {
      logger.error(
        "[prompt-types.service] Failed to update prompt type",
        error
      );
      return { success: false, error: "Failed to update prompt type" };
    }
  }

  /**
   * Delete prompt type
   */
  async deleteType(id: number): Promise<ApiResponse<boolean>> {
    try {
      // Validate input
      if (!id || id <= 0) {
        return { success: false, error: "Invalid prompt type ID" };
      }

      // Check if type exists
      const existing = await promptTypesRepository.getById(id);
      if (!existing) {
        return { success: false, error: "Prompt type not found" };
      }

      // Delete the type
      const deleted = await promptTypesRepository.delete(id);

      if (!deleted) {
        return { success: false, error: "Failed to delete prompt type" };
      }

      logger.info("[prompt-types.service] Deleted prompt type", {
        id,
        typeName: existing.typeName,
      });
      return { success: true, data: deleted };
    } catch (error) {
      logger.error(
        "[prompt-types.service] Failed to delete prompt type",
        error
      );
      return { success: false, error: "Failed to delete prompt type" };
    }
  }
}

// Export singleton instance
export const promptTypesService = new MasterPromptTypesService();
