import "dotenv/config";
import { auth } from "../src/server/better-auth/config";

async function createUser(
  email: string,
  password: string,
  name: string,
  role: string,
  locationId?: string,
) {
  try {
    const body: Record<string, unknown> = { email, password, name, role };
    if (locationId) body.locationId = locationId;

    const result = await (auth.api.signUpEmail as any)({
      body,
    });

    if (result.user) {
      console.log(`✅ ${role} user created: ${email} / ${password}`);
    }
    return result.user;
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log(`ℹ️  User ${email} already exists`);
    } else {
      throw e;
    }
  }
}

async function main() {
  await createUser("admin@safeops.com", "admin123", "Administrador", "ADMIN");
  await createUser("user@safeops.com", "user1234", "Usuário Padrão", "USER");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
