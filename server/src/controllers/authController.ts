// Capa HTTP para perfil autenticado (Firebase ID token).
import { Request, Response } from "express";
import { logError } from "../logger";
import { AuthService } from "../services/authService";
import { UpdateProfileDto } from "../types/auth";
import { sendApiError } from "../utils/apiResponse";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  me = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    try {
      const user = await this.service.getProfile(userId);
      if (!user) {
        sendApiError(res, 404, "USER_NOT_FOUND", "Usuario no encontrado");
        return;
      }
      res.status(200).json({ data: user });
    } catch (err) {
      logError("AuthController.me", err);
      sendApiError(res, 500, "PROFILE_LOAD_FAILED", "No se pudo cargar el perfil");
    }
  };

  patchMe = async (req: Request, res: Response) => {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      sendApiError(res, 401, "AUTH_REQUIRED", "No autorizado");
      return;
    }

    const body = req.body as Record<string, unknown>;
    const patch: UpdateProfileDto = {};

    if ("name" in body) {
      if (typeof body.name !== "string") {
        sendApiError(res, 400, "INVALID_PROFILE_NAME", "El nombre no es válido");
        return;
      }
      if (!body.name.trim()) {
        sendApiError(res, 400, "INVALID_PROFILE_NAME", "El nombre no puede estar vacío");
        return;
      }
      if (body.name.length > 160) {
        sendApiError(res, 400, "INVALID_PROFILE_NAME", "El nombre es demasiado largo");
        return;
      }
      patch.name = body.name;
    }

    if ("lastName" in body) {
      if (typeof body.lastName !== "string") {
        sendApiError(res, 400, "INVALID_PROFILE_LASTNAME", "El apellido no es válido");
        return;
      }
      if (body.lastName.length > 160) {
        sendApiError(res, 400, "INVALID_PROFILE_LASTNAME", "El apellido es demasiado largo");
        return;
      }
      patch.lastName = body.lastName;
    }

    if ("avatarUrl" in body) {
      if (body.avatarUrl === null) {
        patch.avatarUrl = null;
      } else if (typeof body.avatarUrl === "string") {
        patch.avatarUrl = body.avatarUrl;
      } else {
        sendApiError(res, 400, "INVALID_AVATAR_URL", "La foto de perfil no es válida");
        return;
      }
    }

    if (patch.avatarUrl !== undefined && patch.avatarUrl !== null) {
      if (patch.avatarUrl.length > 200_000) {
        sendApiError(res, 400, "AVATAR_TOO_LARGE", "La imagen de perfil es demasiado grande");
        return;
      }
      const okData =
        patch.avatarUrl.startsWith("data:image/jpeg;base64,") ||
        patch.avatarUrl.startsWith("data:image/png;base64,") ||
        patch.avatarUrl.startsWith("data:image/webp;base64,");
      const okHttp = /^https?:\/\//i.test(patch.avatarUrl);
      if (!okData && !okHttp) {
        sendApiError(
          res,
          400,
          "INVALID_AVATAR_URL",
          "La foto debe ser una imagen (JPEG, PNG o WebP) o una URL http(s)"
        );
        return;
      }
    }

    try {
      const user = await this.service.updateProfile(userId, patch);
      if (!user) {
        sendApiError(res, 404, "USER_NOT_FOUND", "Usuario no encontrado");
        return;
      }
      res.status(200).json({ data: user });
    } catch (err) {
      logError("AuthController.patchMe", err);
      sendApiError(res, 500, "PROFILE_UPDATE_FAILED", "No se pudo actualizar el perfil");
    }
  };
}
