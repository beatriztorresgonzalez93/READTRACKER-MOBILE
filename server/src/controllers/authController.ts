// Capa HTTP para registro, login y perfil autenticado.
import { Request, Response } from "express";
import { logError } from "../logger";
import { AuthService } from "../services/authService";
import { UpdateProfileDto } from "../types/auth";
import { sendApiError } from "../utils/apiResponse";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body as Record<string, unknown>;
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 6
    ) {
      sendApiError(
        res,
        400,
        "INVALID_REGISTER_PAYLOAD",
        "Nombre, email y contraseña (mínimo 6 caracteres) son obligatorios"
      );
      return;
    }

    try {
      const data = await this.service.register({ name, email, password });
      res.status(201).json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo registrar el usuario";
      const status = message.includes("Ya existe") ? 409 : 500;
      if (status === 500) {
        logError("AuthController.register", err);
      }
      sendApiError(
        res,
        status,
        status === 409 ? "USER_ALREADY_EXISTS" : "REGISTER_FAILED",
        message
      );
    }
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      sendApiError(res, 400, "INVALID_LOGIN_PAYLOAD", "Email y contraseña son obligatorios");
      return;
    }

    try {
      const data = await this.service.login({ email, password });
      res.status(200).json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión";
      const status = message.includes("incorrectos") ? 401 : 500;
      if (status === 500) {
        logError("AuthController.login", err);
      }
      sendApiError(
        res,
        status,
        status === 401 ? "INVALID_CREDENTIALS" : "LOGIN_FAILED",
        message
      );
    }
  };

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
