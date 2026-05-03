// Mensajes legibles para códigos comunes de Firebase Auth.
import { FirebaseError } from "firebase/app";

export function formatFirebaseAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/operation-not-allowed":
        return "El proveedor Correo/contraseña no está activado en Firebase. Consola Firebase → Authentication → Sign-in method.";
      case "auth/email-already-in-use":
        return "Ese correo ya está registrado en Firebase. Inicia sesión o usa otro correo.";
      case "auth/invalid-email":
        return "El correo no tiene un formato válido.";
      case "auth/weak-password":
        return "La contraseña es demasiado débil (usa al menos 6 caracteres).";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Correo o contraseña incorrectos.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
      case "auth/network-request-failed":
        return "Error de red. Comprueba tu conexión.";
      default:
        return error.message || "Error de autenticación.";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ha ocurrido un error inesperado.";
}
