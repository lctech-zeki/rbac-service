import {
  db,
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
} from "../db";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create Admin Role
  const [adminRole] = await db
    .insert(roles)
    .values({
      name: "admin",
      description: "Super administrator with all permissions",
    })
    .onConflictDoUpdate({
      target: roles.name,
      set: { description: "Super administrator with all permissions" },
    })
    .returning();

  console.log(`✅ Role created: ${adminRole.name}`);

  // 2. Create Permissions
  const resources = ["users", "roles", "permissions"];
  const actions = ["create", "read", "update", "delete"];

  const permsToInsert = resources.flatMap((resource) =>
    actions.map((action) => ({
      resource,
      action,
      description: `Can ${action} ${resource}`,
    })),
  );

  for (const perm of permsToInsert) {
    const [p] = await db
      .insert(permissions)
      .values(perm)
      .onConflictDoUpdate({
        target: [permissions.resource, permissions.action],
        set: { description: perm.description },
      })
      .returning();

    // 3. Assign Permission to Admin Role
    await db
      .insert(rolePermissions)
      .values({
        roleId: adminRole.id,
        permissionId: p.id,
      })
      .onConflictDoNothing();
  }

  console.log(
    `✅ ${permsToInsert.length} permissions created and assigned to admin`,
  );

  // 4. Create Admin User
  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@example.com",
      username: "admin",
      passwordHash: await Bun.password.hash("admin"),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        username: "admin",
        passwordHash: await Bun.password.hash("admin"),
      },
    })
    .returning();

  console.log(`✅ User created: ${adminUser.email}`);

  // 5. Assign Admin Role to Admin User
  await db
    .insert(userRoles)
    .values({
      userId: adminUser.id,
      roleId: adminRole.id,
    })
    .onConflictDoNothing();

  console.log("✅ Admin user linked to admin role");
  console.log("🚀 Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
